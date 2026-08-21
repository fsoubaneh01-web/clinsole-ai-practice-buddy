class_name UIKit
extends RefCounted
## Factory helpers for Nurse Match's arcade interface.
##
## Every screen builds itself from these so typography, radii and the neon
## accent stay consistent — and so a restyle is a one-file change.

enum ButtonKind { PRIMARY, SECONDARY, GHOST }


## Friendly rounded sans — titles, menus, instructions.
static func display(text: String, font_size: int, color: Color = Palette.TEXT, bold: bool = true) -> Label:
	var label := Label.new()
	label.text = text
	label.add_theme_font_override("font", Palette.font_display_bold if bold else Palette.font_display)
	label.add_theme_font_size_override("font_size", font_size)
	label.add_theme_color_override("font_color", color)
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	return label


## Monospace arcade data — SCORE, MOVES, LEVEL 001. Always uppercase.
static func mono(text: String, font_size: int, color: Color = Palette.TEXT, bold: bool = true) -> Label:
	var label := Label.new()
	label.text = text.to_upper()
	label.add_theme_font_override("font", Palette.font_mono_bold if bold else Palette.font_mono)
	label.add_theme_font_size_override("font_size", font_size)
	label.add_theme_color_override("font_color", color)
	return label


static func button(text: String, kind: ButtonKind = ButtonKind.SECONDARY) -> Button:
	var b := Button.new()
	b.text = text
	b.custom_minimum_size = Vector2(0, 108) # comfortable touch target
	b.focus_mode = Control.FOCUS_NONE
	b.add_theme_font_override("font", Palette.font_display_bold)
	b.add_theme_font_size_override("font_size", 40)
	var fill := Palette.ACCENT
	var text_color := Palette.TEXT
	var border := Color.TRANSPARENT
	var border_width := 0
	match kind:
		ButtonKind.SECONDARY:
			fill = Palette.SURFACE
			border = Palette.OUTLINE
			border_width = 2
		ButtonKind.GHOST:
			fill = Color(1, 1, 1, 0.04)
			border = Palette.OUTLINE
			border_width = 2
			text_color = Palette.TEXT_DIM
	b.add_theme_color_override("font_color", text_color)
	b.add_theme_color_override("font_hover_color", Palette.TEXT)
	b.add_theme_color_override("font_pressed_color", Palette.TEXT)
	b.add_theme_stylebox_override("normal", _button_box(fill, border, border_width))
	b.add_theme_stylebox_override("hover", _button_box(fill.lightened(0.12), border, border_width))
	b.add_theme_stylebox_override("pressed", _button_box(fill.darkened(0.18), border, border_width))
	b.add_theme_stylebox_override("disabled", _button_box(Palette.SURFACE.darkened(0.4), border, border_width))
	attach_press_feedback(b)
	return b


## Small squeeze-and-release so every tap feels physical.
static func attach_press_feedback(control: BaseButton) -> void:
	control.pivot_offset = control.size * 0.5
	control.resized.connect(func() -> void: control.pivot_offset = control.size * 0.5)
	control.button_down.connect(func() -> void: _scale_to(control, 0.96, 0.07))
	control.button_up.connect(func() -> void: _scale_to(control, 1.0, 0.16))
	control.pressed.connect(func() -> void: AudioManager.play(&"button"))


static func panel(fill: Color = Palette.SURFACE_SOFT, radius: int = Palette.RADIUS_LG, border: Color = Palette.OUTLINE) -> PanelContainer:
	var container := PanelContainer.new()
	container.add_theme_stylebox_override("panel", Palette.panel(fill, radius, border))
	return container


static func spacer(height: float) -> Control:
	var control := Control.new()
	control.custom_minimum_size = Vector2(0, height)
	control.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return control


## Fixed-width filler, used to balance a header so its title stays centred.
static func hspacer(width: float) -> Control:
	var control := Control.new()
	control.custom_minimum_size = Vector2(width, 0)
	control.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return control


## Standard screen header: back button, centred title, balanced trailing slot.
static func header(title: String, on_back: Callable, trailing: Control = null) -> HBoxContainer:
	const SLOT := 190.0
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 16)
	var back := button("BACK", ButtonKind.GHOST)
	back.custom_minimum_size = Vector2(SLOT, 92)
	back.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	back.add_theme_font_size_override("font_size", 30)
	back.pressed.connect(on_back)
	row.add_child(back)
	var label := display(title, 52)
	label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	row.add_child(label)
	if trailing:
		trailing.custom_minimum_size = Vector2(SLOT, 0)
		row.add_child(trailing)
	else:
		row.add_child(hspacer(SLOT))
	return row


static func expander() -> Control:
	var control := Control.new()
	control.size_flags_vertical = Control.SIZE_EXPAND_FILL
	control.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return control


## Screen-filling dark scrim used behind modal result cards.
static func scrim(alpha: float = 0.78) -> ColorRect:
	var rect := ColorRect.new()
	rect.color = Color(0, 0, 0, alpha)
	rect.set_anchors_preset(Control.PRESET_FULL_RECT)
	rect.mouse_filter = Control.MOUSE_FILTER_STOP
	return rect


## Fades and lifts a card into view.
static func present(card: Control) -> void:
	card.modulate.a = 0.0
	card.scale = Vector2.ONE * 0.94
	card.pivot_offset = card.size * 0.5
	var tween := card.create_tween()
	tween.set_parallel(true)
	tween.tween_property(card, "modulate:a", 1.0, 0.20)
	tween.tween_property(card, "scale", Vector2.ONE, 0.28).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)



## Label/value line used by the result cards ("SCORE  001240").
static func stat_row(label: String, value: String, value_color: Color = Palette.TEXT) -> HBoxContainer:
	var row := HBoxContainer.new()
	var left := mono(label, 30, Palette.TEXT_DIM)
	left.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(left)
	var right := mono(value, 32, value_color)
	right.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	row.add_child(right)
	return row


static func _button_box(fill: Color, border: Color, border_width: int) -> StyleBoxFlat:
	var box := StyleBoxFlat.new()
	box.bg_color = fill
	box.set_corner_radius_all(Palette.RADIUS_MD)
	if border_width > 0:
		box.border_color = border
		box.set_border_width_all(border_width)
	box.content_margin_left = 28
	box.content_margin_right = 28
	box.content_margin_top = 18
	box.content_margin_bottom = 18
	return box


static func _scale_to(control: Control, target: float, duration: float) -> void:
	if not is_instance_valid(control) or not control.is_inside_tree():
		return
	control.pivot_offset = control.size * 0.5
	var tween := control.create_tween()
	tween.tween_property(control, "scale", Vector2.ONE * target, duration) \
		.set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
