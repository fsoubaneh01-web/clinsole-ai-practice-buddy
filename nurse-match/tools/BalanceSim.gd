extends Node
## Difficulty measurement: plays every level many times with two bots and
## reports how each one actually performs.
##
##   godot --headless --path . res://tools/BalanceSim.tscn -- --runs=40
##   godot --headless --path . res://tools/BalanceSim.tscn -- --mode=probe --runs=60
##
## The point is to replace guessed level targets with measured ones. Two bots
## bracket the real player:
##
##   NOVICE  picks a random legal swap — a floor for how badly a level can go.
##   SKILLED picks the swap that clears the most pieces, preferring the ones
##           that forge specials and the ones that serve the level's objective —
##           a ceiling a competent player can reach.
##
## A level worth shipping is one SKILLED clears comfortably and NOVICE clears
## sometimes. If NOVICE never wins it is punishing; if NOVICE always wins with
## moves to spare it is filler. Two ends of the run are held to different bars on
## purpose: the opening levels are an on-ramp and are meant to be near-certain,
## and the last level is meant to be a wall the player has to come back to.
##
## Win rates move several points between identical runs — board generation varies
## a lot — so treat a single borderline number as noise, not as a trend.
##
## `--mode=probe` answers the prior question — what is even reachable in N moves?
## It plays with no win condition and reports the distribution of score and of
## pieces cleared per type, so targets can be set from percentiles instead of
## from a hunch.

const MAX_EXTRA_MOVES := 4 ## Guard against a run that never terminates.

var _runs := 40
var _mode := "balance"


func _ready() -> void:
	for argument in OS.get_cmdline_user_args():
		if argument.begins_with("--runs="):
			_runs = maxi(1, int(argument.substr("--runs=".length())))
		elif argument.begins_with("--mode="):
			_mode = argument.substr("--mode=".length())
	if _mode == "probe":
		await _probe()
		get_tree().quit()
		return
	print("Nurse Match — balance simulation (%d runs per level per bot)\n" % _runs)
	print("LEVEL  OBJECTIVE                       MOVES  BOT      WIN%    AVG SCORE  AVG STARS  AVG MOVES USED")
	var warnings: Array[String] = []
	for level: LevelData in LevelManager.levels:
		for skilled: bool in [false, true]:
			var result := await _measure(level, skilled)
			print("%-6s %-31s %-6d %-8s %-6s %-10s %-10s %s" % [
				"%03d" % level.id,
				level.objective_text(),
				level.moves,
				"SKILLED" if skilled else "NOVICE",
				"%d%%" % int(round(result["win_rate"] * 100.0)),
				"%d" % int(result["avg_score"]),
				"%.2f" % result["avg_stars"],
				"%.1f" % result["avg_moves"],
			])
			var floor_rate := 0.60 if level.id == LevelManager.count() else 0.75
			if skilled and result["win_rate"] < floor_rate:
				warnings.append("L%03d is hard even for a skilled player (%d%%)"
					% [level.id, int(round(result["win_rate"] * 100.0))])
			var on_ramp := level.id <= 2
			if not skilled and not on_ramp and result["win_rate"] > 0.95:
				warnings.append("L%03d clears itself — a random player wins %d%% of the time"
					% [level.id, int(round(result["win_rate"] * 100.0))])
		print("")

	if warnings.is_empty():
		print("No balance warnings.")
	else:
		print("Balance warnings:")
		for warning: String in warnings:
			print("  - %s" % warning)
	get_tree().quit()


## What can a player actually reach in a given number of moves? Plays with an
## unreachable target so every run uses its full budget, then reports the spread.
func _probe() -> void:
	print("Nurse Match — reachability probe (%d runs per cell)\n" % _runs)
	for skilled: bool in [false, true]:
		print("%s" % ("SKILLED" if skilled else "NOVICE"))
		print("  MOVES   SCORE p10 / p50 / p90        CLEARED PER TYPE p10 / p50 / p90")
		for moves: int in [20, 22, 24, 25]:
			var scores: Array[int] = []
			var per_type: Array[int] = []
			for run in _runs:
				var outcome := await _probe_once(moves, skilled)
				scores.append(int(outcome["score"]))
				for type: int in PieceKind.Type.values():
					per_type.append(int(outcome["cleared"].get(type, 0)))
			scores.sort()
			per_type.sort()
			print("  %-7d %-4d / %-4d / %-4d           %-4d / %-4d / %-4d" % [
				moves,
				_percentile(scores, 0.10), _percentile(scores, 0.50), _percentile(scores, 0.90),
				_percentile(per_type, 0.10), _percentile(per_type, 0.50), _percentile(per_type, 0.90),
			])
		print("")


