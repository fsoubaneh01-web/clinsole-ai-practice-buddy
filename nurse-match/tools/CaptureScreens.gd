extends Node
## Development utility: boots the real game and saves a PNG of every screen.
##
##   xvfb-run -a godot --path . res://tools/CaptureScreens.tscn -- --shots=<dir>
##
## Used to eyeball the UI without a device. Not shipped with the game.

const MAIN := preload("res://scenes/Main.tscn")

var _out_dir := "user://shots"


func _ready() -> void:
	for argument in OS.get_cmdline_user_args():
		if argument.begins_with("--shots="):
			_out_dir = argument.substr("--shots=".length())
	DirAccess.make_dir_recursive_absolute(_out_dir)
	get_window().size = Vector2i(540, 960)
	var game := MAIN.instantiate()
	add_child(game)
	await _capture("01_main_menu", 1.2)

	GameStateManager.change_state(GameStateManager.State.LEVEL_SELECT)
	await _capture("02_level_map", 0.8)

	GameStateManager.change_state(GameStateManager.State.HOW_TO_PLAY)
	await _capture("03_how_to_play", 0.8)

	GameStateManager.change_state(GameStateManager.State.SETTINGS)
	await _capture("04_settings", 0.8)

	LevelManager.select(3)
	GameStateManager.change_state(GameStateManager.State.PLAYING)
	await _capture("05_gameplay", 1.4)

	GameStateManager.change_state(GameStateManager.State.PAUSED)
	await _capture("06_paused", 0.8)
	GameStateManager.change_state(GameStateManager.State.PLAYING)
	await _idle(0.4)

	GameStateManager.last_result = {
		"level_id": 3, "score": 1420, "stars": 3,
		"objective": "Clear 15 bandages", "moves_left": 4,
	}
	GameStateManager.change_state(GameStateManager.State.LEVEL_COMPLETE)
	await _capture("07_level_complete", 1.0)

	GameStateManager.change_state(GameStateManager.State.PLAYING)
	await _idle(0.4)
	GameStateManager.last_result = {
		"level_id": 3, "score": 640, "target": 15, "current": 9,
		"objective": "Clear 15 bandages",
	}
	GameStateManager.change_state(GameStateManager.State.GAME_OVER)
	await _capture("08_game_over", 1.0)

	print("screenshots written to %s" % ProjectSettings.globalize_path(_out_dir))
	get_tree().quit()


func _capture(name: String, settle: float) -> void:
	await _idle(settle)
	var image := get_viewport().get_texture().get_image()
	image.save_png("%s/%s.png" % [_out_dir, name])
	print("captured %s" % name)


func _idle(seconds: float) -> void:
	await get_tree().create_timer(seconds).timeout
	await RenderingServer.frame_post_draw
