extends Control
## Rules, the piece legend, and what the specials do.


func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	_build()


func _build() -> void:
	var safe := preload("res://scenes/ui/SafeArea.tscn").instantiate()
	add_child(safe)

	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 16)
	safe.add_child(column)

	column.add_child(UIKit.header("HOW TO PLAY",
		func() -> void: GameStateManager.change_state(GameStateManager.State.MAIN_MENU)))

	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	column.add_child(scroll)

	var body := VBoxContainer.new()
	body.add_theme_constant_override("separation", 18)
	body.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(body)

	body.add_child(_section("THE BASICS", [
		"Swipe a piece toward the one next to it, or tap two neighbours in turn.",
		"Line up three or more of the same supply to clear them.",
		"Clears drop new supplies in — chains keep scoring on their own.",
		"Every swap that matches costs one move. Hit the target before they run out.",
	]))

	var legend_panel := UIKit.panel()
	body.add_child(legend_panel)
	var legend := VBoxContainer.new()
	legend.add_theme_constant_override("separation", 12)
	legend_panel.add_child(legend)
	legend.add_child(UIKit.mono("THE SUPPLIES", 30, Palette.ACCENT))
	for type: int in PieceKind.Type.values():
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 18)
		var swatch := PieceSwatch.new()
		swatch.type = type
		swatch.custom_minimum_size = Vector2(88, 88)
		row.add_child(swatch)
		var label := UIKit.mono(PieceKind.name_of(type), 30, PieceKind.color_of(type))
		label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		row.add_child(label)
		legend.add_child(row)
	legend.add_child(UIKit.display(
		"Every supply has its own shape as well as its own colour, so the board stays readable however you see colour.",
		26, Palette.TEXT_DIM, false))
	(legend.get_child(legend.get_child_count() - 1) as Label).autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	(legend.get_child(legend.get_child_count() - 1) as Label).horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT

	var special_panel := UIKit.panel()
	body.add_child(special_panel)
	var specials := VBoxContainer.new()
	specials.add_theme_constant_override("separation", 14)
	special_panel.add_child(specials)
	specials.add_child(UIKit.mono("SPECIAL SUPPLIES", 30, Palette.ACCENT))
	for entry: Dictionary in [
		{"special": PieceKind.Special.LINE_H, "type": PieceKind.Type.CROSS,
		 "title": "CODE LINE", "body": "Match four in a row to forge one. Set it off and it clears the whole line it points along. +150"},
		{"special": PieceKind.Special.RAINBOW, "type": PieceKind.Type.HEART,
		 "title": "CODE BLUE", "body": "Match five to forge one. Swap it with any supply to sweep every one of that supply off the board. +150"},
	]:
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 18)
		var swatch := PieceSwatch.new()
		swatch.type = int(entry["type"])
		swatch.special = int(entry["special"])
		swatch.custom_minimum_size = Vector2(104, 104)
		row.add_child(swatch)
		var text := VBoxContainer.new()
		text.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		text.add_child(UIKit.mono(String(entry["title"]), 30))
		var description := UIKit.display(String(entry["body"]), 26, Palette.TEXT_DIM, false)
		description.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		description.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
		text.add_child(description)
		row.add_child(text)
		specials.add_child(row)

	body.add_child(_section("SCORING", [
		"Three in a row  +30",
		"Four in a row  +60",
		"Five or more  +100",
		"Setting off a special  +150",
		"Every extra step of a chain adds half again on top.",
	]))
	body.add_child(UIKit.spacer(24))


func _section(title: String, lines: Array) -> PanelContainer:
	var panel := UIKit.panel()
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 10)
	panel.add_child(column)
	column.add_child(UIKit.mono(title, 30, Palette.ACCENT))
	for line: String in lines:
		var label := UIKit.display(String(line), 27, Palette.TEXT, false)
		label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		label.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
		column.add_child(label)
	return panel
