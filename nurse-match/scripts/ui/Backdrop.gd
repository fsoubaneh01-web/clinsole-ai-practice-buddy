extends Control
## Dark cinematic backdrop: a night-shift hospital glimpsed through coloured
## light rather than drawn literally. Cheap to render — a handful of soft blobs
## and a vignette, no shaders.

@export var accent_strength := 1.0

var _phase := 0.0
var _lights: Array = []


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	set_anchors_preset(Control.PRESET_FULL_RECT)
	_lights = [
		{"at": Vector2(0.18, 0.16), "radius": 0.55, "color": Palette.ACCENT, "alpha": 0.20, "speed": 0.35},
		{"at": Vector2(0.86, 0.30), "radius": 0.48, "color": Palette.CYAN, "alpha": 0.14, "speed": 0.27},
		{"at": Vector2(0.50, 0.92), "radius": 0.70, "color": Palette.LAVENDER, "alpha": 0.13, "speed": 0.21},
		{"at": Vector2(0.08, 0.72), "radius": 0.40, "color": Palette.MINT, "alpha": 0.10, "speed": 0.31},
	]
	set_process(true)


func _process(delta: float) -> void:
	_phase += delta
	queue_redraw()


func _draw() -> void:
	draw_rect(Rect2(Vector2.ZERO, size), Palette.BG, true)
	var reference: float = maxf(size.x, size.y)
	for light in _lights:
		var speed := float(light["speed"])
		var drift := Vector2(sin(_phase * speed), cos(_phase * speed * 0.8)) * 0.02
		var centre: Vector2 = (light["at"] + drift) * size
		var radius := float(light["radius"]) * reference * 0.5
		# Layered translucent discs approximate a soft radial glow.
		for i in 7:
			var t := float(i) / 6.0
			var tint: Color = light["color"]
			tint.a = float(light["alpha"]) * accent_strength * (1.0 - t) * 0.34
			draw_circle(centre, radius * (0.28 + t * 0.72), tint)
	# Corridor floor line — a hint of place without looking clinical.
	var horizon := size.y * 0.68
	draw_line(Vector2(0, horizon), Vector2(size.x, horizon), Color(1, 1, 1, 0.05), 2.0)
	# Vignette.
	for i in 6:
		var inset := float(i) * size.x * 0.02
		draw_rect(Rect2(Vector2(inset, inset), size - Vector2(inset, inset) * 2.0), Color(0, 0, 0, 0.05), false, size.x * 0.02)
