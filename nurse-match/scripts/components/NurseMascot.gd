class_name NurseMascot
extends Control
## Nova — Nurse Match's original mascot.
##
## Drawn procedurally so the prototype ships without placeholder bitmaps, but
## the art is fully swappable: drop `assets/characters/nurse_<mood>.png` into the
## project and that image is used for the matching mood instead, with no code
## changes. Moods drive both the face and the pose, and every screen talks to the
## character through `set_mood` / `react` only.

enum Mood { IDLE, HAPPY, CELEBRATE, ENCOURAGE, SAD }

const ART_DIR := "res://assets/characters/"
const MOOD_FILES := {
	Mood.IDLE: "nurse_idle",
	Mood.HAPPY: "nurse_happy",
	Mood.CELEBRATE: "nurse_celebrate",
	Mood.ENCOURAGE: "nurse_encourage",
	Mood.SAD: "nurse_sad",
}

const SKIN := Color("#F4C9A8")
const SKIN_SHADE := Color("#D9A57F")
const HAIR := Color("#3B2C3A")
const SCRUBS := Color("#35C2A8")
const SCRUBS_DARK := Color("#22907C")
const CAP := Color("#F6F7FB")
const INK := Color("#241E2B")

@export var mood: Mood = Mood.IDLE:
	set(value):
		mood = value
		queue_redraw()

var _phase := 0.0
var _bounce := 0.0
var _texture_cache := {}


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	_phase = randf() * TAU
	set_process(true)


func set_mood(value: Mood) -> void:
	mood = value


## Shows a mood for a moment, then eases back to idle. Used for match feedback.
func react(value: Mood, hold: float = 1.1) -> void:
	set_mood(value)
	_bounce = 1.0
	if hold > 0.0 and is_inside_tree():
		var timer := get_tree().create_timer(hold)
		timer.timeout.connect(func() -> void:
			if is_instance_valid(self) and mood == value:
				set_mood(Mood.IDLE))


func _process(delta: float) -> void:
	_phase += delta
	_bounce = maxf(0.0, _bounce - delta * 2.2)
	queue_redraw()


func _draw() -> void:
	var s: float = minf(size.x, size.y)
	if s <= 1.0:
		return
	var texture := _texture_for(mood)
	var centre := size * 0.5
	# Breathing bob; celebrations hop noticeably higher.
	var amplitude: float = 0.014 if mood != Mood.CELEBRATE else 0.045
	var speed: float = 1.7 if mood != Mood.CELEBRATE else 6.0
	var bob := sin(_phase * speed) * s * amplitude - _bounce * s * 0.03
	var tilt: float = sin(_phase * 0.9) * 0.03
	if texture:
		var rect := Rect2(centre - Vector2(s, s) * 0.5 + Vector2(0, bob), Vector2(s, s))
		draw_texture_rect(texture, rect, false)
		return
	draw_set_transform(centre + Vector2(0, bob), tilt, Vector2.ONE)
	_draw_character(s)
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)


