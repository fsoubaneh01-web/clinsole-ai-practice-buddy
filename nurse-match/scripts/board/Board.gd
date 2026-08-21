class_name Board
extends Control
## The 8x8 playfield: layout, input, and the swap → match → gravity → cascade loop.
##
## The board owns *presentation and orchestration*. The rules themselves live in
## `MatchManager` (what matches) and `SpecialPieceManager` (what specials do), so
## this file stays about timing and feel.

signal score_awarded(points: int, at_cell: Vector2i)
signal pieces_cleared(type: int, count: int)
signal move_spent()
signal special_created(special: int)
signal cascade_step(depth: int)
signal settled()

const PIECE_SCENE := preload("res://scenes/components/Piece.tscn")
const POPUP_SCENE := preload("res://scenes/components/ScorePopup.tscn")

## Timings, gathered so the whole game's feel can be tuned in one place.
const SWAP_TIME := 0.16
const POP_TIME := 0.20
const FALL_BASE := 0.10
const FALL_PER_CELL := 0.028
const FALL_MAX := 0.34
const SETTLE_PAUSE := 0.05
## A drag has to travel this fraction of a cell before it counts as a swipe.
const SWIPE_THRESHOLD := 0.32

@export var columns: int = 8
@export var rows: int = 8
@export var padding: float = 18.0

var interactive := true:
	set(value):
		interactive = value
		queue_redraw()

var _grid: Array = [] ## Array[Array[Piece]] indexed [x][y], y=0 at the top.
var _cell_size: float = 64.0
var _origin := Vector2.ZERO
var _busy := false
var _selected := Vector2i(-1, -1)
var _press_cell := Vector2i(-1, -1)
var _press_position := Vector2.ZERO
var _pressed := false
var _dragged := false
var _scorer: ScoreManager


func _ready() -> void:
	clip_contents = false
	mouse_filter = Control.MOUSE_FILTER_STOP
	resized.connect(_relayout)


## Called by the game screen before play starts.
func setup(scorer: ScoreManager) -> void:
	_scorer = scorer
	generate_board()


# --- Layout -------------------------------------------------------------------

func _relayout() -> void:
	if columns <= 0 or rows <= 0:
		return
	var usable := size - Vector2(padding, padding) * 2.0
	_cell_size = maxf(8.0, minf(usable.x / float(columns), usable.y / float(rows)))
	var grid_size := Vector2(_cell_size * columns, _cell_size * rows)
	_origin = (size - grid_size) * 0.5
	for x in _grid.size():
		for y in _grid[x].size():
			var piece: Piece = _grid[x][y]
			if piece:
				piece.cell_size = _cell_size
				piece.position = cell_to_position(Vector2i(x, y))
				piece.queue_redraw()
	queue_redraw()


func cell_to_position(cell: Vector2i) -> Vector2:
	return _origin + Vector2(cell.x + 0.5, cell.y + 0.5) * _cell_size


func position_to_cell(point: Vector2) -> Vector2i:
	var local := (point - _origin) / _cell_size
	return Vector2i(floori(local.x), floori(local.y))


func in_bounds(cell: Vector2i) -> bool:
	return cell.x >= 0 and cell.y >= 0 and cell.x < columns and cell.y < rows


func cell_size() -> float:
	return _cell_size


# --- Board generation ---------------------------------------------------------

func generate_board() -> void:
	_clear_all_pieces()
	_relayout()
	_grid = []
	for x in columns:
		var column: Array = []
		column.resize(rows)
		_grid.append(column)
	for y in rows:
		for x in columns:
			var cell := Vector2i(x, y)
			_grid[x][y] = _create_piece(cell, _pick_safe_type(cell))
	# A starting board with no legal move would be unplayable, so keep shuffling
	# until one exists. In practice this almost never runs more than once.
	var attempts := 0
	while not MatchManager.has_possible_move(type_grid(), columns, rows) and attempts < 24:
		_reshuffle_types()
		attempts += 1


## Picks a type that will not complete a run at `cell` given what is placed so far.
func _pick_safe_type(cell: Vector2i) -> int:
	var types := type_grid()
	var candidates := range(PieceKind.COUNT)
	candidates.shuffle()
	for type: int in candidates:
		if not MatchManager.creates_match(types, columns, rows, cell, type):
			return type
	return int(candidates[0])


## Re-rolls every piece's type in place, keeping the board free of instant matches.
func _reshuffle_types() -> void:
	for y in rows:
		for x in columns:
			var cell := Vector2i(x, y)
			_grid[x][y].configure(_pick_safe_type_ignoring(cell), PieceKind.Special.NONE, _cell_size)


