extends Node
## Central design system for Nurse Match.
##
## Holds every colour, font and spacing token used by the game so the whole
## product can be re-skinned from a single file. The world (board + pieces +
## mascot) is bright and playful; the interface is dark, arcade-flavoured and
## uses the neon accent sparingly.

# --- Interface (arcade layer) -------------------------------------------------
const BG := Color("#000000")
const BG_ELEVATED := Color("#0B0B0C")
const SURFACE := Color("#29292A")
const SURFACE_SOFT := Color("#1A1A1B")
const OUTLINE := Color("#3A3A3C")
const TEXT := Color("#FFFFFF")
const TEXT_DIM := Color("#9A9A9E")
const ACCENT := Color("#EE1F66")
const ACCENT_DEEP := Color("#B01449")
const SUCCESS := Color("#3FD9A0")
const LOCKED := Color("#4A4A4E")
const STAR := Color("#FFC95C")

# --- World (playful layer) ----------------------------------------------------
const LAVENDER := Color("#B8A6F5")
const MINT := Color("#5FE0B0")
const CYAN := Color("#3FD0DB")
const YELLOW := Color("#FFC95C")
const CORAL := Color("#FF6F91")
const SKY := Color("#5AA9F5")
const PEACH := Color("#FFB48A")

# --- Layout tokens ------------------------------------------------------------
const RADIUS_SM := 10
const RADIUS_MD := 18
const RADIUS_LG := 28
const PAD := 24

var font_display: Font
var font_display_bold: Font
var font_mono: Font
var font_mono_bold: Font


func _ready() -> void:
	var inter := load("res://assets/fonts/Inter.ttf") as FontFile
	if inter:
		font_display = inter
		var bold := FontVariation.new()
		bold.base_font = inter
		bold.variation_opentype = {"wght": 700}
		font_display_bold = bold
	font_mono = load("res://assets/fonts/JetBrainsMono-Regular.ttf")
	font_mono_bold = load("res://assets/fonts/JetBrainsMono-Bold.ttf")


## Rounded panel used by every dark surface in the UI.
func panel(fill: Color = SURFACE_SOFT, radius: int = RADIUS_MD, border: Color = OUTLINE, border_width: int = 2) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = fill
	sb.corner_radius_top_left = radius
	sb.corner_radius_top_right = radius
	sb.corner_radius_bottom_left = radius
	sb.corner_radius_bottom_right = radius
	if border_width > 0:
		sb.border_color = border
		sb.set_border_width_all(border_width)
	sb.content_margin_left = PAD
	sb.content_margin_right = PAD
	sb.content_margin_top = 16
	sb.content_margin_bottom = 16
	return sb


## Deterministic accent tint per hospital area, used by the level map.
func area_color(area_index: int) -> Color:
	var wheel := [CORAL, LAVENDER, PEACH, CYAN, SKY, MINT, YELLOW]
	return wheel[area_index % wheel.size()]