func _draw_character(s: float) -> void:
	var raised := mood == Mood.CELEBRATE
	var outline := maxf(2.0, s * 0.012)

	# Arms first so the sleeves sit behind the torso; the hands still clear the
	# silhouette so the pose reads at thumbnail size.
	var arm_width := s * 0.095
	for side: float in [-1.0, 1.0]:
		var shoulder := Vector2(side * 0.17, 0.08) * s
		var hand := (Vector2(side * 0.40, -0.30) if raised else Vector2(side * 0.38, 0.30)) * s
		if mood == Mood.ENCOURAGE and side > 0.0:
			hand = Vector2(0.38, -0.10) * s # thumbs-up arm
		draw_line(shoulder, hand, SCRUBS_DARK, arm_width + outline * 2.0, true)
		draw_line(shoulder, hand, SCRUBS, arm_width, true)
		draw_circle(hand, arm_width * 0.66, SKIN_SHADE)
		draw_circle(hand, arm_width * 0.56, SKIN)

	# Torso: modern scrubs top with a V-neck.
	var torso := PackedVector2Array([
		Vector2(-0.18, 0.02), Vector2(0.18, 0.02), Vector2(0.27, 0.44),
		Vector2(0.23, 0.48), Vector2(-0.23, 0.48), Vector2(-0.27, 0.44),
	])
	for i in torso.size():
		torso[i] *= s
	_fill(torso, SCRUBS, SCRUBS_DARK, outline)
	var neckline := PackedVector2Array([
		Vector2(-0.10, 0.02) * s, Vector2(0.10, 0.02) * s, Vector2(0.0, 0.16) * s,
	])
	draw_colored_polygon(neckline, SCRUBS_DARK)
	# Chest pocket keeps the silhouette reading as scrubs, not a t-shirt.
	draw_rect(Rect2(Vector2(0.07, 0.24) * s, Vector2(0.12, 0.10) * s), SCRUBS_DARK)

	# Stethoscope draped around the neck.
	var tube := PackedVector2Array()
	for i in 21:
		var t := float(i) / 20.0
		var angle := PI * (0.10 + 0.80 * t)
		tube.append(Vector2(cos(angle) * 0.155, sin(angle) * 0.20 + 0.05) * s)
	draw_polyline(tube, Palette.ACCENT.darkened(0.25), s * 0.026, true)
	var bell := Vector2(-0.152, 0.115) * s
	draw_circle(bell, s * 0.042, Palette.ACCENT)
	draw_circle(bell, s * 0.022, CAP)

	# Neck and head.
	draw_rect(Rect2(Vector2(-0.055, -0.06) * s, Vector2(0.11, 0.11) * s), SKIN_SHADE)
	var head := Vector2(0, -0.20) * s
	var head_r := s * 0.185
	# Hair frames the face; the silhouette stays clean at small sizes.
	draw_circle(head + Vector2(0, -0.012) * s, head_r * 1.10, HAIR)
	draw_circle(head, head_r, SKIN)

	# Scrub cap: a dome and a brim band, kept as two separate convex shapes so
	# neither outline can cross itself.
	# Sits back off the forehead so the face keeps its full height.
	var cap_centre := head + Vector2(0, -head_r * 0.30)
	var dome := PackedVector2Array()
	for i in 25:
		var angle := PI + PI * float(i) / 24.0
		dome.append(cap_centre + Vector2(cos(angle), sin(angle) * 1.15) * head_r * 1.02)
	_fill(dome, CAP, INK.lightened(0.25), outline)
	var brim := PieceArt.rounded_rect(cap_centre + Vector2(0, -head_r * 0.04),
		Vector2(head_r * 2.16, head_r * 0.26), head_r * 0.12)
	_fill(brim, CAP.darkened(0.08), INK.lightened(0.25), outline)
	var bar := head_r * 0.14
	var cross_centre := head + Vector2(0, -head_r * 0.82)
	draw_rect(Rect2(cross_centre - Vector2(bar, bar * 2.6), Vector2(bar * 2, bar * 5.2)), Palette.ACCENT)
	draw_rect(Rect2(cross_centre - Vector2(bar * 2.6, bar), Vector2(bar * 5.2, bar * 2)), Palette.ACCENT)

	_draw_face(head, head_r, s)


