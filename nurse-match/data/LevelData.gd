class_name LevelData
extends Resource
## One playable level. Levels are plain resources so new ones can be appended to
## `LevelLibrary` (or loaded from `.tres` files later) without touching gameplay
## code.

enum Objective {
	SCORE, ## Reach `target_score` before running out of moves.
	COLLECT, ## Clear `target_count` pieces of `collect_type`.
}

@export var id: int = 1
@export var area_index: int = 0
@export var area_name: String = "EMERGENCY"
@export var objective: Objective = Objective.SCORE
@export var moves: int = 20
@export var target_score: int = 500
@export var collect_type: PieceKind.Type = PieceKind.Type.BANDAGE
@export var target_count: int = 15

## Stars measure efficiency, not score. A level ends the moment its objective is
## met, so the final score barely clears the target however well the level was
## played — it cannot separate a good run from a lucky one. Moves left over can.
const STAR_TWO_MOVES_LEFT := 0.20
const STAR_THREE_MOVES_LEFT := 0.40


## Human-readable objective for the HUD and the level-complete card.
func objective_text() -> String:
	match objective:
		Objective.COLLECT:
			return "Clear %d %s" % [target_count, PieceKind.plural_of(collect_type)]
		_:
			return "Reach %s points" % _grouped(target_score)


## Compact arcade form for the HUD's TARGET readout.
func target_label() -> String:
	match objective:
		Objective.COLLECT:
			return "%s x%d" % [PieceKind.name_of(collect_type), target_count]
		_:
			return str(target_score)


## 1 star for clearing it, 2 or 3 for clearing it with moves to spare.
func stars_for(moves_left: int) -> int:
	var spare := float(moves_left) / float(maxi(moves, 1))
	if spare >= STAR_THREE_MOVES_LEFT:
		return 3
	if spare >= STAR_TWO_MOVES_LEFT:
		return 2
	return 1


func _grouped(value: int) -> String:
	var digits := str(value)
	var out := ""
	var count := 0
	for i in range(digits.length() - 1, -1, -1):
		out = digits[i] + out
		count += 1
		if count % 3 == 0 and i > 0:
			out = "," + out
	return out
