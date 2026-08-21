extends Node
## Headless test harness for the match-3 core.
##
## Run with:
##   godot --headless --path . res://tests/TestRunner.tscn
##
## It exercises the rules engine against hand-built boards, then plays a real
## board for dozens of moves and asserts the invariants that keep the game
## playable. Exits non-zero if anything fails, so it can gate a build.

var _failures := 0
var _checks := 0


func _ready() -> void:
	_test_match_detection()
	_test_special_rules()
	_test_level_data()
	_test_save_round_trip()
	_test_board_generation()
	await _test_gameplay_loop()
	_report()


func _check(condition: bool, description: String) -> void:
	_checks += 1
	if condition:
		print("  ok   %s" % description)
	else:
		_failures += 1
		printerr("  FAIL %s" % description)


## Builds a type grid from rows of digits; rows_text[y] has one digit per column.
func _grid_from(rows_text: Array) -> Array:
	var height := rows_text.size()
	var width := String(rows_text[0]).length()
	var types: Array = []
	for x in width:
		var column: Array = []
		column.resize(height)
		for y in height:
			column[y] = int(String(rows_text[y])[x])
		types.append(column)
	return types


func _test_match_detection() -> void:
	print("MatchManager")
	var horizontal := _grid_from(["111234", "234561", "345612", "456123"])
	var runs := MatchManager.find_runs(horizontal, 6, 4)
	_check(runs.size() == 1, "one horizontal run of three is found")
	_check(int(runs[0]["length"]) == 3, "run length is reported as 3")
	_check(int(runs[0]["orientation"]) == MatchManager.Orientation.HORIZONTAL, "run is horizontal")

	var vertical := _grid_from(["129456", "239561", "349612", "456123"])
	var vruns := MatchManager.find_runs(vertical, 6, 4)
	_check(vruns.size() == 1, "one vertical run of three is found")
	_check(int(vruns[0]["orientation"]) == MatchManager.Orientation.VERTICAL, "run is vertical")

	var five := MatchManager.find_runs(_grid_from(["777776", "234561", "345612", "456123"]), 6, 4)
	_check(five.size() == 1 and int(five[0]["length"]) == 5, "a five-in-a-row is reported as one run of 5")

	var shape := _grid_from(["888456", "834561", "845612", "456123"])
	var lruns := MatchManager.find_runs(shape, 6, 4)
	_check(lruns.size() == 2, "an L shape reports both of its runs")
	_check(MatchManager.cells_in_runs(lruns).size() == 5, "the shared corner is only cleared once")

	var clean := _grid_from(["123456", "234561", "345612", "456123"])
	_check(MatchManager.find_runs(clean, 6, 4).is_empty(), "a clean board reports no runs")

	var partial := _grid_from(["113456", "234561", "345612"])
	_check(MatchManager.creates_match(partial, 6, 3, Vector2i(2, 0), 1),
		"creates_match sees a piece that would complete a line")
	_check(not MatchManager.creates_match(partial, 6, 3, Vector2i(2, 0), 5),
		"creates_match ignores a piece that would not")

	_check(not MatchManager.has_possible_move(_grid_from(["123"]), 3, 1),
		"a board with no productive swap reports none")
	var alive := _grid_from(["1121", "3456"])
	_check(MatchManager.has_possible_move(alive, 4, 2), "a board with a swap available reports one")
	var hint := MatchManager.find_hint(alive, 4, 2)
	_check(hint.size() == 2, "find_hint returns a pair of cells")
	var carried: int = alive[hint[0].x][hint[0].y]
	alive[hint[0].x][hint[0].y] = alive[hint[1].x][hint[1].y]
	alive[hint[1].x][hint[1].y] = carried
	_check(not MatchManager.find_runs(alive, 4, 2).is_empty(), "the suggested swap really does match")


