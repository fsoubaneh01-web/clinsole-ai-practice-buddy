class_name Piece
extends Node2D
## A single board tile: its identity, its artwork and its animations.
##
## The piece knows nothing about matching rules — `Board` drives it.

signal animation_finished()

const SELECT_SCALE := 1.14

var type: int = PieceKind.Type.HEART
var special: int = PieceKind.Special.NONE
var grid_pos := Vector2i.ZERO
var cell_size: float = 100.0

var _selected := false
var _idle_phase: float = 0.0
var _busy_tweens := 0


func _ready() -> void:
	_idle_phase = randf() * TAU
	set_process(true)


func configure(new_type: int, new_special: int, cell: float) -> void:
	type = new_type
	special = new_special
	cell_size = cell
	queue_redraw()


func set_special(new_special: int) -> void:
	special = new_special
	queue_redraw()


func _process(delta: float) -> void:
	_idle_phase += delta
	# Subtle idle breathing keeps the board feeling alive without distracting
	# from the pieces the player is actually reading.
	var breathe := 1.0 + sin(_idle_phase * 1.6) * 0.012
	if not _selected and _busy_tweens == 0:
		scale = Vector2.ONE * breathe
	if special != PieceKind.Special.NONE:
		queue_redraw()


func _draw() -> void:
	PieceArt.draw_piece(self, type, special, cell_size * 0.82, _idle_phase)


# --- Animations ---------------------------------------------------------------

func animate_to(target: Vector2, duration: float = 0.16, trans: Tween.TransitionType = Tween.TRANS_QUAD) -> Tween:
	return _tween_property("position", target, duration, trans, Tween.EASE_OUT)


## Gravity fall — pieces accelerate in and settle with a small bounce.
func fall_to(target: Vector2, duration: float) -> Tween:
	return _tween_property("position", target, duration, Tween.TRANS_BOUNCE, Tween.EASE_OUT)


func spawn_in(target: Vector2, duration: float) -> Tween:
	scale = Vector2.ONE * 0.6
	modulate.a = 0.0
	var tween := create_tween()
	tween.set_parallel(true)
	tween.tween_property(self, "position", target, duration).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tween.tween_property(self, "modulate:a", 1.0, duration * 0.6)
	tween.tween_property(self, "scale", Vector2.ONE, duration).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	_track(tween)
	return tween


## Removal pop: a quick swell, then collapse to nothing.
func pop() -> Tween:
	var tween := create_tween()
	tween.tween_property(self, "scale", Vector2.ONE * 1.25, 0.07).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tween.set_parallel(true)
	tween.tween_property(self, "scale", Vector2.ONE * 0.05, 0.13).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_IN)
	tween.tween_property(self, "modulate:a", 0.0, 0.13)
	tween.tween_property(self, "rotation", randf_range(-0.7, 0.7), 0.13)
	_track(tween)
	return tween


## Rejected swap — a short lateral shudder before the piece slides home.
func shake(direction: Vector2) -> Tween:
	var home := position
	var nudge := direction.normalized() * cell_size * 0.16
	var tween := create_tween()
	tween.tween_property(self, "position", home + nudge, 0.06).set_trans(Tween.TRANS_SINE)
	tween.tween_property(self, "position", home - nudge * 0.5, 0.06).set_trans(Tween.TRANS_SINE)
	tween.tween_property(self, "position", home, 0.06).set_trans(Tween.TRANS_SINE)
	_track(tween)
	return tween


func set_selected(value: bool) -> void:
	if _selected == value:
		return
	_selected = value
	var tween := create_tween()
	tween.tween_property(self, "scale", Vector2.ONE * (SELECT_SCALE if value else 1.0), 0.12) \
		.set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	if value:
		z_index = 5
	else:
		tween.tween_callback(func() -> void: z_index = 0)


## Flash used when a piece is promoted into a special.
func celebrate() -> Tween:
	var tween := create_tween()
	tween.tween_property(self, "scale", Vector2.ONE * 1.35, 0.12).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tween.tween_property(self, "scale", Vector2.ONE, 0.18).set_trans(Tween.TRANS_ELASTIC).set_ease(Tween.EASE_OUT)
	_track(tween)
	return tween


func _tween_property(property: String, value: Variant, duration: float, trans: Tween.TransitionType, ease_type: Tween.EaseType) -> Tween:
	var tween := create_tween()
	tween.tween_property(self, property, value, duration).set_trans(trans).set_ease(ease_type)
	_track(tween)
	return tween


func _track(tween: Tween) -> void:
	_busy_tweens += 1
	tween.finished.connect(func() -> void:
		_busy_tweens = maxi(0, _busy_tweens - 1)
		animation_finished.emit()
	)