func _pick_safe_type_ignoring(cell: Vector2i) -> int:
	var types := type_grid()
	types[cell.x][cell.y] = -1
	var candidates := range(PieceKind.COUNT)
	candidates.shuffle()
	for type: int in candidates:
		if not MatchManager.creates_match(types, columns, rows, cell, type):
			return type
	return int(candidates[0])


func _create_piece(cell: Vector2i, type: int, special: int = PieceKind.Special.NONE) -> Piece:
	var piece: Piece = PIECE_SCENE.instantiate()
	add_child(piece)
	piece.configure(type, special, _cell_size)
	piece.grid_pos = cell
	piece.position = cell_to_position(cell)
	return piece


func _clear_all_pieces() -> void:
	for x in _grid.size():
		for y in _grid[x].size():
			var piece: Piece = _grid[x][y]
			if piece:
				piece.queue_free()
	_grid = []


## Snapshot of the board as plain type ids, the form the rules engine works on.
func type_grid() -> Array:
	var types: Array = []
	for x in columns:
		var column: Array = []
		column.resize(rows)
		for y in rows:
			var piece: Piece = _grid[x][y] if x < _grid.size() and y < _grid[x].size() else null
			column[y] = piece.type if piece else -1
		types.append(column)
	return types


func piece_at(cell: Vector2i) -> Piece:
	if not in_bounds(cell):
		return null
	return _grid[cell.x][cell.y]


# --- Input --------------------------------------------------------------------

func _gui_input(event: InputEvent) -> void:
	# Touch is delivered as mouse input (Godot's emulate-mouse-from-touch), so a
	# single pointer path serves phones and desktop testing alike.
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		if event.pressed:
			_on_pointer_down(event.position)
		else:
			_on_pointer_up()
	elif event is InputEventMouseMotion and _pressed:
		_on_pointer_move(event.position)


func _on_pointer_down(point: Vector2) -> void:
	if not interactive or _busy:
		return
	var cell := position_to_cell(point)
	if not in_bounds(cell):
		return
	_pressed = true
	_dragged = false
	_press_cell = cell
	_press_position = point


func _on_pointer_move(point: Vector2) -> void:
	if _dragged or not interactive or _busy:
		return
	var delta := point - _press_position
	if delta.length() < _cell_size * SWIPE_THRESHOLD:
		return
	_dragged = true
	# Snap the swipe to the dominant axis so a sloppy diagonal still reads as the
	# swap the player meant.
	var direction := Vector2i(int(signf(delta.x)), 0) if absf(delta.x) > absf(delta.y) \
		else Vector2i(0, int(signf(delta.y)))
	var target := _press_cell + direction
	_set_selected(Vector2i(-1, -1))
	if in_bounds(target):
		try_swap(_press_cell, target)


func _on_pointer_up() -> void:
	if not _pressed:
		return
	_pressed = false
	if _dragged or not interactive or _busy:
		return
	# A tap: pick a piece, then tap an adjacent one to swap.
	if _selected == _press_cell:
		_set_selected(Vector2i(-1, -1))
	elif in_bounds(_selected) and _is_adjacent(_selected, _press_cell):
		var from := _selected
		_set_selected(Vector2i(-1, -1))
		try_swap(from, _press_cell)
	else:
		_set_selected(_press_cell)
		AudioManager.play(&"select")


func _set_selected(cell: Vector2i) -> void:
	var previous := piece_at(_selected)
	if previous:
		previous.set_selected(false)
	_selected = cell
	var current := piece_at(cell)
	if current:
		current.set_selected(true)
	queue_redraw()


func _is_adjacent(a: Vector2i, b: Vector2i) -> bool:
	return absi(a.x - b.x) + absi(a.y - b.y) == 1


# --- Swapping -----------------------------------------------------------------

