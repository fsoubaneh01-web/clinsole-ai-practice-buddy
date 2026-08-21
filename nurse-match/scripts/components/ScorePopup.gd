extends Node2D
## Floating "+30" that rises out of a cleared match and fades.

var _label: Label


func show_points(points: int, cell_size: float) -> void:
	_label = Label.new()
	_label.text = "+%d" % points
	_label.add_theme_font_override("font", Palette.font_mono_bold)
	_label.add_theme_font_size_override("font_size", int(maxf(18.0, cell_size * 0.40)))
	_label.add_theme_color_override("font_color", Palette.TEXT)
	_label.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.85))
	_label.add_theme_constant_override("outline_size", 8)
	_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_label.size = Vector2(cell_size * 2.4, cell_size * 0.6)
	_label.position = -_label.size * 0.5
	add_child(_label)
	z_index = 20

	var tween := create_tween()
	tween.set_parallel(true)
	tween.tween_property(self, "position:y", position.y - cell_size * 1.1, 0.62) \
		.set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tween.tween_property(self, "scale", Vector2.ONE * 1.15, 0.16) \
		.set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tween.tween_property(self, "modulate:a", 0.0, 0.34).set_delay(0.28)
	tween.chain().tween_callback(queue_free)
