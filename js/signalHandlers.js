function onClickedBackground(){
    console.log( 'Clicked BG' );
    deselectAllTiles();
}

function onClickedTile( tile ) {
    if( game.lastTileSelected ) {

        // Check if the player clicks on the same tile ( more than ) twice
        if( game.lastTileSelected === tile ){
            return;
        }

        // Try to remove the two tiles if they're the same colour
        if( game.lastTileSelected.color === tile.color ) {
            if ( removeTiles( game.lastTileSelected, tile ) ){
                game.score += 100;
                game.scoreText.text = 'Score: ' + game.score;

                game.tilesLeft -= 2;
                if( game.tilesLeft <= 0 ){
                    wonGame();
                }

                return;
            }
        }

        game.world.callAll( 'deselect' );
    }
    game.lastTileSelected = tile;

    // Draw square around tile
    var rect = game.add.graphics( 0, 0 );
    rect.lineStyle( 3, 0xFFFFFF, 1) ;
    rect.drawRect( 0, 0, grid.cellSize, grid.cellSize );

    // Attach it as a child object
    tile.addChild( rect );

    // Attach helper function to tile to remove selection rectangle
    tile.deselect = function () {
        tile.removeChildren();
    }
}
