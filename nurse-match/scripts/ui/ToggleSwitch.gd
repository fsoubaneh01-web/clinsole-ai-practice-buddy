class_name ToggleSwitch
extends Button
## Modern pill switch used by the settings screen.

const TRACK_WIDTH := 116.0
const TRACK_HEIGHT := 60.0

var _knob := 0.0


func _init() -> void:
	toggle_mode = true
	focus_mode = Control.FOCUS_NONE
	custom_minimum_size = Vector2(TRACK_WIDTH, TRACK_HEIGHT)
	flat = true
	add_theme_stylebox_override("normal", StyleBoxEmpty.new())
	add_theme_stylebox_override("hover", StyleBoxEmpty.new())
	add_theme_stylebox_override("pressed", StyleBoxEmpty.new())
	add_theme_stylebox_override("focus", StyleBoxEmpty.new())


func _ready() -> void:
	_knob = 1.0 if button_pressed else 0.0
	toggled.connect(_on_toggled)
	UIKit.attach_press_feedback(self)
	queue_redraw()


func _on_toggled(pressed: bool) -> void:
	var tween := create_tween()
	tween.tween_method(func(value: float) -> void:
		_knob = value
		queue_redraw(), _knob, 1.0 if pressed else 0.0, 0.16) \
		.set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)


func _draw() -> void:
	var track := Rect2(Vector2(0, (size.y - TRACK_HEIGHT) * 0.5), Vector2(TRACK_WIDTH, TRACK_HEIGHT))
	var off := Palette.SURFACE
	var on := Palette.ACCENT
	var box := StyleBoxFlat.new()
	box.bg_color = off.lerp(on, _knob)
	box.set_corner_radius_all(int(TRACK_HEIGHT * 0.5))
	box.border_color = Palette.OUTLINE if _knob < 0.5 else Palette.ACCENT.lightened(0.2)
	box.set_border_width_all(2)
	draw_style_box(box, track)
	var travel := TRACK_WIDTH - TRACK_HEIGHT
	var knob_centre := track.position + Vector2(TRACK_HEIGHT * 0.5 + travel * _knob, TRACK_HEIGHT * 0.5)
	draw_circle(knob_centre, TRACK_HEIGHT * 0.5 - 8.0, Palette.TEXT)
