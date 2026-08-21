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
	# Targets are set from measured percentiles, not from feel — see
	# `tools/BalanceSim.gd`, which plays every level with a weak and a strong bot
	# and reports what each actually reaches. Re-run it after changing anything
	# here or in the scoring constants.
	# id, area, moves, then the target
	levels.append(_score(1, 0, 20, 900))
	levels.append(_score(2, 0, 20, 1150))
	levels.append(_collect(3, 1, 25, PieceKind.Type.BANDAGE, 16))
	levels.append(_collect(4, 1, 25, PieceKind.Type.MEDICINE, 18))
	levels.append(_score(5, 2, 25, 1700))
	levels.append(_collect(6, 2, 24, PieceKind.Type.HEART, 20))
	levels.append(_score(7, 3, 22, 1600))
	levels.append(_collect(8, 3, 22, PieceKind.Type.SYRINGE, 19))
	levels.append(_collect(9, 4, 20, PieceKind.Type.STETHOSCOPE, 18))
	levels.append(_score(10, 4, 20, 1750))
	return levels


static func _score(id: int, area: int, moves: int, target: int) -> LevelData:
	var level := LevelData.new()
	level.id = id
	level.area_index = area
	level.area_name = AREAS[area % AREAS.size()]
	level.objective = LevelData.Objective.SCORE
	level.moves = moves
	level.target_score = target
	return level


static func _collect(id: int, area: int, moves: int, type: PieceKind.Type, count: int) -> LevelData:
	var level := LevelData.new()
	level.id = id
	level.area_index = area
	level.area_name = AREAS[area % AREAS.size()]
	level.objective = LevelData.Objective.COLLECT
	level.moves = moves
	level.collect_type = type
	level.target_count = count
	level.target_score = 0
	return level
