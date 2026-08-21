class_name MatchManager
extends RefCounted
## Pure match-3 rules. Operates on a plain 2D array of type ids (-1 = empty) so
## it can be unit-tested and reasoned about without any scene tree involved.

const MIN_MATCH := 3

enum Orientation { HORIZONTAL, VERTICAL }


## Every horizontal and vertical run of 3+ identical types.
## Returns dictionaries: {"cells": Array[Vector2i], "length": int, "orientation": int, "type": int}
static func find_runs(types: Array, width: int, height: int) -> Array:
	var runs: Array = []
	# Horizontal.
	for y in height:
		var x := 0
		while x < width:
			var type: int = types[x][y]
			var run_end := x
			while run_end + 1 < width and type >= 0 and types[run_end + 1][y] == type:
				run_end += 1
			var length := run_end - x + 1
			if type >= 0 and length >= MIN_MATCH:
				runs.append(_run(x, y, length, Orientation.HORIZONTAL, type))
			x = run_end + 1
	# Vertical.
	for x in width:
		var y := 0
		while y < height:
			var type: int = types[x][y]
			var run_end := y
			while run_end + 1 < height and type >= 0 and types[x][run_end + 1] == type:
				run_end += 1
			var length := run_end - y + 1
			if type >= 0 and length >= MIN_MATCH:
				runs.append(_run(x, y, length, Orientation.VERTICAL, type))
			y = run_end + 1
	return runs


## Deduplicated cells covered by the given runs — intersecting L and T shapes
## share cells, and each one may only be cleared once.
static func cells_in_runs(runs: Array) -> Array[Vector2i]:
	var seen := {}
	var cells: Array[Vector2i] = []
	for run in runs:
		for cell in run["cells"]:
			if not seen.has(cell):
				seen[cell] = true
				cells.append(cell)
	return cells


## Would placing `type` at `pos` complete a run? Used when generating a board
## that starts with no free matches.
static func creates_match(types: Array, width: int, height: int, pos: Vector2i, type: int) -> bool:
	return _run_length(types, width, height, pos, type, Vector2i.RIGHT) >= MIN_MATCH \
		or _run_length(types, width, height, pos, type, Vector2i.DOWN) >= MIN_MATCH


## True when at least one legal swap produces a match. A board without one is
## dead and must be reshuffled.
static func has_possible_move(types: Array, width: int, height: int) -> bool:
	return not find_hint(types, width, height).is_empty()


## The first swap found that would produce a match, as [from, to]. Empty when
## the board is dead.
static func find_hint(types: Array, width: int, height: int) -> Array[Vector2i]:
	for x in width:
		for y in height:
			for offset: Vector2i in [Vector2i.RIGHT, Vector2i.DOWN]:
				var a := Vector2i(x, y)
				var b := a + offset
				if b.x >= width or b.y >= height:
					continue
				if types[a.x][a.y] < 0 or types[b.x][b.y] < 0:
					continue
				if types[a.x][a.y] == types[b.x][b.y]:
					continue
				_swap(types, a, b)
				var produces := not find_runs(types, width, height).is_empty()
				_swap(types, a, b)
				if produces:
					return [a, b] as Array[Vector2i]
	return [] as Array[Vector2i]


static func _run(x: int, y: int, length: int, orientation: int, type: int) -> Dictionary:
	var cells: Array[Vector2i] = []
	for i in length:
		cells.append(Vector2i(x, y) + (Vector2i(i, 0) if orientation == Orientation.HORIZONTAL else Vector2i(0, i)))
	return {"cells": cells, "length": length, "orientation": orientation, "type": type}


## Length of the line through `pos` (inclusive) along `axis`, assuming `type`
## sits at `pos`.
static func _run_length(types: Array, width: int, height: int, pos: Vector2i, type: int, axis: Vector2i) -> int:
	var total := 1
	for direction: Vector2i in [axis, -axis]:
		var cursor := pos + direction
		while cursor.x >= 0 and cursor.y >= 0 and cursor.x < width and cursor.y < height \
				and types[cursor.x][cursor.y] == type:
			total += 1
			cursor += direction
	return total


static func _swap(types: Array, a: Vector2i, b: Vector2i) -> void:
	var carried: int = types[a.x][a.y]
	types[a.x][a.y] = types[b.x][b.y]
	types[b.x][b.y] = carried
