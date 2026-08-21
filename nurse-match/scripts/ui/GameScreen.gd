extends Control
## The playing screen: HUD, board, mascot and the win/lose hand-off.
##
## Gameplay signals flow board -> ScoreManager -> HUD. This screen only wires
## them together and reacts when the level resolves.

const BOARD_SCENE := preload("res://scenes/components/Board.tscn")
const NURSE_SCENE := preload("res://scenes/components/NurseMascot.tscn")

var _level: LevelData
var _scorer: ScoreManager
var _board: Board
var _mascot: NurseMascot
var _score_label: Label
var _moves_label: Label
var _objective_label: Label
var _progress: ProgressBar


func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	_level = LevelManager.current
	if _level == null:
		_level = LevelManager.select(1)
	_scorer = ScoreManager.new()
	add_child(_scorer)
	_build()
	_connect_signals()
	_scorer.start(_level)
	_board.setup(_scorer)
	GameStateManager.state_changed.connect(_on_state_changed)


func _build() -> void:
	var safe := preload("res://scenes/ui/SafeArea.tscn").instantiate()
	add_child(safe)

	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 14)
	safe.add_child(column)

	# --- HUD row: LEVEL | SCORE | MOVES ---------------------------------------
	var hud := HBoxContainer.new()
	hud.add_theme_constant_override("separation", 12)
	column.add_child(hud)

	var level_label := UIKit.mono("LEVEL %03d" % _level.id, 34, Palette.TEXT_DIM)
	level_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	level_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	hud.add_child(level_label)

	_score_label = UIKit.mono("SCORE 000000", 38)
	_score_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_score_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_score_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	hud.add_child(_score_label)

	_moves_label = UIKit.mono("MOVES %d" % _level.moves, 34)
	_moves_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_moves_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	_moves_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	hud.add_child(_moves_label)

	# --- Objective strip -------------------------------------------------------
	var target_panel := UIKit.panel(Palette.SURFACE_SOFT, Palette.RADIUS_MD)
	column.add_child(target_panel)
	var target_column := VBoxContainer.new()
	target_column.add_theme_constant_override("separation", 10)
	target_panel.add_child(target_column)

	var target_row := HBoxContainer.new()
	target_column.add_child(target_row)
	var target_tag := UIKit.mono("TARGET", 28, Palette.TEXT_DIM)
	target_tag.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	target_row.add_child(target_tag)
	_objective_label = UIKit.mono(_level.target_label(), 30, Palette.ACCENT)
	_objective_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	target_row.add_child(_objective_label)

	_progress = ProgressBar.new()
	_progress.custom_minimum_size = Vector2(0, 18)
	_progress.show_percentage = false
	_progress.max_value = maxf(1.0, float(_scorer.objective_target() if _scorer else _level.target_score))
	_progress.add_theme_stylebox_override("background", _bar_style(Palette.SURFACE, 0))
	_progress.add_theme_stylebox_override("fill", _bar_style(Palette.ACCENT, 0))
	target_column.add_child(_progress)

	var hint := UIKit.display(_level.objective_text(), 30, Palette.TEXT_DIM, false)
	hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
	target_column.add_child(hint)

	# --- Board -----------------------------------------------------------------
	_board = BOARD_SCENE.instantiate()
	_board.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_board.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	column.add_child(_board)

	# --- Bottom bar ------------------------------------------------------------
	var bottom := HBoxContainer.new()
	bottom.add_theme_constant_override("separation", 16)
	column.add_child(bottom)

	_mascot = NURSE_SCENE.instantiate()
	_mascot.custom_minimum_size = Vector2(150, 150)
	bottom.add_child(_mascot)

	var area := UIKit.mono(_level.area_name, 28, Palette.area_color(_level.area_index))
	area.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	area.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	bottom.add_child(area)

	var pause := UIKit.button("II", UIKit.ButtonKind.SECONDARY)
	pause.custom_minimum_size = Vector2(120, 96)
	pause.add_theme_font_override("font", Palette.font_mono_bold)
	pause.pressed.connect(func() -> void: GameStateManager.change_state(GameStateManager.State.PAUSED))
	bottom.add_child(pause)


