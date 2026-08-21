class_name LevelNodeButton
extends Button
## One interactive stop on the hospital map.

const NODE_RADIUS := 74.0

var level: LevelData
var unlocked := false
var stars := 0

var _pulse := 0.0
var _is_next := false


func setup(level_data: LevelData, is_unlocked: bool, earned_stars: int, is_next: bool) -> void:
	level = level_data
	unlocked = is_unlocked
	stars = earned_stars
	_is_next = is_next
	disabled = not unlocked
	tooltip_text = level.objective_text()
	queue_redraw()


func _init() -> void:
	focus_mode = Control.FOCUS_NONE
	flat = true
	custom_minimum_size = Vector2(NODE_RADIUS * 2.4, NODE_RADIUS * 2.9)
	for state: String in ["normal", "hover", "pressed", "disabled", "focus"]:
		add_theme_stylebox_override(state, StyleBoxEmpty.new())


func _ready() -> void:
	UIKit.attach_press_feedback(self)
	set_process(true)


func _process(delta: float) -> void:
	if _is_next:
		_pulse += delta
		queue_redraw()


func _draw() -> void:
	var centre := Vector2(size.x * 0.5, NODE_RADIUS + 8.0)
	var tint: Color = Palette.area_color(level.area_index) if unlocked else Palette.LOCKED
	# The next level to play breathes gently so the eye lands on it first.
	var glow: float = 0.0
	if _is_next:
		glow = 0.5 + 0.5 * sin(_pulse * 3.0)
		draw_circle(centre, NODE_RADIUS * (1.16 + 0.08 * glow), Color(Palette.ACCENT.r, Palette.ACCENT.g, Palette.ACCENT.b, 0.22 + 0.2 * glow))
	draw_circle(centre, NODE_RADIUS + 5.0, Palette.BG_ELEVATED)
	draw_circle(centre, NODE_RADIUS, tint.darkened(0.55) if unlocked else Palette.SURFACE)
	draw_arc(centre, NODE_RADIUS, 0.0, TAU, 48, tint, 5.0, true)

	if unlocked:
		var number := "%02d" % level.id
		var font: Font = Palette.font_mono_bold
		var font_size := 46
		var extents := font.get_string_size(number, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size)
		draw_string(font, centre + Vector2(-extents.x * 0.5, extents.y * 0.32), number,
			HORIZONTAL_ALIGNMENT_LEFT, -1, font_size, Palette.TEXT)
	else:
		_draw_lock(centre, NODE_RADIUS * 0.52)

	# Stars beneath the node.
	var star_y := centre.y + NODE_RADIUS + 34.0
	var spacing := 34.0
	for i in 3:
		var at := Vector2(size.x * 0.5 + (i - 1) * spacing, star_y)
		var points := _star(at, 14.0)
		if i < stars:
			draw_colored_polygon(points, Palette.STAR)
		else:
			var closed := points.duplicate()
			closed.append(points[0])
			draw_polyline(closed, Palette.LOCKED, 2.0, true)


func _draw_lock(centre: Vector2, s: float) -> void:
	var body := Rect2(centre + Vector2(-s * 0.62, -s * 0.05), Vector2(s * 1.24, s * 0.95))
	var box := StyleBoxFlat.new()
	box.bg_color = Palette.TEXT_DIM
	box.set_corner_radius_all(int(s * 0.22))
	draw_style_box(box, body)
	draw_arc(centre + Vector2(0, -s * 0.05), s * 0.42, PI, TAU, 18, Palette.TEXT_DIM, s * 0.22, true)


func _star(centre: Vector2, radius: float) -> PackedVector2Array:
	var points := PackedVector2Array()
	for i in 10:
		var angle := -PI * 0.5 + PI * float(i) / 5.0
		var length := radius if i % 2 == 0 else radius * 0.46
		points.append(centre + Vector2(cos(angle), sin(angle)) * length)
	return points
