extends Node
## The single source of truth for which screen the game is in.
##
## Screens never navigate to each other directly; they ask for a state and
## `UIManager` reacts. That keeps the state graph in one readable place.

enum State {
	MAIN_MENU,
	LEVEL_SELECT,
	PLAYING,
	PAUSED,
	LEVEL_COMPLETE,
	GAME_OVER,
	SETTINGS,
	HOW_TO_PLAY,
}

signal state_changed(previous: State, next: State)
## Emitted when the playing screen must be rebuilt from scratch (replay, next
## level, restart) — a plain state change would leave the old board in place.
signal reload_requested()

var state: State = State.MAIN_MENU
var previous_state: State = State.MAIN_MENU
## Result payload handed to the LEVEL_COMPLETE / GAME_OVER screens.
var last_result: Dictionary = {}


func change_state(next: State) -> void:
	if next == state:
		return
	previous_state = state
	state = next
	state_changed.emit(previous_state, state)


## Restarts play, optionally on a different level. Always rebuilds the screen.
func restart_level(level_id: int = 0) -> void:
	if level_id > 0:
		LevelManager.select(level_id)
	previous_state = state
	state = State.PLAYING
	reload_requested.emit()


func is_overlay(candidate: State) -> bool:
	return candidate in [State.PAUSED, State.LEVEL_COMPLETE, State.GAME_OVER]
