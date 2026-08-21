extends Control
## Shown when the moves run out before the objective is met.

const NURSE_SCENE := preload("res://scenes/components/NurseMascot.tscn")


func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(UIKit.scrim(0.80))

	var result := GameStateManager.last_result
	var level_id: int = int(result.get("level_id", 1))

	var centre := CenterContainer.new()
	centre.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(centre)

	var card := UIKit.panel(Palette.BG_ELEVATED)
	card.custom_minimum_size = Vector2(820, 0)
	centre.add_child(card)

	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 16)
	card.add_child(column)

	var mascot: NurseMascot = NURSE_SCENE.instantiate()
	mascot.custom_minimum_size = Vector2(0, 240)
	column.add_child(mascot)
	mascot.set_mood(NurseMascot.Mood.SAD)

	column.add_child(UIKit.display("OUT OF MOVES", 58))
	column.add_child(UIKit.display("So close — one more shift and it's yours.", 28, Palette.TEXT_DIM, false))
	column.add_child(UIKit.spacer(6))

	column.add_child(UIKit.stat_row("FINAL SCORE", "%06d" % int(result.get("score", 0))))
	column.add_child(UIKit.stat_row("PROGRESS", "%d / %d" % [
		int(result.get("current", 0)), int(result.get("target", 0))], Palette.ACCENT))
	column.add_child(UIKit.stat_row("OBJECTIVE", String(result.get("objective", "")).to_upper(), Palette.TEXT_DIM))
	column.add_child(UIKit.spacer(8))

	var again := UIKit.button("TRY AGAIN", UIKit.ButtonKind.PRIMARY)
	again.pressed.connect(func() -> void: GameStateManager.restart_level(level_id))
	column.add_child(again)

	var levels := UIKit.button("LEVELS", UIKit.ButtonKind.SECONDARY)
	levels.pressed.connect(func() -> void: GameStateManager.change_state(GameStateManager.State.LEVEL_SELECT))
	column.add_child(levels)

	UIKit.present(card)
