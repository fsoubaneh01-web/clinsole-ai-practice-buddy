class_name SpecialPieceManager
extends RefCounted
## Decides which special piece a run earns, and which cells a special clears.
##
## The two prototype specials are deliberately simple. New powers (cross blast,
## area bomb, combo effects) only need a new `Special` enum value plus a branch
## in `promotion_for` and `cells_cleared_by` — no board changes.


## Which special a completed run creates, or `Special.NONE` for a plain 3-match.
static func promotion_for(run: Dictionary) -> int:
	var length: int = run["length"]
	if length >= 5:
		return PieceKind.Special.RAINBOW
	if length == 4:
		# A four in a row clears along the run's own axis, which is what players
		# intuitively expect from the shape they just made.
		return PieceKind.Special.LINE_H if run["orientation"] == MatchManager.Orientation.HORIZONTAL \
			else PieceKind.Special.LINE_V
	return PieceKind.Special.NONE


## Where the new special should appear: the cell the player actually moved, if
## it is part of the run, otherwise the middle of the run.
static func promotion_cell(run: Dictionary, moved_cells: Array[Vector2i]) -> Vector2i:
	var cells: Array = run["cells"]
	for cell: Vector2i in moved_cells:
		if cells.has(cell):
			return cell
	var fallback: Vector2i = cells[int(cells.size() / 2)]
	return fallback


## Cells removed when a special detonates. `context_type` is the type the
## rainbow piece was swapped against.
static func cells_cleared_by(special: int, origin: Vector2i, types: Array, width: int, height: int, context_type: int = -1) -> Array[Vector2i]:
	var cells: Array[Vector2i] = []
	match special:
		PieceKind.Special.LINE_H:
			for x in width:
				cells.append(Vector2i(x, origin.y))
		PieceKind.Special.LINE_V:
			for y in height:
				cells.append(Vector2i(origin.x, y))
		PieceKind.Special.RAINBOW:
			var target := context_type
			if target < 0:
				target = _most_common_type(types, width, height)
			for x in width:
				for y in height:
					if types[x][y] == target:
						cells.append(Vector2i(x, y))
			if not cells.has(origin):
				cells.append(origin)
	return cells


static func is_line(special: int) -> bool:
	return special == PieceKind.Special.LINE_H or special == PieceKind.Special.LINE_V


static func display_name(special: int) -> String:
	match special:
		PieceKind.Special.LINE_H:
			return "CODE LINE — clears its row"
		PieceKind.Special.LINE_V:
			return "CODE LINE — clears its column"
		PieceKind.Special.RAINBOW:
			return "CODE BLUE — clears one whole type"
		_:
			return ""


static func _most_common_type(types: Array, width: int, height: int) -> int:
	var tally := {}
	for x in width:
		for y in height:
			var type: int = types[x][y]
			if type >= 0:
				tally[type] = int(tally.get(type, 0)) + 1
	var best := 0
	var best_count := -1
	for type: int in tally:
		var count := int(tally[type])
		if count > best_count:
			best_count = count
			best = type
	return best
