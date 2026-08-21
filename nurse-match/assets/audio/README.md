Drop final sound effects here as `<event>.ogg` or `<event>.wav`.

Event names come from `AudioManager.CUES`: `button`, `select`, `swap`,
`invalid`, `match`, `special_create`, `special_activate`, `cascade`,
`level_complete`, `game_over`.

Until a file exists for an event, `AudioManager` synthesises a short placeholder
blip for it. No code changes are needed to switch over.
