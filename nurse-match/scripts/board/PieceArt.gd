class_name PieceArt
extends RefCounted
## Procedural vector artwork for the six medical pieces.
##
## Everything is drawn from code into a canvas item, centred on the origin and
## sized to fit a square of `size` pixels. Keeping the art parametric means the
## board stays crisp at any device resolution and the prototype ships with zero
## placeholder bitmaps. Each drawing routine may be swapped for a sprite later
## without touching the board logic.

const OUTLINE_RATIO := 0.055


## Draws one piece centred on `origin` in the canvas item's own coordinates.
## The transform is owned entirely by this function — callers must not set one,
## because the rotated pieces reset it as they go.
static func draw_piece(ci: CanvasItem, type: int, special: int = PieceKind.Special.NONE, size: float = 100.0, glow_phase: float = 0.0, origin: Vector2 = Vector2.ZERO) -> void:
	var fill := PieceKind.color_of(type)
	var line := PieceKind.shade_of(type)
	var width := maxf(2.0, size * OUTLINE_RATIO)
	ci.draw_set_transform(origin, 0.0, Vector2.ONE)
	match type:
		PieceKind.Type.STETHOSCOPE:
			_stethoscope(ci, size, fill, line, width)
		PieceKind.Type.MEDICINE:
			_medicine(ci, size, fill, line, width)
		PieceKind.Type.BANDAGE:
			_bandage(ci, origin, size, fill, line, width)
		PieceKind.Type.SYRINGE:
			_syringe(ci, origin, size, fill, line, width)
		PieceKind.Type.HEART:
			_heart(ci, size, fill, line, width)
		PieceKind.Type.CROSS:
			_cross(ci, size, fill, line, width)
	if special != PieceKind.Special.NONE:
		_special_overlay(ci, special, size, glow_phase)
	ci.draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)


# --- Shapes -------------------------------------------------------------------

static func _stethoscope(ci: CanvasItem, s: float, fill: Color, line: Color, w: float) -> void:
	var tube := maxf(3.0, s * 0.11)
	# Two ear tubes sweeping down into a single stem.
	var left := _curve([
		Vector2(-0.32, -0.40), Vector2(-0.36, -0.06), Vector2(-0.16, 0.10), Vector2(0.0, 0.12)
	], s)
	var right := _curve([
		Vector2(0.32, -0.40), Vector2(0.36, -0.06), Vector2(0.16, 0.10), Vector2(0.0, 0.12)
	], s)
	ci.draw_polyline(left, line, tube + w, true)
	ci.draw_polyline(right, line, tube + w, true)
	ci.draw_polyline(left, fill, tube, true)
	ci.draw_polyline(right, fill, tube, true)
	# Ear tips.
	for x: float in [-0.32, 0.32]:
		ci.draw_circle(Vector2(x * s, -0.42 * s), s * 0.075 + w * 0.5, line)
		ci.draw_circle(Vector2(x * s, -0.42 * s), s * 0.075, fill.lightened(0.15))
	# Chest piece.
	var chest := Vector2(0.0, 0.26 * s)
	ci.draw_circle(chest, s * 0.20 + w, line)
	ci.draw_circle(chest, s * 0.20, fill)
	ci.draw_circle(chest, s * 0.11, fill.darkened(0.18))
	_gloss(ci, Vector2(-0.06, 0.18) * s, s * 0.075)


static func _medicine(ci: CanvasItem, s: float, fill: Color, line: Color, w: float) -> void:
	# Cap.
	var cap := rounded_rect(Vector2(0, -0.34 * s), Vector2(0.34, 0.16) * s, s * 0.05)
	_shape(ci, cap, fill.darkened(0.22), line, w)
	# Neck.
	ci.draw_rect(Rect2(Vector2(-0.11, -0.27) * s, Vector2(0.22, 0.10) * s), line)
	ci.draw_rect(Rect2(Vector2(-0.09, -0.27) * s, Vector2(0.18, 0.10) * s), fill.darkened(0.08))
	# Body.
	var body := rounded_rect(Vector2(0, 0.13 * s), Vector2(0.52, 0.62) * s, s * 0.12)
	_shape(ci, body, fill, line, w)
	# Label band with a cross mark — reads as "medicine" at a glance.
	var label := rounded_rect(Vector2(0, 0.14 * s), Vector2(0.40, 0.26) * s, s * 0.04)
	_shape(ci, label, Color(1, 1, 1, 0.86), line, w * 0.6)
	var bar := s * 0.038
	var mark := Vector2(0, 0.14 * s)
	ci.draw_rect(Rect2(mark + Vector2(-bar, -bar * 2.7), Vector2(bar * 2, bar * 5.4)), fill.darkened(0.45))
	ci.draw_rect(Rect2(mark + Vector2(-bar * 2.7, -bar), Vector2(bar * 5.4, bar * 2)), fill.darkened(0.45))
	_gloss(ci, Vector2(-0.17, -0.06) * s, s * 0.06)


