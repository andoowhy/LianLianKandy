function Vec2( x, y ){
    x && typeof x === 'number' && isFinite( x ) ? this.x = x : this.x = 0;
    y && typeof y === 'number' && isFinite( y ) ? this.y = y : this.y = 0;
}

Vec2.prototype.equalTo = function( other ){
    return this.x === other.x && this.y === other.y;
};