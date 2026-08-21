extends Control
## The hospital progression map: a winding path of level nodes grouped by ward.

const NODE_SPACING := 268.0
const AREA_HEADER_HEIGHT := 92.0

signal level_chosen(level_id: int)

var _nodes: Array[LevelNodeButton] = []
var _headers: Array[Dictionary] = []
var _path_points: PackedVector2Array = PackedVector2Array()


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_PASS
	resized.connect(_relayout)
	_build()


func _build() -> void:
	var last_area := -1
	var offset := 40.0
	for level in LevelManager.levels:
		if level.area_index != last_area:
			last_area = level.area_index
			_headers.append({"y": offset, "text": "%02d — %s" % [last_area + 1, level.area_name], "area": last_area})
			offset += AREA_HEADER_HEIGHT
		var node := LevelNodeButton.new()
		add_child(node)
		var next_to_play: int = clampi(SaveManager.highest_unlocked, 1, LevelManager.count())
		node.setup(level, SaveManager.is_unlocked(level.id), SaveManager.stars_for(level.id), level.id == next_to_play)
		node.set_meta("row_y", offset)
		node.pressed.connect(func() -> void:
			if node.unlocked:
				level_chosen.emit(level.id))
		_nodes.append(node)
		offset += NODE_SPACING
	custom_minimum_size = Vector2(0, offset + 60.0)
	_relayout()


func _relayout() -> void:
	if _nodes.is_empty() or size.x <= 0.0:
		return
	_path_points = PackedVector2Array()
	var amplitude: float = minf(size.x * 0.24, 200.0)
	for i in _nodes.size():
		var node := _nodes[i]
		var wobble: float = sin(float(i) * 1.05 + 0.5) * amplitude
		var centre_x := size.x * 0.5 + wobble
		var row_y: float = node.get_meta("row_y")
		node.position = Vector2(centre_x - node.custom_minimum_size.x * 0.5, row_y)
		node.size = node.custom_minimum_size
		_path_points.append(Vector2(centre_x, row_y + LevelNodeButton.NODE_RADIUS + 8.0))
	queue_redraw()


func _draw() -> void:
	# Dashed route between the wards.
	if _path_points.size() > 1:
		for i in range(_path_points.size() - 1):
			var from := _path_points[i]
			var to := _path_points[i + 1]
			var steps := 9
			for step in steps:
				if step % 2 == 1:
					continue
				var t0 := float(step) / float(steps)
				var t1 := float(step + 1) / float(steps)
				draw_line(from.lerp(to, t0), from.lerp(to, t1), Color(1, 1, 1, 0.16), 5.0, true)
	for header: Dictionary in _headers:
		var tint: Color = Palette.area_color(int(header["area"]))
		var y := float(header["y"]) + 34.0
		draw_string(Palette.font_mono_bold, Vector2(8, y), header["text"],
			HORIZONTAL_ALIGNMENT_LEFT, -1, 34, tint)
		draw_line(Vector2(8, y + 20.0), Vector2(size.x - 8.0, y + 20.0), Color(tint.r, tint.g, tint.b, 0.25), 2.0)