func _draw_face(head: Vector2, head_r: float, s: float) -> void:
	var eye_y := head.y + head_r * 0.06
	var eye_dx := head_r * 0.42
	var eye_r := head_r * 0.115
	var lid := maxf(2.0, s * 0.014)

	match mood:
		Mood.HAPPY, Mood.CELEBRATE:
			# Cheerful upward arcs.
			for side: float in [-1.0, 1.0]:
				draw_arc(Vector2(head.x + side * eye_dx, eye_y + eye_r * 0.4), eye_r * 1.25,
					PI, TAU, 12, INK, lid, true)
		Mood.ENCOURAGE:
			draw_circle(Vector2(head.x - eye_dx, eye_y), eye_r, INK)
			draw_arc(Vector2(head.x + eye_dx, eye_y + eye_r * 0.4), eye_r * 1.25, PI, TAU, 12, INK, lid, true)
		Mood.SAD:
			for side: float in [-1.0, 1.0]:
				draw_circle(Vector2(head.x + side * eye_dx, eye_y + eye_r * 0.25), eye_r * 0.85, INK)
				# Worried brows.
				var brow := Vector2(head.x + side * eye_dx, eye_y - eye_r * 1.5)
				draw_line(brow + Vector2(-side * eye_r, -eye_r * 0.35), brow + Vector2(side * eye_r, eye_r * 0.25), INK, lid, true)
		_:
			# Idle blink on a slow cycle.
			var blink: bool = fmod(_phase, 4.2) < 0.12
			for side: float in [-1.0, 1.0]:
				var at := Vector2(head.x + side * eye_dx, eye_y)
				if blink:
					draw_line(at + Vector2(-eye_r, 0), at + Vector2(eye_r, 0), INK, lid, true)
				else:
					draw_circle(at, eye_r, INK)
					draw_circle(at + Vector2(eye_r * 0.3, -eye_r * 0.3), eye_r * 0.32, Color(1, 1, 1, 0.9))

	# Blush.
	for side: float in [-1.0, 1.0]:
		draw_circle(Vector2(head.x + side * head_r * 0.66, eye_y + head_r * 0.36), head_r * 0.14,
			Color(Palette.CORAL.r, Palette.CORAL.g, Palette.CORAL.b, 0.35))

	# Mouth.
	var mouth := Vector2(head.x, head.y + head_r * 0.48)
	match mood:
		Mood.SAD:
			draw_arc(mouth + Vector2(0, head_r * 0.28), head_r * 0.28, PI * 1.15, PI * 1.85, 16, INK, lid, true)
		Mood.CELEBRATE:
			var open := PackedVector2Array()
			for i in 17:
				var angle := PI * float(i) / 16.0
				open.append(mouth + Vector2(cos(angle) * -head_r * 0.26, sin(angle) * head_r * 0.30))
			draw_colored_polygon(open, INK)
		_:
			draw_arc(mouth, head_r * 0.30, PI * 0.15, PI * 0.85, 16, INK, lid, true)

	if mood == Mood.CELEBRATE:
		_draw_sparkles(head, head_r, s)


func _draw_sparkles(head: Vector2, head_r: float, s: float) -> void:
	var wheel := [Palette.ACCENT, Palette.YELLOW, Palette.CYAN, Palette.MINT]
	for i in 6:
		var angle := TAU * float(i) / 6.0 + _phase * 1.6
		var radius := head_r * (1.9 + 0.18 * sin(_phase * 3.0 + float(i)))
		var at := head + Vector2(cos(angle), sin(angle) * 0.8) * radius
		var arm := s * 0.022
		var tint: Color = wheel[i % wheel.size()]
		draw_line(at - Vector2(arm, 0), at + Vector2(arm, 0), tint, maxf(2.0, s * 0.009), true)
		draw_line(at - Vector2(0, arm), at + Vector2(0, arm), tint, maxf(2.0, s * 0.009), true)


func _fill(points: PackedVector2Array, fill: Color, line: Color, width: float) -> void:
	draw_colored_polygon(points, fill)
	var closed := points.duplicate()
	closed.append(points[0])
	draw_polyline(closed, line, width, true)


func _texture_for(value: Mood) -> Texture2D:
	if _texture_cache.has(value):
		return _texture_cache[value]
	var texture: Texture2D = null
	var base: String = MOOD_FILES.get(value, "")
	if base != "":
		for extension: String in [".png", ".svg", ".webp"]:
			var path := ART_DIR + base + extension
			if ResourceLoader.exists(path):
				texture = load(path) as Texture2D
				break
	_texture_cache[value] = texture
	return texture