func _test_special_rules() -> void:
	print("SpecialPieceManager")
	var run_four := {"length": 4, "orientation": MatchManager.Orientation.HORIZONTAL,
		"cells": [Vector2i(0, 0), Vector2i(1, 0), Vector2i(2, 0), Vector2i(3, 0)], "type": 1}
	_check(SpecialPieceManager.promotion_for(run_four) == PieceKind.Special.LINE_H,
		"a horizontal four creates a row clearer")
	var run_four_v := {"length": 4, "orientation": MatchManager.Orientation.VERTICAL,
		"cells": [Vector2i(0, 0), Vector2i(0, 1), Vector2i(0, 2), Vector2i(0, 3)], "type": 1}
	_check(SpecialPieceManager.promotion_for(run_four_v) == PieceKind.Special.LINE_V,
		"a vertical four creates a column clearer")
	var run_five := {"length": 5, "orientation": MatchManager.Orientation.VERTICAL,
		"cells": [Vector2i(0, 0), Vector2i(0, 1), Vector2i(0, 2), Vector2i(0, 3), Vector2i(0, 4)], "type": 1}
	_check(SpecialPieceManager.promotion_for(run_five) == PieceKind.Special.RAINBOW,
		"a five creates the rainbow special")
	var run_three := {"length": 3, "orientation": MatchManager.Orientation.HORIZONTAL,
		"cells": [Vector2i(0, 0), Vector2i(1, 0), Vector2i(2, 0)], "type": 1}
	_check(SpecialPieceManager.promotion_for(run_three) == PieceKind.Special.NONE,
		"a plain three creates nothing")
	_check(SpecialPieceManager.promotion_cell(run_four, [Vector2i(3, 0)] as Array[Vector2i]) == Vector2i(3, 0),
		"the special appears on the cell the player moved")
	_check(SpecialPieceManager.promotion_cell(run_four, [] as Array[Vector2i]) == Vector2i(2, 0),
		"with no moved cell the special lands mid-run")

	var types := _grid_from(["123456", "234561", "345612", "456123"])
	_check(SpecialPieceManager.cells_cleared_by(PieceKind.Special.LINE_H, Vector2i(2, 1), types, 6, 4).size() == 6,
		"a row clearer takes the whole row")
	_check(SpecialPieceManager.cells_cleared_by(PieceKind.Special.LINE_V, Vector2i(2, 1), types, 6, 4).size() == 4,
		"a column clearer takes the whole column")
	var rainbow := SpecialPieceManager.cells_cleared_by(PieceKind.Special.RAINBOW, Vector2i(0, 0), types, 6, 4, 3)
	var only_threes := true
	for cell: Vector2i in rainbow:
		if cell != Vector2i(0, 0) and types[cell.x][cell.y] != 3:
			only_threes = false
	_check(rainbow.size() == 5 and only_threes, "the rainbow takes every piece of the chosen type, plus itself")


func _test_level_data() -> void:
	print("Levels")
	var levels := LevelLibrary.build()
	_check(levels.size() == 10, "the prototype ships 10 levels")
	var ids := {}
	var well_formed := true
	for level: LevelData in levels:
		ids[level.id] = true
		if level.moves <= 0:
			well_formed = false
		if level.objective == LevelData.Objective.SCORE and level.target_score <= 0:
			well_formed = false
		if level.objective == LevelData.Objective.COLLECT and level.target_count <= 0:
			well_formed = false
	_check(ids.size() == 10, "level ids are unique")
	_check(well_formed, "every level has moves and a target")
	_check(levels[0].objective_text() == "Reach 900 points", "score objectives read naturally")
	_check(levels[2].objective_text() == "Clear 16 bandages", "collect objectives name the piece")
	_check(levels[4].objective_text() == "Reach 1,700 points", "large numbers are grouped")
	_check(levels[0].stars_for(9) == 3 and levels[0].stars_for(5) == 2 and levels[0].stars_for(1) == 1,
		"stars are earned by finishing with moves to spare")
	_check(LevelManager.count() == 10 and LevelManager.next_level_id(10) == 0,
		"LevelManager knows where the prototype ends")


func _test_save_round_trip() -> void:
	print("SaveManager")
	var unlocked_before := SaveManager.highest_unlocked
	SaveManager.record_level_result(1, 1234, 2)
	_check(SaveManager.stars_for(1) >= 2, "stars are recorded")
	_check(SaveManager.best_score_for(1) >= 1234, "the best score is recorded")
	_check(SaveManager.is_unlocked(2), "clearing a level unlocks the next one")
	SaveManager.record_level_result(1, 10, 1)
	_check(SaveManager.best_score_for(1) == 1234 and SaveManager.stars_for(1) == 2,
		"a worse replay does not overwrite the best result")
	SaveManager.load_game()
	_check(SaveManager.best_score_for(1) == 1234, "progress survives a reload from disk")
	SaveManager.reset_progress()
	_check(SaveManager.highest_unlocked == 1 and SaveManager.completed.is_empty(), "reset clears progress")
	_check(unlocked_before >= 1, "save state was readable to begin with")


