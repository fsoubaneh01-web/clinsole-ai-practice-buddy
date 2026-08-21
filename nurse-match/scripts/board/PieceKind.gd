class_name PieceKind
extends RefCounted
## Static description of the six matchable medical objects.
##
## Each type owns a distinct silhouette *and* a distinct hue, so the board stays
## readable for colour-blind players — shape alone is enough to tell them apart.

enum Type {
	STETHOSCOPE,
	MEDICINE,
	BANDAGE,
	SYRINGE,
	HEART,
	CROSS,
}

## Powers layered on top of a normal type. `NONE` is an ordinary piece.
enum Special {
	NONE,
	LINE_H, ## Clears its whole row.
	LINE_V, ## Clears its whole column.
	RAINBOW, ## Clears every piece of one chosen type.
}

const COUNT := 6

const NAMES := {
	Type.STETHOSCOPE: "STETHOSCOPE",
	Type.MEDICINE: "MEDICINE",
	Type.BANDAGE: "BANDAGE",
	Type.SYRINGE: "SYRINGE",
	Type.HEART: "HEART",
	Type.CROSS: "CROSS",
}

## Plural, sentence-case wording for objective text ("Clear 15 bandages").
const PLURALS := {
	Type.STETHOSCOPE: "stethoscopes",
	Type.MEDICINE: "medicine bottles",
	Type.BANDAGE: "bandages",
	Type.SYRINGE: "syringes",
	Type.HEART: "hearts",
	Type.CROSS: "medical crosses",
}

const COLORS := {
	Type.STETHOSCOPE: Color("#3FD0DB"), # cyan
	Type.MEDICINE: Color("#B8A6F5"), # lavender
	Type.BANDAGE: Color("#FFB48A"), # peach
	Type.SYRINGE: Color("#5AA9F5"), # sky blue
	Type.HEART: Color("#FF6F91"), # coral
	Type.CROSS: Color("#5FE0B0"), # mint
}


static func color_of(type: int) -> Color:
	return COLORS.get(type, Color.WHITE)


static func name_of(type: int) -> String:
	return NAMES.get(type, "PIECE")


static func plural_of(type: int) -> String:
	return PLURALS.get(type, "pieces")


## A darker companion tone, used for outlines and the shaded underside that
## gives each piece its slight dimensionality.
static func shade_of(type: int) -> Color:
	return color_of(type).darkened(0.42)


static func highlight_of(type: int) -> Color:
	return color_of(type).lightened(0.45)
