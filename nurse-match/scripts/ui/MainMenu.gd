extends Control
## Title screen: brand, mascot, and the way into the game.

const NURSE_SCENE := preload("res://scenes/components/NurseMascot.tscn")


func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	AudioManager.play_music(&"theme")
	_build()


func _build() -> void:
	var safe := preload("res://scenes/ui/SafeArea.tscn").instantiate()
	add_child(safe)

	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 18)
	safe.add_child(column)

	column.add_child(UIKit.spacer(28))

	# Wordmark. The accent lands on exactly one word.
	var nurse := UIKit.display("NURSE", 132)
	nurse.add_theme_constant_override("line_spacing", -18)
	column.add_child(nurse)
	var match_word := UIKit.display("MATCH", 132, Palette.ACCENT)
	column.add_child(match_word)

	var tagline := UIKit.mono("CARE • MATCH • PLAY", 34, Palette.TEXT_DIM)
	tagline.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	column.add_child(tagline)

	var mascot: NurseMascot = NURSE_SCENE.instantiate()
	mascot.size_flags_vertical = Control.SIZE_EXPAND_FILL
	mascot.custom_minimum_size = Vector2(0, 420)
	column.add_child(mascot)

	var play := UIKit.button("PLAY", UIKit.ButtonKind.PRIMARY)
	play.pressed.connect(_on_play)
	column.add_child(play)

	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 18)
	column.add_child(row)
	for entry: Dictionary in [
		{"text": "LEVELS", "state": GameStateManager.State.LEVEL_SELECT},
		{"text": "SETTINGS", "state": GameStateManager.State.SETTINGS},
	]:
		var button := UIKit.button(String(entry["text"]), UIKit.ButtonKind.SECONDARY)
		button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		button.add_theme_font_size_override("font_size", 34)
		var target: int = entry["state"]
		button.pressed.connect(func() -> void: GameStateManager.change_state(target))
		row.add_child(button)

	var how := UIKit.button("HOW TO PLAY", UIKit.ButtonKind.GHOST)
	how.add_theme_font_size_override("font_size", 32)
	how.pressed.connect(func() -> void: GameStateManager.change_state(GameStateManager.State.HOW_TO_PLAY))
	column.add_child(how)

	var progress := UIKit.mono("%d / %d LEVELS  •  %d STARS" % [
		SaveManager.completed.size(), LevelManager.count(), SaveManager.total_stars()
	], 26, Palette.TEXT_DIM)
	progress.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	column.add_child(progress)
	column.add_child(UIKit.spacer(8))

	mascot.react(NurseMascot.Mood.HAPPY, 2.0)


## PLAY resumes at the furthest level the player has unlocked.
func _on_play() -> void:
	var level_id: int = clampi(SaveManager.highest_unlocked, 1, LevelManager.count())
	LevelManager.select(level_id)
	GameStateManager.change_state(GameStateManager.State.PLAYING)