func _test_board_generation() -> void:
	print("Board generation")
	var clean := true
	var playable := true
	for attempt in 30:
		var board := Board.new()
		board.size = Vector2(900, 900)
		add_child(board)
		board.generate_board()
		var types := board.type_grid()
		if not MatchManager.find_runs(types, board.columns, board.rows).is_empty():
			clean = false
		if not MatchManager.has_possible_move(types, board.columns, board.rows):
			playable = false
		board.free()
	_check(clean, "30 generated boards start with no free matches")
	_check(playable, "30 generated boards start with at least one legal move")


## Plays a real board through many moves, checking it never corrupts itself.
func _test_gameplay_loop() -> void:
	print("Gameplay loop")
	var board := Board.new()
	board.size = Vector2(900, 900)
	add_child(board)
	var scorer := ScoreManager.new()
	add_child(scorer)
	scorer.start(LevelLibrary.build()[0])
	board.setup(scorer)

	# GDScript lambdas capture locals by value, so the tally lives in a container.
	var tally := {"cleared": 0}
	board.pieces_cleared.connect(func(_type: int, count: int) -> void: tally["cleared"] += count)
	board.score_awarded.connect(func(points: int, _cell: Vector2i) -> void: scorer.add_score(points))
	board.move_spent.connect(scorer.use_move)

	var moves_played := 0
	var integrity_ok := true
	var settles_clean := true
	var target_moves := 40
	for i in target_moves:
		var hint := MatchManager.find_hint(board.type_grid(), board.columns, board.rows)
		if hint.is_empty():
			break
		board.try_swap(hint[0], hint[1])
		await board.settled
		moves_played += 1
		# Invariant 1: every cell holds a live piece that agrees with the grid.
		for x in board.columns:
			for y in board.rows:
				var piece := board.piece_at(Vector2i(x, y))
				if piece == null or not is_instance_valid(piece) or piece.grid_pos != Vector2i(x, y):
					integrity_ok = false
		var types := board.type_grid()
		# Invariant 2: a settled board never leaves an unresolved match sitting on it.
		if not MatchManager.find_runs(types, board.columns, board.rows).is_empty():
			settles_clean = false
		# Invariant 3: there is always something the player can do next.
		if not MatchManager.has_possible_move(types, board.columns, board.rows):
			settles_clean = false

	_check(moves_played == target_moves, "played %d/%d moves without the board going dead" % [moves_played, target_moves])
	_check(integrity_ok, "the grid and its pieces stay in sync across every move")
	_check(settles_clean, "the board is always fully resolved and playable once settled")
	_check(scorer.score > 0, "score accumulates (%d points)" % scorer.score)
	_check(int(tally["cleared"]) >= moves_played * 3,
		"at least three pieces cleared per move (%d total)" % int(tally["cleared"]))
	_check(scorer.moves_left == maxi(0, 20 - moves_played), "each successful swap costs exactly one move")

	# Invalid swaps must cost nothing.
	var before := scorer.moves_left
	var dud := _find_dud_swap(board)
	if dud.size() == 2:
		board.try_swap(dud[0], dud[1])
		await get_tree().create_timer(0.8).timeout
		_check(scorer.moves_left == before, "a rejected swap does not cost a move")
	else:
		_check(true, "no rejected swap available to test on this board (skipped)")


func _find_dud_swap(board: Board) -> Array[Vector2i]:
	var types := board.type_grid()
	for x in board.columns - 1:
		for y in board.rows:
			var a := Vector2i(x, y)
			var b := Vector2i(x + 1, y)
			var carried: int = types[a.x][a.y]
			types[a.x][a.y] = types[b.x][b.y]
			types[b.x][b.y] = carried
			var produces := not MatchManager.find_runs(types, board.columns, board.rows).is_empty()
			carried = types[a.x][a.y]
			types[a.x][a.y] = types[b.x][b.y]
			types[b.x][b.y] = carried
			if not produces:
				return [a, b] as Array[Vector2i]
	return [] as Array[Vector2i]


func _report() -> void:
	print("")
	if _failures == 0:
		print("PASSED — %d checks" % _checks)
	else:
		printerr("FAILED — %d of %d checks" % [_failures, _checks])
	get_tree().quit(1 if _failures > 0 else 0)
