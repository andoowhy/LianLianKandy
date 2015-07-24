// get a random integer between min and max, inclusive
function randomInt( min, max )
{
    return Math.floor( Math.random() * ( max + 1 - min ) ) + min;
}

// Fisher-Yates shuffle an array
function shuffle( array ){
    var index = array.length;
    var temp;
    var randomIndex;
    while (0 !== index) {

        // Pick a remaining element...
        randomIndex = Math.floor( Math.random() * index );
        index--;

        // And swap it with the current element.
        temp = array[index];
        array[ index] = array[randomIndex];
        array[ randomIndex] = temp;
    }
    return array;
}