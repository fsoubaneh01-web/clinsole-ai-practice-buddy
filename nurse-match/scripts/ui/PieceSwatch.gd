class_name PieceSwatch
extends Control
## Draws one medical piece at a fixed size — used by the how-to-play legend.

@export var type: int = PieceKind.Type.HEART:
	set(value):
		type = value
		queue_redraw()
@export var special: int = PieceKind.Special.NONE:
	set(value):
		special = value
		queue_redraw()

var _phase := 0.0


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	custom_minimum_size = Vector2(96, 96)
	set_process(special != PieceKind.Special.NONE)


func _process(delta: float) -> void:
	_phase += delta
	queue_redraw()


func _draw() -> void:
	var s: float = minf(size.x, size.y)
	PieceArt.draw_piece(self, type, special, s * 0.9, _phase, size * 0.5)