func try_swap(from: Vector2i, to: Vector2i) -> void:
	if _busy or not interactive or not in_bounds(from) or not in_bounds(to) or not _is_adjacent(from, to):
		return
	var a := piece_at(from)
	var b := piece_at(to)
	if a == null or b == null:
		return
	_busy = true
	AudioManager.play(&"swap")
	await _animate_swap(a, b)
	_place(a, to)
	_place(b, from)

	var rainbow_cell := to if a.special == PieceKind.Special.RAINBOW else \
		(from if b.special == PieceKind.Special.RAINBOW else Vector2i(-1, -1))
	if in_bounds(rainbow_cell):
		var other_cell := from if rainbow_cell == to else to
		move_spent.emit()
		await _detonate_rainbow(rainbow_cell, other_cell)
		await _resolve([] as Array[Vector2i])
		_finish_turn()
		return

	if MatchManager.find_runs(type_grid(), columns, rows).is_empty():
		# Illegal move — put both pieces back and tell the player so.
		AudioManager.play(&"invalid")
		AudioManager.vibrate(18)
		var direction := Vector2(to - from)
		a.shake(direction)
		b.shake(-direction)
		await get_tree().create_timer(0.18).timeout
		if not is_inside_tree():
			return
		await _animate_swap(a, b)
		_place(a, from)
		_place(b, to)
		_busy = false
		return

	move_spent.emit()
	await _resolve([from, to] as Array[Vector2i])
	_finish_turn()


func _finish_turn() -> void:
	if not is_inside_tree():
		return
	_busy = false
	settled.emit()


func _animate_swap(a: Piece, b: Piece) -> void:
	var a_target := b.position
	var b_target := a.position
	a.z_index = 3
	a.animate_to(a_target, SWAP_TIME)
	b.animate_to(b_target, SWAP_TIME)
	await get_tree().create_timer(SWAP_TIME).timeout
	a.z_index = 0


func _place(piece: Piece, cell: Vector2i) -> void:
	_grid[cell.x][cell.y] = piece
	piece.grid_pos = cell


# --- The resolve loop ---------------------------------------------------------

## Runs matches, gravity and cascades until the board is stable again.
func _resolve(moved_cells: Array[Vector2i]) -> void:
	var depth := 0
	while true:
		if not is_inside_tree():
			return
		var runs := MatchManager.find_runs(type_grid(), columns, rows)
		if runs.is_empty():
			break
		if depth > 0:
			AudioManager.play_cascade(depth)
			cascade_step.emit(depth)
		await _clear_runs(runs, moved_cells, depth)
		await _collapse_and_refill()
		moved_cells = [] as Array[Vector2i]
		depth += 1
	_ensure_playable()


func _clear_runs(runs: Array, moved_cells: Array[Vector2i], depth: int) -> void:
	# 1. Award points and decide which runs earn a special.
	var promotions: Array = []
	var claimed := {}
	for run: Dictionary in runs:
		var points: int = _scorer.points_for_run(run["length"], depth) if _scorer else 0
		if points > 0:
			var centre: Vector2i = run["cells"][int(run["cells"].size() / 2)]
			_award(points, centre)
		var special := SpecialPieceManager.promotion_for(run)
		if special != PieceKind.Special.NONE:
			var cell: Vector2i = SpecialPieceManager.promotion_cell(run, moved_cells)
			if not claimed.has(cell):
				claimed[cell] = true
				promotions.append({"cell": cell, "special": special, "type": run["type"]})

	# 2. Expand the clear set through any specials caught in the blast.
	var seeds: Array[Vector2i] = []
	for cell in MatchManager.cells_in_runs(runs):
		if not claimed.has(cell):
			seeds.append(cell)
	var to_clear := _expand_specials(seeds, depth)

	# 3. Remove them.
	await _remove_cells(to_clear)

	# 4. Promote the pieces that earned a special.
	for promotion: Dictionary in promotions:
		var cell: Vector2i = promotion["cell"]
		var piece := piece_at(cell)
		if piece == null:
			piece = _create_piece(cell, int(promotion["type"]))
			_grid[cell.x][cell.y] = piece
		piece.configure(int(promotion["type"]), int(promotion["special"]), _cell_size)
		piece.celebrate()
		AudioManager.play(&"special_create")
		special_created.emit(int(promotion["special"]))


## Walks the clear set, detonating every special it touches and folding the
## cells they destroy back into the same set. Chains resolve in one pass.
func _expand_specials(seeds: Array[Vector2i], depth: int) -> Array[Vector2i]:
	var types := type_grid()
	var collected := {}
	var ordered: Array[Vector2i] = []
	var queue: Array[Vector2i] = seeds.duplicate()
	while not queue.is_empty():
		var cell: Vector2i = queue.pop_front()
		if collected.has(cell) or not in_bounds(cell):
			continue
		var piece := piece_at(cell)
		if piece == null:
			continue
		collected[cell] = true
		ordered.append(cell)
		if piece.special != PieceKind.Special.NONE:
			AudioManager.play(&"special_activate")
			AudioManager.vibrate(30)
			if _scorer:
				_award(_scorer.points_for_special(depth), cell)
			for extra in SpecialPieceManager.cells_cleared_by(piece.special, cell, types, columns, rows):
				queue.append(extra)
	return ordered


