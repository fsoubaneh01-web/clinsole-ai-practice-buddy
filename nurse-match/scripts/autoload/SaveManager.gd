extends Node
## Local-only progress + settings storage.
##
## Everything lives in a single JSON file under `user://`. No accounts, no
## network, no backend — the prototype owns its data outright.

const SAVE_PATH := "user://nurse_match_save.json"
const SAVE_VERSION := 1

signal progress_changed()
signal settings_changed()

## level_id (int) -> {"stars": int, "best_score": int}
var completed: Dictionary = {}
var highest_unlocked: int = 1
var settings: Dictionary = {
	"sound": true,
	"music": true,
	"vibration": true,
}


func _ready() -> void:
	load_game()


func load_game() -> void:
	if not FileAccess.file_exists(SAVE_PATH):
		return
	var file := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file == null:
		push_warning("Nurse Match: could not open save file for reading.")
		return
	var raw := file.get_as_text()
	file.close()
	var parsed: Variant = JSON.parse_string(raw)
	if typeof(parsed) != TYPE_DICTIONARY:
		push_warning("Nurse Match: save file was unreadable, starting fresh.")
		return
	var data: Dictionary = parsed
	highest_unlocked = int(data.get("highest_unlocked", 1))
	for key in data.get("completed", {}):
		var entry: Dictionary = data["completed"][key]
		completed[int(key)] = {
			"stars": int(entry.get("stars", 0)),
			"best_score": int(entry.get("best_score", 0)),
		}
	var stored_settings: Dictionary = data.get("settings", {})
	for key in settings:
		if stored_settings.has(key):
			settings[key] = bool(stored_settings[key])


func save_game() -> void:
	var serialised_completed := {}
	for level_id in completed:
		serialised_completed[str(level_id)] = completed[level_id]
	var payload := {
		"version": SAVE_VERSION,
		"highest_unlocked": highest_unlocked,
		"completed": serialised_completed,
		"settings": settings,
	}
	var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file == null:
		push_warning("Nurse Match: could not open save file for writing.")
		return
	file.store_string(JSON.stringify(payload, "\t"))
	file.close()


## Records a finished level and unlocks the next one. Keeps the player's best
## result rather than the most recent one.
func record_level_result(level_id: int, score: int, stars: int) -> void:
	var previous: Dictionary = completed.get(level_id, {"stars": 0, "best_score": 0})
	completed[level_id] = {
		"stars": maxi(stars, int(previous["stars"])),
		"best_score": maxi(score, int(previous["best_score"])),
	}
	highest_unlocked = maxi(highest_unlocked, level_id + 1)
	save_game()
	progress_changed.emit()


func is_unlocked(level_id: int) -> bool:
	return level_id <= highest_unlocked


func stars_for(level_id: int) -> int:
	return int(completed.get(level_id, {}).get("stars", 0))


func best_score_for(level_id: int) -> int:
	return int(completed.get(level_id, {}).get("best_score", 0))


func total_stars() -> int:
	var total := 0
	for level_id in completed:
		total += int(completed[level_id]["stars"])
	return total


func get_setting(key: String) -> bool:
	return bool(settings.get(key, true))


func set_setting(key: String, value: bool) -> void:
	settings[key] = value
	save_game()
	settings_changed.emit()


## Wipes progress. Exposed through Settings so playtesters can restart clean.
func reset_progress() -> void:
	completed.clear()
	highest_unlocked = 1
	save_game()
	progress_changed.emit()
