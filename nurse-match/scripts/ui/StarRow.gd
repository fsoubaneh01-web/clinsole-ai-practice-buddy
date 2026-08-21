class_name StarRow
extends Control
## Nurse Match's completion indicator: three filled or hollow stars.

@export var earned := 0:
	set(value):
		earned = value
		queue_redraw()
@export var total := 3
@export var star_size := 56.0:
	set(value):
		star_size = value
		custom_minimum_size = Vector2(star_size * total * 1.35, star_size * 1.2)
		queue_redraw()

var _reveal := 1.0


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	custom_minimum_size = Vector2(star_size * total * 1.35, star_size * 1.2)


## Pops the stars in one at a time — used on the level-complete card.
func animate_reveal() -> void:
	_reveal = 0.0
	var tween := create_tween()
	tween.tween_method(func(value: float) -> void:
		_reveal = value
		queue_redraw(), 0.0, 1.0, 0.16 * float(maxi(earned, 1)) + 0.2)


func _draw() -> void:
	var spacing := star_size * 1.35
	var start := (size.x - spacing * (total - 1)) * 0.5
	for i in total:
		var centre := Vector2(start + spacing * i, size.y * 0.5)
		var filled := i < earned
		var progress: float = clampf(_reveal * float(total) - float(i), 0.0, 1.0)
		var scale: float = 1.0 if not filled else (0.4 + 0.6 * progress) * (1.0 + 0.25 * sin(progress * PI))
		var points := _star_points(centre, star_size * 0.5 * (scale if filled else 1.0))
		if filled:
			draw_colored_polygon(points, Palette.STAR)
			var closed := points.duplicate()
			closed.append(points[0])
			draw_polyline(closed, Palette.TEXT, 3.0, true)
		else:
			var closed := points.duplicate()
			closed.append(points[0])
			draw_polyline(closed, Palette.LOCKED, 3.0, true)


func _star_points(centre: Vector2, radius: float) -> PackedVector2Array:
	var points := PackedVector2Array()
	for i in 10:
		var angle := -PI * 0.5 + PI * float(i) / 5.0
		var length := radius if i % 2 == 0 else radius * 0.46
		points.append(centre + Vector2(cos(angle), sin(angle)) * length)
	return points