func _detonate_rainbow(rainbow_cell: Vector2i, other_cell: Vector2i) -> void:
	var other := piece_at(other_cell)
	var target_type := other.type if other and other.special != PieceKind.Special.RAINBOW else -1
	var types := type_grid()
	var cells := SpecialPieceManager.cells_cleared_by(
		PieceKind.Special.RAINBOW, rainbow_cell, types, columns, rows, target_type)
	AudioManager.play(&"special_activate")
	AudioManager.vibrate(40)
	if _scorer:
		_award(_scorer.points_for_special(0), rainbow_cell)
	await _remove_cells(_expand_specials(cells, 0))
	await _collapse_and_refill()


func _remove_cells(cells: Array[Vector2i]) -> void:
	if cells.is_empty():
		return
	var tally := {}
	for cell in cells:
		var piece := piece_at(cell)
		if piece == null:
			continue
		tally[piece.type] = int(tally.get(piece.type, 0)) + 1
		_grid[cell.x][cell.y] = null
		piece.pop()
		get_tree().create_timer(POP_TIME).timeout.connect(piece.queue_free)
	AudioManager.play(&"match")
	AudioManager.vibrate(20)
	for type: int in tally:
		pieces_cleared.emit(type, int(tally[type]))
	await get_tree().create_timer(POP_TIME * 0.75).timeout


## Gravity, then spawn replacements above the board and drop them in.
func _collapse_and_refill() -> void:
	var longest := 0.0
	for x in columns:
		var write_y := rows - 1
		for y in range(rows - 1, -1, -1):
			var piece: Piece = _grid[x][y]
			if piece == null:
				continue
			if write_y != y:
				_grid[x][y] = null
				_grid[x][write_y] = piece
				piece.grid_pos = Vector2i(x, write_y)
				var distance := write_y - y
				var duration := minf(FALL_BASE + FALL_PER_CELL * distance, FALL_MAX)
				piece.fall_to(cell_to_position(Vector2i(x, write_y)), duration)
				longest = maxf(longest, duration)
			write_y -= 1
		var empty_count := write_y + 1
		for i in empty_count:
			var target_cell := Vector2i(x, write_y - i)
			var piece := _create_piece(target_cell, randi() % PieceKind.COUNT)
			piece.position = cell_to_position(Vector2i(x, -1 - i))
			_grid[x][target_cell.y] = piece
			var duration := minf(FALL_BASE + FALL_PER_CELL * (empty_count + i), FALL_MAX)
			piece.spawn_in(cell_to_position(target_cell), duration)
			longest = maxf(longest, duration)
	if longest > 0.0:
		await get_tree().create_timer(longest + SETTLE_PAUSE).timeout


## Guarantees the player always has something to do.
func _ensure_playable() -> void:
	var attempts := 0
	while not MatchManager.has_possible_move(type_grid(), columns, rows) and attempts < 24:
		_reshuffle_types()
		attempts += 1


func _award(points: int, cell: Vector2i) -> void:
	score_awarded.emit(points, cell)
	var popup := POPUP_SCENE.instantiate()
	add_child(popup)
	popup.position = cell_to_position(cell)
	popup.show_points(points, _cell_size)


# --- Presentation -------------------------------------------------------------

func _draw() -> void:
	var grid_size := Vector2(_cell_size * columns, _cell_size * rows)
	var frame := Rect2(_origin - Vector2.ONE * padding * 0.6, grid_size + Vector2.ONE * padding * 1.2)
	draw_style_box(_board_style(), frame)
	# Subtle checker so the grid reads without competing with the pieces.
	for x in columns:
		for y in rows:
			var tint := Color(1, 1, 1, 0.028 if (x + y) % 2 == 0 else 0.055)
			var rect := Rect2(_origin + Vector2(x, y) * _cell_size, Vector2.ONE * _cell_size)
			draw_rect(rect.grow(-_cell_size * 0.04), tint, true)
	if in_bounds(_selected):
		var cell_rect := Rect2(_origin + Vector2(_selected) * _cell_size, Vector2.ONE * _cell_size)
		draw_rect(cell_rect.grow(-_cell_size * 0.05), Palette.ACCENT, false, maxf(2.0, _cell_size * 0.05))


func _board_style() -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = Palette.BG_ELEVATED
	style.set_corner_radius_all(Palette.RADIUS_LG)
	style.border_color = Palette.OUTLINE
	style.set_border_width_all(2)
	style.shadow_color = Color(0, 0, 0, 0.55)
	style.shadow_size = 18
	return style
