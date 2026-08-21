extends Control
## Level map screen: pick a ward, pick a level.


func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	_build()


func _build() -> void:
	var safe := preload("res://scenes/ui/SafeArea.tscn").instantiate()
	add_child(safe)

	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 16)
	safe.add_child(column)

	var stars := UIKit.mono("★ %d" % SaveManager.total_stars(), 36, Palette.STAR)
	stars.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	stars.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	column.add_child(UIKit.header("LEVEL MAP",
		func() -> void: GameStateManager.change_state(GameStateManager.State.MAIN_MENU), stars))

	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	column.add_child(scroll)

	var map := preload("res://scenes/ui/LevelMap.tscn").instantiate()
	map.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	map.level_chosen.connect(_on_level_chosen)
	scroll.add_child(map)


func _on_level_chosen(level_id: int) -> void:
	LevelManager.select(level_id)
	GameStateManager.change_state(GameStateManager.State.PLAYING)
