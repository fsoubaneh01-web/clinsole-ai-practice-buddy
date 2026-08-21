extends Control
## Screen router. Owns the one place where a game state becomes a scene.
##
## Full screens replace each other; pause and result screens are overlays laid
## on top of the running game so the board stays alive underneath.
##
## Both hosts, and this node, use MOUSE_FILTER_IGNORE. They are full-screen and
## empty most of the time, and a host that merely PASSes still consumes the pick
## and hands the event to its parent rather than to the screen below — which
## silently makes everything underneath unclickable. IGNORE does not affect
## their children, so overlays still capture input through their own scrim.

const SCREENS := {
	GameStateManager.State.MAIN_MENU: "res://scenes/ui/MainMenu.tscn",
	GameStateManager.State.LEVEL_SELECT: "res://scenes/ui/LevelSelect.tscn",
	GameStateManager.State.PLAYING: "res://scenes/ui/GameScreen.tscn",
	GameStateManager.State.SETTINGS: "res://scenes/ui/Settings.tscn",
	GameStateManager.State.HOW_TO_PLAY: "res://scenes/ui/HowToPlay.tscn",
}

const OVERLAYS := {
	GameStateManager.State.PAUSED: "res://scenes/ui/PauseMenu.tscn",
	GameStateManager.State.LEVEL_COMPLETE: "res://scenes/ui/LevelComplete.tscn",
	GameStateManager.State.GAME_OVER: "res://scenes/ui/GameOver.tscn",
}

@onready var _screen_host: Control = $ScreenHost
@onready var _overlay_host: Control = $OverlayHost

var _current_screen: Node = null
var _screen_state: int = -1


func _ready() -> void:
	add_to_group(&"ui_manager")
	GameStateManager.state_changed.connect(_on_state_changed)
	GameStateManager.reload_requested.connect(_on_reload_requested)
	_show_screen(GameStateManager.state)


func _on_state_changed(_previous: int, next: int) -> void:
	if OVERLAYS.has(next):
		_show_overlay(next)
		return
	_clear_overlays()
	# Dismissing an overlay returns to a screen that is already loaded — keep it
	# so the board underneath survives a pause.
	if next == _screen_state and is_instance_valid(_current_screen):
		return
	_show_screen(next)


func _on_reload_requested() -> void:
	_clear_overlays()
	_show_screen(GameStateManager.State.PLAYING)


func _show_screen(state: int) -> void:
	if not SCREENS.has(state):
		return
	_screen_state = state
	var packed: PackedScene = load(SCREENS[state])
	var screen: Control = packed.instantiate()
	screen.set_anchors_preset(Control.PRESET_FULL_RECT)
	if _current_screen and is_instance_valid(_current_screen):
		var outgoing := _current_screen
		var fade := create_tween()
		fade.tween_property(outgoing, "modulate:a", 0.0, 0.14)
		fade.tween_callback(outgoing.queue_free)
	_current_screen = screen
	_screen_host.add_child(screen)
	screen.modulate.a = 0.0
	var tween := create_tween()
	tween.tween_property(screen, "modulate:a", 1.0, 0.20)


func _show_overlay(state: int) -> void:
	_clear_overlays()
	var packed: PackedScene = load(OVERLAYS[state])
	var overlay: Control = packed.instantiate()
	overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	_overlay_host.add_child(overlay)


func _clear_overlays() -> void:
	for child in _overlay_host.get_children():
		child.queue_free()


## The game screen asks for this when an overlay is dismissed back into play.
func current_screen() -> Node:
	return _current_screen
