// GAME RULES:
//  Players must be able to win every game
//  EVEN number of tiles for any given tile type (color, shape, etc.)
//  No more than three lines (two bends / corners) can connect two tiles

var grid = {
    height: 6,
    width: 6,
    cellSize: 80,
    lineWidth: 5,
    lineColor: 0x0000FF,
    occupied: null
};

var tileFilename = '/img/swirl_color.png';

var tileColours = [
    'blue',
    'purple',
    'green',
    'red',
    'orange',
    'teal',
    'pink',
    'yellow'
];

var gameOpts = {
    canvasWidth: ( grid.width + 2 ) * grid.cellSize,
    canvasHeight: 800,
    renderer: Phaser.AUTO,
    parent: ''
};

var game = new Phaser.Game(
    gameOpts.canvasWidth,
    gameOpts.canvasHeight,
    gameOpts.renderer,
    gameOpts.parent,
    {
        preload: preload,
        create: create
    }
);

game.lastTileSelected = null;
game.score = 0;
game.scoreText = null;
game.tilesLeft = grid.width * grid.height;
game.youWonText = null;
game.youLostText = null;

function preload(){
    // Load tile images
    tileColours.forEach( function( tile ){
        var filename = tileFilename.replace( /color/g, tile );
        game.load.image( tile, filename );
    });
}

function create(){
    createBackground();
    createGrid();
    createTiles();
    createUI();
}

function createBackground(){
    var bg = game.add.graphics( 0, 0 );
    bg.beginFill( 0xFF0000, 1 );
    bg.drawRect( 0, 0, gameOpts.canvasWidth, gameOpts.canvasHeight );
    bg.inputEnabled = true;
    bg.events.onInputDown.add( onClickedBackground, this );
}

function createGrid(){
    if( grid.width * grid.height % 2 != 0){
        throw new Error( 'Grid area must be an even number!');
    }
    grid.group = game.add.group();

    // Vertical Lines
    (function(){ // I miss lexical scoping
        for( var i = 0; i < grid.width + 3; i++ ){
            var line = game.add.graphics( i * grid.cellSize, 0 );
            line.lineStyle( grid.lineWidth, grid.lineColor, 1 );
            line.lineTo( 0, ( grid.height + 2 ) * grid.cellSize );
            grid.group.add( line );
        }
    })();

    // Horizontal Lines
    (function(){ // I REALLY miss lexical scoping
        for( var i = 0; i < grid.height + 3; i++ ){
            var line = game.add.graphics( 0, i * grid.cellSize );
            line.lineStyle( grid.lineWidth, grid.lineColor, 1 );
            line.lineTo( ( grid.width + 2 ) * grid.cellSize, 0 );
            grid.group.add( line );
        }
    })();

    // Create occupied array
    grid.occupied = [];
    (function(){
        for( var i = 0; i < grid.height + 2; i++ ){
            grid.occupied[ i ] = [];
        }
    })();

    // Populate occupied array
    (function(){
        for( var i = 1; i < grid.height + 1; i++ ){
            (function( i ){
                for( var j = 1; j < grid.width + 1; j++ ){
                    grid.occupied[ i ][ j ] = true;
                }
            })( i );
        }
    })();

    // Top
    (function(){
        for( var i = 0; i < grid.width + 2; i++ ){
            grid.occupied[ i ][ 0 ] = false;
        }
    })();

    // Bottom
    (function(){
        for( var i = 0; i < grid.width + 2; i++ ){
            grid.occupied[ i ][ grid.height + 1 ] = false;
        }
    })();

    // Left
    (function(){
        for( var i = 0; i < grid.height; i++ ){
            grid.occupied[ 0 ][ i ] = false;
        }
    })();

    // Right
    (function(){
        for( var i = 0; i < grid.height; i++ ){
            grid.occupied[ grid.width + 1 ][ i ] = false;
        }
    })();

}


function createTiles(){
    var tiles = [];

    // Create Tiles
    var halfNumTiles = grid.width * grid.height / 2;
    (function(){
        for( var i = 0; i < halfNumTiles; i++ ){
            var randomTile = randomInt( 0, tileColours.length - 1 );
            tiles.push( randomTile );
            tiles.push( randomTile );
        }
    })();

    tiles = shuffle( tiles );

    // Place Tiles
    (function(){
        for( var i = 0; i < tiles.length; i++ ){
            var tile = game.add.sprite( 0, 0, tileColours[ tiles[ i ] ] );
            tile.color = tileColours[ tiles[ i ] ];
            tile.gridX = i % grid.width + 1;
            tile.gridY = Math.floor( i / grid.width ) + 1;
            tile.x = tile.gridX * grid.cellSize;
            tile.y = tile.gridY * grid.cellSize;
            tile.inputEnabled = true;
            tile.events.onInputDown.add( onClickedTile, this );
        }
    })();
}