static func _bandage(ci: CanvasItem, origin: Vector2, s: float, fill: Color, line: Color, w: float) -> void:
	ci.draw_set_transform(origin, -PI / 5.0, Vector2.ONE)
	var strip := rounded_rect(Vector2.ZERO, Vector2(0.86, 0.36) * s, s * 0.16)
	_shape(ci, strip, fill, line, w)
	var pad := rounded_rect(Vector2.ZERO, Vector2(0.34, 0.30) * s, s * 0.05)
	_shape(ci, pad, fill.lightened(0.42), line, w * 0.6)
	# Absorbent-pad perforations.
	for dx: float in [-0.07, 0.07]:
		for dy: float in [-0.06, 0.06]:
			ci.draw_circle(Vector2(dx, dy) * s, s * 0.022, line)
	ci.draw_set_transform(origin, 0.0, Vector2.ONE)


static func _syringe(ci: CanvasItem, origin: Vector2, s: float, fill: Color, line: Color, w: float) -> void:
	ci.draw_set_transform(origin, -PI / 4.0, Vector2.ONE)
	# Needle.
	ci.draw_line(Vector2(0, 0.30 * s), Vector2(0, 0.50 * s), line, w * 1.4)
	# Barrel.
	var barrel := rounded_rect(Vector2(0, 0.04 * s), Vector2(0.34, 0.52) * s, s * 0.05)
	_shape(ci, barrel, fill, line, w)
	# Fluid level.
	var fluid := rounded_rect(Vector2(0, 0.14 * s), Vector2(0.24, 0.28) * s, s * 0.03)
	ci.draw_colored_polygon(fluid, fill.darkened(0.3))
	# Finger flange + plunger rod and thumb rest.
	var flange := rounded_rect(Vector2(0, -0.24 * s), Vector2(0.50, 0.10) * s, s * 0.04)
	_shape(ci, flange, fill.darkened(0.2), line, w)
	ci.draw_line(Vector2(0, -0.28 * s), Vector2(0, -0.44 * s), line, w * 1.8)
	var thumb := rounded_rect(Vector2(0, -0.47 * s), Vector2(0.34, 0.10) * s, s * 0.04)
	_shape(ci, thumb, fill.darkened(0.2), line, w)
	ci.draw_set_transform(origin, 0.0, Vector2.ONE)
	_gloss(ci, Vector2(-0.16, -0.10) * s, s * 0.055)


static func _heart(ci: CanvasItem, s: float, fill: Color, line: Color, w: float) -> void:
	var pts := PackedVector2Array()
	var steps := 34
	for i in steps:
		var t := TAU * float(i) / float(steps)
		var x := 16.0 * pow(sin(t), 3.0)
		var y := 13.0 * cos(t) - 5.0 * cos(2.0 * t) - 2.0 * cos(3.0 * t) - cos(4.0 * t)
		pts.append(Vector2(x / 32.0, -y / 32.0) * s * 0.98)
	_shape(ci, pts, fill, line, w)
	# ECG beat across the heart — separates it from a plain love-heart.
	var beat := PackedVector2Array([
		Vector2(-0.26, 0.02), Vector2(-0.10, 0.02), Vector2(-0.03, -0.14),
		Vector2(0.05, 0.16), Vector2(0.12, 0.02), Vector2(0.27, 0.02),
	])
	for i in beat.size():
		beat[i] = beat[i] * s
	ci.draw_polyline(beat, Color(1, 1, 1, 0.92), maxf(2.0, s * 0.05), true)
	_gloss(ci, Vector2(-0.15, -0.20) * s, s * 0.07)


static func _cross(ci: CanvasItem, s: float, fill: Color, line: Color, w: float) -> void:
	var a := 0.17 * s # half arm width
	var b := 0.46 * s # half length
	var pts := PackedVector2Array([
		Vector2(-a, -b), Vector2(a, -b), Vector2(a, -a), Vector2(b, -a),
		Vector2(b, a), Vector2(a, a), Vector2(a, b), Vector2(-a, b),
		Vector2(-a, a), Vector2(-b, a), Vector2(-b, -a), Vector2(-a, -a),
	])
	_shape(ci, pts, fill, line, w)
	var inner := PackedVector2Array()
	for p in pts:
		inner.append(p * 0.56)
	ci.draw_colored_polygon(inner, fill.lightened(0.30))
	_gloss(ci, Vector2(-0.08, -0.28) * s, s * 0.055)


