class_name LevelLibrary
extends RefCounted
## The prototype's 10 levels, plus the hospital areas they sit in.
##
## Adding a level is a single `_make(...)` line — difficulty pacing, the level
## map and the save system all read from here.

const AREAS := [
	"EMERGENCY",
	"PEDIATRICS",
	"MATERNITY",
	"SURGERY",
	"ICU",
	"HOME CARE",
	"WELLNESS",
]


static func build() -> Array[LevelData]:
	var levels: Array[LevelData] = []
	# id, area, objective, moves, score target, collect type, collect count, 2-star, 3-star
	levels.append(_score(1, 0, 20, 500, 750, 1000))
	levels.append(_score(2, 0, 20, 750, 1050, 1400))
	levels.append(_collect(3, 1, 25, PieceKind.Type.BANDAGE, 15, 900, 1300))
	levels.append(_collect(4, 1, 25, PieceKind.Type.MEDICINE, 20, 1100, 1600))
	levels.append(_score(5, 2, 25, 1500, 2000, 2600))
	levels.append(_collect(6, 2, 24, PieceKind.Type.HEART, 25, 1400, 2000))
	levels.append(_score(7, 3, 22, 2200, 2900, 3700))
	levels.append(_collect(8, 3, 22, PieceKind.Type.SYRINGE, 28, 1800, 2500))
	levels.append(_collect(9, 4, 20, PieceKind.Type.STETHOSCOPE, 30, 2200, 3000))
	levels.append(_score(10, 4, 20, 3500, 4400, 5400))
	return levels


static func _score(id: int, area: int, moves: int, target: int, star_two: int, star_three: int) -> LevelData:
	var level := LevelData.new()
	level.id = id
	level.area_index = area
	level.area_name = AREAS[area % AREAS.size()]
	level.objective = LevelData.Objective.SCORE
	level.moves = moves
	level.target_score = target
	level.star_two_score = star_two
	level.star_three_score = star_three
	return level


static func _collect(id: int, area: int, moves: int, type: PieceKind.Type, count: int, star_two: int, star_three: int) -> LevelData:
	var level := LevelData.new()
	level.id = id
	level.area_index = area
	level.area_name = AREAS[area % AREAS.size()]
	level.objective = LevelData.Objective.COLLECT
	level.moves = moves
	level.collect_type = type
	level.target_count = count
	level.target_score = 0
	level.star_two_score = star_two
	level.star_three_score = star_three
	return level
