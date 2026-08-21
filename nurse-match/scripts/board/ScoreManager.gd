class_name ScoreManager
extends Node
## Tracks score, remaining moves and objective progress for one level attempt.

signal score_changed(score: int)
signal moves_changed(moves_left: int)
signal objective_changed(current: int, target: int)
signal level_won()
signal level_lost()

const POINTS_MATCH_3 := 30
const POINTS_MATCH_4 := 60
const POINTS_MATCH_5 := 100
const POINTS_SPECIAL := 150
## Each extra step of a cascade adds half the base value again.
const CASCADE_BONUS_RATIO := 0.5

var level: LevelData
var score := 0
var moves_left := 0
var collected := 0
var _resolved := false


func start(level_data: LevelData) -> void:
	level = level_data
	score = 0
	collected = 0
	moves_left = level.moves
	_resolved = false
	score_changed.emit(score)
	moves_changed.emit(moves_left)
	objective_changed.emit(objective_current(), objective_target())


## Points for one cleared run. `cascade_depth` is 0 for the player's own move
## and climbs with every follow-up chain.
func points_for_run(length: int, cascade_depth: int) -> int:
	var base := POINTS_MATCH_3
	if length == 4:
		base = POINTS_MATCH_4
	elif length >= 5:
		base = POINTS_MATCH_5
	return int(round(base * (1.0 + CASCADE_BONUS_RATIO * float(cascade_depth))))


func points_for_special(cascade_depth: int) -> int:
	return int(round(POINTS_SPECIAL * (1.0 + CASCADE_BONUS_RATIO * float(cascade_depth))))


func add_score(amount: int) -> void:
	score += amount
	score_changed.emit(score)


func register_cleared(type: int, count: int) -> void:
	if level and level.objective == LevelData.Objective.COLLECT and type == level.collect_type:
		collected += count
		objective_changed.emit(objective_current(), objective_target())


func use_move() -> void:
	moves_left = maxi(0, moves_left - 1)
	moves_changed.emit(moves_left)


func objective_current() -> int:
	if level == null:
		return 0
	return collected if level.objective == LevelData.Objective.COLLECT else score


func objective_target() -> int:
	if level == null:
		return 0
	return level.target_count if level.objective == LevelData.Objective.COLLECT else level.target_score


func objective_met() -> bool:
	return level != null and objective_current() >= objective_target()


func stars() -> int:
	return level.stars_for(moves_left) if level else 0


## Called once the board has finished settling, so a winning cascade on the last
## move still counts.
func evaluate() -> void:
	if _resolved or level == null:
		return
	if objective_met():
		_resolved = true
		level_won.emit()
	elif moves_left <= 0:
		_resolved = true
		level_lost.emit()
