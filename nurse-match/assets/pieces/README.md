Optional home for final piece sprites.

The six supplies are currently drawn by `PieceArt.draw_piece`, which is the only
place `Board` and `Piece` touch the artwork — swap that one function for texture
draws and nothing else changes.