func _probe_once(moves: int, skilled: bool) -> Dictionary:
	var level := LevelData.new()
	level.objective = LevelData.Objective.SCORE
	level.moves = moves
	level.target_score = 1 << 30 # unreachable, so every move gets spent

	var board := Board.new()
	board.size = Vector2(900, 900)
	board.animations_enabled = false
	add_child(board)
	var scorer := ScoreManager.new()
	add_child(scorer)
	scorer.start(level)
	board.setup(scorer)

	var cleared := {}
	board.score_awarded.connect(func(points: int, _cell: Vector2i) -> void: scorer.add_score(points))
	board.pieces_cleared.connect(func(type: int, count: int) -> void:
		cleared[type] = int(cleared.get(type, 0)) + count)
	board.move_spent.connect(scorer.use_move)
	var turn := {"settled": false}
	board.settled.connect(func() -> void: turn["settled"] = true)

	for i in moves:
		var swap := _choose_move(board, skilled)
		if swap.is_empty():
			break
		turn["settled"] = false
		board.try_swap(swap[0], swap[1])
		while not turn["settled"]:
			await get_tree().process_frame

	var outcome := {"score": scorer.score, "cleared": cleared}
	board.free()
	scorer.free()
	return outcome


func _percentile(sorted_values: Array[int], fraction: float) -> int:
	if sorted_values.is_empty():
		return 0
	var index := clampi(int(round(fraction * float(sorted_values.size() - 1))), 0, sorted_values.size() - 1)
	return sorted_values[index]


func _measure(level: LevelData, skilled: bool) -> Dictionary:
	var wins := 0
	var score_total := 0
	var stars_total := 0
	var moves_total := 0
	for run in _runs:
		var outcome := await _play_once(level, skilled)
		if outcome["won"]:
			wins += 1
			stars_total += int(outcome["stars"])
		score_total += int(outcome["score"])
		moves_total += int(outcome["moves_used"])
	return {
		"win_rate": float(wins) / float(_runs),
		"avg_score": float(score_total) / float(_runs),
		"avg_stars": (float(stars_total) / float(wins)) if wins > 0 else 0.0,
		"avg_moves": float(moves_total) / float(_runs),
	}


func _play_once(level: LevelData, skilled: bool) -> Dictionary:
	var board := Board.new()
	board.size = Vector2(900, 900)
	# Resolve instantly — the simulation cares about outcomes, not easing.
	board.animations_enabled = false
	add_child(board)
	var scorer := ScoreManager.new()
	add_child(scorer)
	scorer.start(level)
	board.setup(scorer)

	board.score_awarded.connect(func(points: int, _cell: Vector2i) -> void: scorer.add_score(points))
	board.pieces_cleared.connect(scorer.register_cleared)
	board.move_spent.connect(scorer.use_move)
	# Lambdas capture by value, so shared state lives in containers.
	var verdict := {"won": false, "done": false}
	var turn := {"settled": false}
	board.settled.connect(func() -> void: turn["settled"] = true)
	scorer.level_won.connect(func() -> void:
		verdict["won"] = true
		verdict["done"] = true)
	scorer.level_lost.connect(func() -> void: verdict["done"] = true)
	board.settled.connect(scorer.evaluate)

	var moves_used := 0
	while not verdict["done"] and moves_used < level.moves + MAX_EXTRA_MOVES:
		var swap := _choose_move(board, skilled, level)
		if swap.is_empty():
			break
		turn["settled"] = false
		board.try_swap(swap[0], swap[1])
		# With animations off try_swap runs to completion synchronously, so this
		# usually costs no frames at all.
		while not turn["settled"]:
			await get_tree().process_frame
		moves_used += 1

	var outcome := {
		"won": verdict["won"],
		"score": scorer.score,
		"stars": scorer.stars(),
		"moves_used": moves_used,
	}
	board.free()
	scorer.free()
	return outcome


## NOVICE takes any legal swap; SKILLED takes the one that clears the most,
## leaning toward the four- and five-runs that forge specials and toward the
## supply the level actually asks for.
func _choose_move(board: Board, skilled: bool, level: LevelData = null) -> Array[Vector2i]:
	var types := board.type_grid()
	var candidates: Array = []
	var best_value := -1
	for x in board.columns:
		for y in board.rows:
			for offset: Vector2i in [Vector2i.RIGHT, Vector2i.DOWN]:
				var a := Vector2i(x, y)
				var b := a + offset
				if not board.in_bounds(b) or types[a.x][a.y] == types[b.x][b.y]:
					continue
				_swap(types, a, b)
				var runs := MatchManager.find_runs(types, board.columns, board.rows)
				_swap(types, a, b)
				if runs.is_empty():
					continue
				if not skilled:
					candidates.append([a, b])
					continue
				var value := 0
				for run: Dictionary in runs:
					var length: int = run["length"]
					# A four or five is worth more than its cleared count alone,
					# because the special it leaves behind pays out later.
					value += length + (6 if length >= 5 else (3 if length == 4 else 0))
					# On a collect level a player chases the right supply rather
					# than the biggest pile.
					if level and level.objective == LevelData.Objective.COLLECT \
							and int(run["type"]) == level.collect_type:
						value += length * 2
				if value > best_value:
					best_value = value
					candidates = [[a, b]]
				elif value == best_value:
					candidates.append([a, b])
	if candidates.is_empty():
		return [] as Array[Vector2i]
	var pick: Array = candidates[randi() % candidates.size()]
	return [pick[0], pick[1]] as Array[Vector2i]


func _swap(types: Array, a: Vector2i, b: Vector2i) -> void:
	var carried: int = types[a.x][a.y]
	types[a.x][a.y] = types[b.x][b.y]
	types[b.x][b.y] = carried
