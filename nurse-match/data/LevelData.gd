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
## Score thresholds for the 2nd and 3rd star. The 1st star is completion itself.
@export var star_two_score: int = 800
@export var star_three_score: int = 1200


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


func stars_for_score(score: int) -> int:
	if score >= star_three_score:
		return 3
	if score >= star_two_score:
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