function createPathGroup( linePoints ){
    if( !linePoints || !linePoints.length || linePoints.length % 2 !== 0 ){
        throw new Error( 'linePoints must have an even length' );
    }

    var pathGroup = game.add.group();
    (function(){
        for( var i = 0; i < linePoints.length; i += 2 ){
            var startPoint = new Vec2( 0, 0 );
            startPoint.x = ( linePoints[ i ].x + 0.5 ) * grid.cellSize;
            startPoint.y = ( linePoints[ i ].y + 0.5 ) * grid.cellSize;
            var relativeEndPoint = new Vec2( 0, 0 );
            relativeEndPoint.x = ( linePoints[ i + 1 ].x - linePoints[ i ].x ) * grid.cellSize;
            relativeEndPoint.y = ( linePoints[ i + 1 ].y - linePoints[ i ].y ) * grid.cellSize;

            var path = game.add.graphics( startPoint.x, startPoint.y );
            path.lineStyle( 10, 0x00FF00, 0.9 );
            path.lineTo( relativeEndPoint.x, relativeEndPoint.y );
            pathGroup.add( path );
        }
    })();

    return pathGroup;
}

function deselectAllTiles(){
    game.world.callAll( 'deselect' );
    game.lastTileSelected = null;
}

function destroyTiles( tile1, tile2 ){
    deselectAllTiles();
    grid.occupied[ tile1.gridX ][ tile1.gridY ] = false;
    tile1.destroy();
    grid.occupied[ tile2.gridX ][ tile2.gridY ] = false;
    tile2.destroy();
}

function removeTiles( tile1, tile2 ){

    console.log( 'Removing Tiles' );

    var p1 = new Vec2( tile1.gridX, tile1.gridY );
    var p2 = new Vec2( tile2.gridX, tile2.gridY );

    // Check 1 line paths
    var linePoints = checkOneLinePath( p1, p2 );
    if( linePoints.length == 2 ){
        console.log( '1 Line Path!' );

        // Create visual path between tiles
        var pathGroup = createPathGroup( linePoints );

        // Destroy tiles immediately
        destroyTiles( tile1, tile2 );

        // Destroy visual path after timer ends
        game.time.events.add( 500, function(){
            pathGroup.destroy();
        }, this);

        return true;
    }

    // Check 2 line paths
    linePoints = checkTwoLinePath( p1, p2 );
    if( linePoints.length == 4 ){
        console.log( '2 Line Path!' );

        // Create visual path between tiles
        var pathGroup = createPathGroup( linePoints );

        // Destroy tiles immediately
        destroyTiles( tile1, tile2 );

        // Destroy visual path after timer ends
        game.time.events.add( 500, function(){
            pathGroup.destroy();
        }, this);

        return true;
    }

    // Check 3 line paths
    linePoints = checkThreeLinePath( p1, p2 );
    if( linePoints.length == 6 ){
        console.log( '3 Line Path!' );

        // Create visual path between tiles
        var pathGroup = createPathGroup( linePoints );

        // Destroy tiles immediately
        destroyTiles( tile1, tile2 );

        // Destroy visual path after timer ends
        game.time.events.add( 500, function(){
            pathGroup.destroy();
        }, this);

        return true;
        return true;
    }

    return false;
}

function checkOneLinePath( p1, p2 ){

    var linePoints = [];

    // Determine if the two points are on the same axis
    if( p1.y === p2.y ){
        // Loop through and check all of the grid cells from p1 to p2
        var delta = p2.x - p1.x;
        var increment = delta / Math.abs( delta ); // Either 1 or -1
        for( var i = 0; i !== delta ; i += increment ){
            if( p1.x + i + increment === p2.x ){
                linePoints.push( p1 );
                linePoints.push( p2 );
                break;
            }
            // This line is invalid if we've hit another occupied cell
            if( grid.occupied[ p1.x + i + increment ][ p1.y ] === true ){
                break;
            }
        }
    }
    else if( p1.x === p2.x ){
        // Loop through and check all of the grid cells from p1 to p2
        var delta = p2.y - p1.y;
        var increment = delta / Math.abs( delta ); // Either 1 or -1
        for( var i = 0; i !== delta ; i += increment ){
            if( p1.y + i + increment === p2.y ){
                linePoints.push( p1 );
                linePoints.push( p2 );
                break;
            }
            // This line is invalid if we've hit another occupied cell
            if( grid.occupied[ p1.x ][ p1.y + i + increment ] === true ){
                break;
            }
        }
    }
    return linePoints;
}