func _connect_signals() -> void:
	_board.score_awarded.connect(func(points: int, _cell: Vector2i) -> void: _scorer.add_score(points))
	_board.pieces_cleared.connect(func(type: int, count: int) -> void: _scorer.register_cleared(type, count))
	_board.move_spent.connect(_scorer.use_move)
	_board.settled.connect(_scorer.evaluate)
	_board.special_created.connect(func(_special: int) -> void: _mascot.react(NurseMascot.Mood.HAPPY, 1.0))
	_board.cascade_step.connect(func(depth: int) -> void:
		if depth >= 2:
			_mascot.react(NurseMascot.Mood.CELEBRATE, 1.0))

	_scorer.score_changed.connect(_on_score_changed)
	_scorer.moves_changed.connect(_on_moves_changed)
	_scorer.objective_changed.connect(_on_objective_changed)
	_scorer.level_won.connect(_on_level_won)
	_scorer.level_lost.connect(_on_level_lost)


func _on_score_changed(score: int) -> void:
	_score_label.text = "SCORE %06d" % score
	_bump(_score_label)
	if _level.objective == LevelData.Objective.SCORE:
		_progress.value = minf(float(score), _progress.max_value)


func _on_moves_changed(moves_left: int) -> void:
	_moves_label.text = "MOVES %d" % moves_left
	# Low moves switch to the accent so the pressure is impossible to miss.
	_moves_label.add_theme_color_override("font_color", Palette.ACCENT if moves_left <= 5 else Palette.TEXT)
	_bump(_moves_label)
	if moves_left <= 3 and moves_left > 0:
		_mascot.react(NurseMascot.Mood.ENCOURAGE, 1.4)


func _on_objective_changed(current: int, target: int) -> void:
	_progress.max_value = maxf(1.0, float(target))
	_progress.value = minf(float(current), _progress.max_value)
	if _level.objective == LevelData.Objective.COLLECT:
		_objective_label.text = "%s %d/%d" % [PieceKind.name_of(_level.collect_type), current, target]


func _on_level_won() -> void:
	_board.interactive = false
	AudioManager.play(&"level_complete")
	AudioManager.vibrate(60)
	_mascot.react(NurseMascot.Mood.CELEBRATE, 3.0)
	var stars := _scorer.stars()
	SaveManager.record_level_result(_level.id, _scorer.score, stars)
	GameStateManager.last_result = {
		"level_id": _level.id,
		"score": _scorer.score,
		"stars": stars,
		"objective": _level.objective_text(),
		"moves_left": _scorer.moves_left,
	}
	await get_tree().create_timer(0.7).timeout
	if is_inside_tree():
		GameStateManager.change_state(GameStateManager.State.LEVEL_COMPLETE)


func _on_level_lost() -> void:
	_board.interactive = false
	AudioManager.play(&"game_over")
	_mascot.react(NurseMascot.Mood.SAD, 3.0)
	GameStateManager.last_result = {
		"level_id": _level.id,
		"score": _scorer.score,
		"target": _scorer.objective_target(),
		"current": _scorer.objective_current(),
		"objective": _level.objective_text(),
	}
	await get_tree().create_timer(0.6).timeout
	if is_inside_tree():
		GameStateManager.change_state(GameStateManager.State.GAME_OVER)


func _on_state_changed(_previous: int, next: int) -> void:
	# Overlays freeze the board; returning to PLAYING hands control back.
	_board.interactive = next == GameStateManager.State.PLAYING


func _bump(label: Label) -> void:
	label.pivot_offset = label.size * 0.5
	var tween := create_tween()
	tween.tween_property(label, "scale", Vector2.ONE * 1.08, 0.06)
	tween.tween_property(label, "scale", Vector2.ONE, 0.12).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)


func _bar_style(fill: Color, _unused: int) -> StyleBoxFlat:
	var box := StyleBoxFlat.new()
	box.bg_color = fill
	box.set_corner_radius_all(9)
	return box
