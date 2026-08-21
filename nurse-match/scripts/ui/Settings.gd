extends Control
## Sound, music and vibration toggles, plus a progress reset for playtesting.


func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	_build()


func _build() -> void:
	var safe := preload("res://scenes/ui/SafeArea.tscn").instantiate()
	add_child(safe)

	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 18)
	safe.add_child(column)

	column.add_child(UIKit.header("SETTINGS",
		func() -> void: GameStateManager.change_state(GameStateManager.State.MAIN_MENU)))

	column.add_child(UIKit.spacer(12))

	var panel := UIKit.panel()
	column.add_child(panel)
	var rows := VBoxContainer.new()
	rows.add_theme_constant_override("separation", 22)
	panel.add_child(rows)
	for entry: Dictionary in [
		{"key": "sound", "label": "SOUND"},
		{"key": "music", "label": "MUSIC"},
		{"key": "vibration", "label": "VIBRATION"},
	]:
		rows.add_child(_toggle_row(String(entry["key"]), String(entry["label"])))

	column.add_child(UIKit.expander())

	var reset := UIKit.button("RESET PROGRESS", UIKit.ButtonKind.GHOST)
	reset.add_theme_font_size_override("font_size", 30)
	reset.pressed.connect(_on_reset)
	column.add_child(reset)

	var version := UIKit.mono("NURSE MATCH  •  %s" % ProjectSettings.get_setting("application/config/version", "0.1.0"), 24, Palette.TEXT_DIM)
	version.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	column.add_child(version)


func _toggle_row(key: String, label_text: String) -> HBoxContainer:
	var row := HBoxContainer.new()
	var label := UIKit.mono(label_text, 34)
	label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	row.add_child(label)
	var toggle := ToggleSwitch.new()
	toggle.button_pressed = SaveManager.get_setting(key)
	toggle.toggled.connect(func(pressed: bool) -> void: SaveManager.set_setting(key, pressed))
	row.add_child(toggle)
	return row


func _on_reset() -> void:
	SaveManager.reset_progress()
	var toast := UIKit.mono("PROGRESS RESET", 28, Palette.ACCENT)
	toast.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	toast.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(toast)
	var tween := create_tween()
	tween.tween_property(toast, "modulate:a", 0.0, 1.6).set_delay(0.6)
	tween.tween_callback(toast.queue_free)
