extends Control
## Modal shown while a level is paused.


func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(UIKit.scrim(0.72))

	var centre := CenterContainer.new()
	centre.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(centre)

	var card := UIKit.panel(Palette.BG_ELEVATED)
	card.custom_minimum_size = Vector2(760, 0)
	centre.add_child(card)

	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 18)
	card.add_child(column)

	column.add_child(UIKit.display("PAUSED", 64))
	column.add_child(UIKit.mono("LEVEL %03d" % LevelManager.current.id, 30, Palette.TEXT_DIM))
	column.add_child(UIKit.spacer(8))

	var resume := UIKit.button("RESUME", UIKit.ButtonKind.PRIMARY)
	resume.pressed.connect(func() -> void: GameStateManager.change_state(GameStateManager.State.PLAYING))
	column.add_child(resume)

	var restart := UIKit.button("RESTART", UIKit.ButtonKind.SECONDARY)
	restart.pressed.connect(func() -> void: GameStateManager.restart_level())
	column.add_child(restart)

	var levels := UIKit.button("LEVELS", UIKit.ButtonKind.GHOST)
	levels.pressed.connect(func() -> void: GameStateManager.change_state(GameStateManager.State.LEVEL_SELECT))
	column.add_child(levels)

	UIKit.present(card)
