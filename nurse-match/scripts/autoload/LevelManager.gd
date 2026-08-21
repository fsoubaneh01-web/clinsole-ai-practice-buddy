extends Node
## Owns the level catalogue and which level is currently loaded.

var levels: Array[LevelData] = []
var current: LevelData = null


func _ready() -> void:
	levels = LevelLibrary.build()


func count() -> int:
	return levels.size()


func get_level(level_id: int) -> LevelData:
	for level in levels:
		if level.id == level_id:
			return level
	return null


func select(level_id: int) -> LevelData:
	current = get_level(level_id)
	return current


## The next playable level after `level_id`, or 0 when the player has reached
## the end of the prototype's content.
func next_level_id(level_id: int) -> int:
	var next := level_id + 1
	return next if get_level(next) != null else 0