function checkTwoLinePath( p1, p2 ){
    var linePoints = [];
    var p3 = new Vec2( p1.x, p2.y );
    if( grid.occupied[ p3.x ][ p3.y ] === false ){
        linePoints = linePoints.concat( checkOneLinePath( p1, p3 ) );
        linePoints = linePoints.concat( checkOneLinePath( p3, p2 ) );
        if( linePoints.length == 4 ){
            return linePoints;
        }
    }

    linePoints = [];
    var p4 = new Vec2( p2.x, p1.y );
    if( grid.occupied[ p4.x ][ p4.y ] === false ){
        linePoints = linePoints.concat( checkOneLinePath( p1, p4 ) );
        linePoints = linePoints.concat( checkOneLinePath( p4, p2 ) );
    }

    return linePoints;
}

function checkThreeLinePath( p1, p2 ){
    var linePoints;
    var firstLineEndPoint;

    // From p1, move out...
    // Up
    for( firstLineEndPoint = new Vec2( p1.x, p1.y - 1 ); firstLineEndPoint.y >= 0; firstLineEndPoint.y-- ){
        linePoints = [];
        if( grid.occupied[ firstLineEndPoint.x ][ firstLineEndPoint.y ] === true ){
            break;
        }
        linePoints = linePoints.concat( checkOneLinePath( p1, firstLineEndPoint ) );
        if( linePoints.length == 2 ){
            linePoints = linePoints.concat( checkTwoLinePath( firstLineEndPoint, p2 ) );
            if( linePoints.length == 6 ){
                return linePoints;
            }
        }
    }
    console.log( '3 line solution not found by going up from p1' );

    // Down
    for( firstLineEndPoint = new Vec2( p1.x, p1.y + 1 ); firstLineEndPoint.y <= grid.width + 2; firstLineEndPoint.y++ ){
        linePoints = [];
        if( grid.occupied[ firstLineEndPoint.x ][ firstLineEndPoint.y ] === true ){
            break;
        }
        linePoints = linePoints.concat( checkOneLinePath( p1, firstLineEndPoint ) );
        if( linePoints.length == 2 ){
            linePoints = linePoints.concat( checkTwoLinePath( firstLineEndPoint, p2 ) );
            if( linePoints.length == 6 ){
                return linePoints;
            }
        }
    }
    console.log( '3 line solution not found by going down from p1' );


    // Left
    for( firstLineEndPoint = new Vec2( p1.x - 1 , p1.y ); firstLineEndPoint.x >= 0; firstLineEndPoint.x-- ){
        linePoints = [];
        if( grid.occupied[ firstLineEndPoint.x ][ firstLineEndPoint.y ] === true ){
            break;
        }
        linePoints = linePoints.concat( checkOneLinePath( p1, firstLineEndPoint ) );
        if( linePoints.length == 2 ){
            linePoints = linePoints.concat( checkTwoLinePath( firstLineEndPoint, p2 ) );
            if( linePoints.length == 6 ){
                return linePoints;
            }
        }
    }
    console.log( '3 line solution not found by going left from p1' );

    // Right
    for( firstLineEndPoint = new Vec2( p1.x + 1 , p1.y ); firstLineEndPoint.x < grid.width + 2; firstLineEndPoint.x++ ){
        linePoints = [];
        if( grid.occupied[ firstLineEndPoint.x ][ firstLineEndPoint.y ] === true ){
            break;
        }
        linePoints = linePoints.concat( checkOneLinePath( p1, firstLineEndPoint ) );
        if( linePoints.length == 2 ){
            linePoints = linePoints.concat( checkTwoLinePath( firstLineEndPoint, p2 ) );
            if( linePoints.length == 6 ){
                return linePoints;
            }
        }
    }
    console.log( '3 line solution not found by going right from p1' );


    return linePoints;
}

function createUI(){
    var scoreTextStyle = {
            font: '50px Arial',
            fill: '#D',
            align: 'center'
    };
    game.scoreText = game.add.text( game.world.centerX, ( grid.height + 2 ) * grid.cellSize, 'Score: 0', scoreTextStyle );
    game.scoreText.anchor.set( 0.5, 0 );
}

function wonGame(){
    var youWonTextStyle = {
            font: '50px Arial',
            fill: '#D',
            align: 'center'
    };
    game.youWonText = game.add.text(
        ( ( grid.width + 2 ) / 2 ) * grid.cellSize,
        ( ( grid.height + 2 ) / 2 ) * grid.cellSize,
        'You Won!',
        youWonTextStyle
    );
    game.youWonText.anchor.set( 0.5, 0.5 );
}

function lostGame(){

}