# --- Special-piece decoration -------------------------------------------------

static func _special_overlay(ci: CanvasItem, special: int, s: float, phase: float) -> void:
	var pulse: float = 0.55 + 0.45 * sin(phase * 4.0)
	match special:
		PieceKind.Special.LINE_H, PieceKind.Special.LINE_V:
			var neon := Palette.ACCENT
			neon.a = 0.55 + 0.45 * pulse
			var ring := rounded_rect(Vector2.ZERO, Vector2(1.0, 1.0) * s * 0.96, s * 0.22)
			ring.append(ring[0])
			ci.draw_polyline(ring, neon, maxf(2.5, s * 0.055), true)
			var horizontal := special == PieceKind.Special.LINE_H
			var tip := s * 0.46
			var wing := s * 0.11
			for dir: float in [-1.0, 1.0]:
				var head := Vector2(tip * dir, 0.0) if horizontal else Vector2(0.0, tip * dir)
				var back := head * 0.66
				var side := Vector2(0.0, wing) if horizontal else Vector2(wing, 0.0)
				ci.draw_colored_polygon(PackedVector2Array([head, back + side, back - side]), neon)
		PieceKind.Special.RAINBOW:
			var wheel := [Palette.CORAL, Palette.YELLOW, Palette.MINT, Palette.CYAN, Palette.SKY, Palette.LAVENDER]
			var radius := s * 0.50
			for i in wheel.size():
				var start := TAU * float(i) / float(wheel.size()) + phase
				var tint: Color = wheel[i]
				tint.a = 0.75 + 0.25 * pulse
				ci.draw_arc(Vector2.ZERO, radius, start, start + TAU / float(wheel.size()), 8, tint, maxf(3.0, s * 0.07), true)
			ci.draw_circle(Vector2.ZERO, s * 0.13 * (0.9 + 0.15 * pulse), Color(1, 1, 1, 0.9))


# --- Primitives ---------------------------------------------------------------

static func _shape(ci: CanvasItem, pts: PackedVector2Array, fill: Color, line: Color, w: float) -> void:
	ci.draw_colored_polygon(pts, fill)
	var closed := pts.duplicate()
	closed.append(pts[0])
	ci.draw_polyline(closed, line, w, true)


static func rounded_rect(center: Vector2, size: Vector2, radius: float, segments: int = 5) -> PackedVector2Array:
	var half := size * 0.5
	radius = minf(radius, minf(half.x, half.y))
	var corners := [
		[Vector2(half.x - radius, half.y - radius), 0.0],
		[Vector2(-half.x + radius, half.y - radius), PI * 0.5],
		[Vector2(-half.x + radius, -half.y + radius), PI],
		[Vector2(half.x - radius, -half.y + radius), PI * 1.5],
	]
	var pts := PackedVector2Array()
	for corner: Array in corners:
		var origin: Vector2 = corner[0]
		var base: float = corner[1]
		for i in segments + 1:
			var angle := base + PI * 0.5 * float(i) / float(segments)
			pts.append(center + origin + Vector2(cos(angle), sin(angle)) * radius)
	return pts


## Catmull-rom-ish smoothing so hand-placed control points read as a soft curve.
static func _curve(points: Array, s: float) -> PackedVector2Array:
	var out := PackedVector2Array()
	var steps := 8
	for i in range(points.size() - 1):
		var p0: Vector2 = points[maxi(i - 1, 0)]
		var p1: Vector2 = points[i]
		var p2: Vector2 = points[i + 1]
		var p3: Vector2 = points[mini(i + 2, points.size() - 1)]
		for j in steps:
			var t := float(j) / float(steps)
			var t2 := t * t
			var t3 := t2 * t
			var point := 0.5 * (
				(2.0 * p1)
				+ (-p0 + p2) * t
				+ (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) * t2
				+ (-p0 + 3.0 * p1 - 3.0 * p2 + p3) * t3
			)
			out.append(point * s)
		out.append(points[i + 1] * s)
	return out


## Soft specular dot that gives each piece its slight dimensionality.
static func _gloss(ci: CanvasItem, at: Vector2, radius: float) -> void:
	ci.draw_circle(at, radius, Color(1, 1, 1, 0.42))
