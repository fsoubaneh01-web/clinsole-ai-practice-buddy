extends Node
## Event-driven audio front end.
##
## Gameplay code only ever says *what happened* (`AudioManager.play(&"match")`),
## never *which file to load*. Two swappable back ends sit behind that:
##
##   1. If `res://assets/audio/<event>.ogg` (or .wav) exists it is used.
##   2. Otherwise a tiny procedural blip is synthesised so the prototype has
##      readable feedback without shipping placeholder art.
##
## Dropping final sound effects into `assets/audio/` replaces the placeholders
## with no code changes.

const AUDIO_DIR := "res://assets/audio/"
const SAMPLE_RATE := 22050
const SFX_VOICES := 8

## event name -> [frequency_hz, duration_s, waveform, volume_db]
const CUES := {
	&"button": [440.0, 0.06, "square", -14.0],
	&"select": [620.0, 0.05, "sine", -16.0],
	&"swap": [520.0, 0.07, "sine", -15.0],
	&"invalid": [150.0, 0.12, "square", -18.0],
	&"match": [700.0, 0.09, "sine", -12.0],
	&"special_create": [980.0, 0.16, "sine", -10.0],
	&"special_activate": [1180.0, 0.22, "square", -11.0],
	&"cascade": [860.0, 0.09, "sine", -12.0],
	&"level_complete": [880.0, 0.45, "sine", -8.0],
	&"game_over": [220.0, 0.45, "sine", -10.0],
}

var _voices: Array[AudioStreamPlayer] = []
var _next_voice := 0
var _cache: Dictionary = {}
var _music_player: AudioStreamPlayer


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	for i in SFX_VOICES:
		var player := AudioStreamPlayer.new()
		player.bus = &"Master"
		add_child(player)
		_voices.append(player)
	_music_player = AudioStreamPlayer.new()
	_music_player.bus = &"Master"
	add_child(_music_player)


## Fires a named gameplay event. Unknown events are ignored rather than fatal so
## new call sites can be added before their sound design exists.
func play(event: StringName, pitch: float = 1.0) -> void:
	if not SaveManager.get_setting("sound"):
		return
	var stream := _stream_for(event)
	if stream == null:
		return
	var voice := _voices[_next_voice]
	_next_voice = (_next_voice + 1) % _voices.size()
	voice.stream = stream
	voice.pitch_scale = clampf(pitch, 0.4, 2.5)
	voice.volume_db = float(CUES.get(event, [0.0, 0.0, "", -12.0])[3])
	voice.play()


## Cascades climb in pitch so a long chain reads as escalating.
func play_cascade(depth: int) -> void:
	play(&"cascade", 1.0 + 0.12 * float(depth))


func play_music(_track: StringName = &"theme") -> void:
	# Final music is not authored yet; the hook exists so the menu/gameplay
	# transitions can already request it.
	if not SaveManager.get_setting("music"):
		return


func stop_music() -> void:
	if _music_player.playing:
		_music_player.stop()


func vibrate(duration_ms: int = 30) -> void:
	if not SaveManager.get_setting("vibration"):
		return
	if OS.has_feature("mobile"):
		Input.vibrate_handheld(duration_ms)


func _stream_for(event: StringName) -> AudioStream:
	if _cache.has(event):
		return _cache[event]
	var stream: AudioStream = _load_authored(event)
	if stream == null and CUES.has(event):
		var cue: Array = CUES[event]
		stream = _synth(float(cue[0]), float(cue[1]), String(cue[2]))
	_cache[event] = stream
	return stream


func _load_authored(event: StringName) -> AudioStream:
	for extension: String in [".ogg", ".wav"]:
		var path := AUDIO_DIR + String(event) + extension
		if ResourceLoader.exists(path):
			return load(path) as AudioStream
	return null


## Builds a short 16-bit mono blip with a percussive envelope.
func _synth(frequency: float, duration: float, waveform: String) -> AudioStreamWAV:
	var frames := int(SAMPLE_RATE * duration)
	var data := PackedByteArray()
	data.resize(frames * 2)
	for i in frames:
		var t := float(i) / float(SAMPLE_RATE)
		var phase := fmod(frequency * t, 1.0)
		var wave := sin(TAU * phase) if waveform == "sine" else (1.0 if phase < 0.5 else -1.0)
		# Fast attack, exponential decay — reads as a UI blip, not a tone.
		var envelope: float = minf(1.0, float(i) / 64.0) * pow(1.0 - float(i) / float(frames), 2.2)
		var sample := int(clampf(wave * envelope, -1.0, 1.0) * 32000.0)
		data.encode_s16(i * 2, sample)
	var stream := AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_16_BITS
	stream.mix_rate = SAMPLE_RATE
	stream.stereo = false
	stream.data = data
	return stream
