extends MarginContainer
## Keeps content clear of notches, punch-holes and gesture bars.
##
## Falls back to a comfortable default padding on desktop, where the reported
## safe area is the whole window.

@export var base_padding := 36


func _ready() -> void:
	_apply()
	get_tree().root.size_changed.connect(_apply)


func _apply() -> void:
	var insets := Vector4.ZERO
	var window_size := DisplayServer.window_get_size()
	if window_size.x > 0 and window_size.y > 0:
		var safe := DisplayServer.get_display_safe_area()
		var viewport_size := get_viewport_rect().size
		var scale := Vector2(viewport_size.x / float(window_size.x), viewport_size.y / float(window_size.y))
		insets = Vector4(
			maxf(0.0, safe.position.x) * scale.x,
			maxf(0.0, safe.position.y) * scale.y,
			maxf(0.0, window_size.x - safe.end.x) * scale.x,
			maxf(0.0, window_size.y - safe.end.y) * scale.y)
	add_theme_constant_override("margin_left", int(insets.x) + base_padding)
	add_theme_constant_override("margin_top", int(insets.y) + base_padding)
	add_theme_constant_override("margin_right", int(insets.z) + base_padding)
	add_theme_constant_override("margin_bottom", int(insets.w) + base_padding)
