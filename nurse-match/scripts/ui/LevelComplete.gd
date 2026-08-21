extends Control
## Celebration card shown when the objective is met.

const NURSE_SCENE := preload("res://scenes/components/NurseMascot.tscn")


func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(UIKit.scrim(0.80))

	var result := GameStateManager.last_result
	var level_id: int = int(result.get("level_id", 1))
	var score: int = int(result.get("score", 0))
	var stars_earned: int = int(result.get("stars", 1))

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
	mascot.custom_minimum_size = Vector2(0, 260)
	column.add_child(mascot)
	mascot.set_mood(NurseMascot.Mood.CELEBRATE)

	column.add_child(UIKit.display("LEVEL COMPLETE", 60, Palette.ACCENT))
	column.add_child(UIKit.mono("LEVEL %03d CLEARED" % level_id, 28, Palette.TEXT_DIM))

	var stars := StarRow.new()
	stars.earned = stars_earned
	stars.star_size = 72.0
	column.add_child(stars)
	stars.animate_reveal()

	column.add_child(UIKit.spacer(4))
	column.add_child(UIKit.stat_row("SCORE", "%06d" % score, Palette.TEXT))
	column.add_child(UIKit.stat_row("OBJECTIVE", "CLEARED", Palette.SUCCESS))
	column.add_child(UIKit.stat_row("MOVES LEFT", str(int(result.get("moves_left", 0)))))
	column.add_child(UIKit.stat_row("REWARD", "+%d ★" % stars_earned, Palette.ACCENT))
	column.add_child(UIKit.spacer(8))

	var next_id := LevelManager.next_level_id(level_id)
	if next_id > 0:
		var next_button := UIKit.button("NEXT LEVEL", UIKit.ButtonKind.PRIMARY)
		next_button.pressed.connect(func() -> void: GameStateManager.restart_level(next_id))
		column.add_child(next_button)
	else:
		var done := UIKit.button("BACK TO MAP", UIKit.ButtonKind.PRIMARY)
		done.pressed.connect(func() -> void: GameStateManager.change_state(GameStateManager.State.LEVEL_SELECT))
		column.add_child(done)
		column.add_child(UIKit.mono("PROTOTYPE COMPLETE — MORE WARDS SOON", 24, Palette.TEXT_DIM))

	var replay := UIKit.button("REPLAY", UIKit.ButtonKind.SECONDARY)
	replay.pressed.connect(func() -> void: GameStateManager.restart_level(level_id))
	column.add_child(replay)

	UIKit.present(card)
