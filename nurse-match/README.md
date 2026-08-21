# Nurse Match

An original healthcare-themed match-3 puzzle game. Godot 4.3, portrait mobile.

**CARE • MATCH • PLAY**

Playable prototype: an 8×8 board of six medical supplies, swipe-or-tap swapping,
cascading matches, two special pieces, ten levels across five hospital wards,
and local save. Everything in the game — art, mascot, wordmark, audio — is
generated from code in this repository; nothing is derived from another game.

## Running it

Install [Godot 4.3](https://godotengine.org/download) (standard build, no C#),
then either:

```sh
godot --path nurse-match            # run the game
godot --editor --path nurse-match   # open it in the editor
```

Or open the Godot project manager, **Import**, and pick `nurse-match/project.godot`.

The window opens at 540×960 with a 1080×1920 portrait viewport. On desktop the
mouse drives everything; touch works unchanged on a device because Godot
delivers touch as pointer input.

**Playing:** swipe a piece toward a neighbour, or tap one piece and then an
adjacent one. Matching three or more clears them; four in a row forges a *Code
Line* that clears a row or column; five forges a *Code Blue* that wipes every
piece of one supply when you swap it into place.

## Tests

The match-3 core has a headless suite — rules engine, level data, save
round-trip, board generation, plus a bot that plays forty real moves and checks
the board's invariants after each one:

```sh
godot --headless --path nurse-match res://tests/TestRunner.tscn
```

It exits non-zero on failure, so it can gate a build.

### Balance

Level targets are measured, not guessed. As tuned, a random-swap bot clears
level 1 about 94% of the time and level 10 about 25%, while the stronger bot
runs from 100% down to 66% — a curve that declines steadily and peaks on the
last level. `tools/BalanceSim.gd` plays every level
with two bots — one taking random legal swaps, one taking the swap that clears
most and chases the level's objective — and reports win rate, score, stars and
moves used:

```sh
godot --headless --path nurse-match res://tools/BalanceSim.tscn -- --runs=100
godot --headless --path nurse-match res://tools/BalanceSim.tscn -- --mode=probe --runs=60
```

`--mode=probe` answers the prior question: with no win condition, what score and
how many of each supply are actually reachable in N moves? Targets are then set
from those percentiles. Re-run it after touching `LevelLibrary` or the scoring
constants — it flags levels that clear themselves and levels that are walls.

Two caveats when reading the output. The strong bot only looks one move ahead,
so a thinking human beats it and real win rates run higher than SKILLED shows.

And the numbers are noisier than the sample size suggests: one level read 36%
then 57% across two identical 100-run passes. Board-generation luck dominates,
so the spread is far wider than sampling error would predict. Treat anything
under about fifteen points as noise — tune the shape of the curve, not the
last few points of any one level.

The board resolves instantly for these tools (`Board.animations_enabled = false`),
which is what makes thousands of moves take seconds. The rules are identical
either way; only the waiting disappears, and the test suite covers the animated
path.

To eyeball every screen without a device (needs a display, or `xvfb-run`):

```sh
xvfb-run -a godot --path nurse-match res://tools/CaptureScreens.tscn -- --shots=/tmp/shots
```

## Layout

```
nurse-match/
  scenes/            Main router, ui/ screens, components/ (board, piece, mascot)
  scripts/
    autoload/        Palette, SaveManager, AudioManager, LevelManager, GameStateManager
    board/           Board, Piece, PieceArt, PieceKind, MatchManager,
                     SpecialPieceManager, ScoreManager
    ui/              UIManager plus one script per screen, UIKit, widgets
    components/      NurseMascot, ScorePopup
  data/              LevelData resource + LevelLibrary (the 10 levels)
  assets/            fonts/ (Inter, JetBrains Mono) and empty drop-in folders for
                     final audio/ and characters/ art
  tests/             headless test suite
  tools/             screenshot capture utility
```

### How the pieces fit together

- **`Board`** owns layout, input and the swap → match → gravity → cascade loop.
  It holds no rules of its own.
- **`MatchManager`** is pure logic over a 2D array of type ids: what matches,
  whether a board is still playable, and what to swap next.
- **`SpecialPieceManager`** decides which special a run earns and which cells one
  clears. Adding a cross blast or area bomb means one enum value and one branch
  here — the board does not change.
- **`ScoreManager`** tracks score, moves and objective progress for one attempt
  and decides when the level is won or lost.
- **`GameStateManager`** holds the state enum; **`UIManager`** is the only place
  a state becomes a scene. Pause and result screens are overlays, so the board
  survives underneath.

### Replacing the placeholder art

- **Mascot:** drop `nurse_idle.png`, `nurse_happy.png`, `nurse_celebrate.png`,
  `nurse_encourage.png` or `nurse_sad.png` into `assets/characters/` and
  `NurseMascot` uses the image instead of drawing that mood.
- **Audio:** drop `button.ogg`, `match.ogg`, `special_activate.ogg` and friends
  (names come from `AudioManager.CUES`) into `assets/audio/`. Until then the
  manager synthesises short placeholder blips.
- **Pieces:** `PieceArt.draw_piece` is the single entry point; swap it for
  sprites without touching `Board` or `Piece`.

### Adding levels

Append one line to `LevelLibrary.build()`. The map, save system and HUD all read
from there. Then run the balance simulation and check the new level is neither
free nor a wall.

Stars measure efficiency, not score: one for clearing the level, two for
finishing with 20% of the moves unspent, three for 40%. Score cannot grade a run
here, because a level ends the instant its objective is met — every winning score
lands just past the target however well it was played.

## Not built yet

No advertisements, purchases, subscriptions, accounts or backend — the first job
is proving the gameplay is fun.
