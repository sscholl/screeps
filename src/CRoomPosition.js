#include "CRoomPosition_Find.js"

RoomPosition.prototype.getRoom = function() {
    return Game.rooms[this.roomName];
}

// ######## RoomPosition ##############################################
RoomPosition.prototype.getSpotsCnt = function() {
    TIMER_BEGIN_(TIMER_MODULE_ROOM, 'getSpotsCnt', 'of room ' + this.getRoom().name)
    var cnt = 0;
    var positions = this.getRoom().lookForAtArea('terrain', this.y - 1, this.x - 1, this.y + 1, this.x + 1);

    for (var y in positions) {
        for (var x in positions[y]) {
            var isFree = true;
            for (var i in positions[y][x])
                if (positions[y][x][i] === 'wall') isFree = false;
            if (isFree) ++ cnt;
        }
    }
    TIMER_BEGIN_(TIMER_MODULE_ROOM, 'getSpotsCnt', cnt)
    return cnt;
};

RoomPosition.prototype.getInRangePositions = function(distance) {
    var poss = new Array(9);
    var i = 0;
    for (var y = this.y - distance; y < this.y + distance; ++ y) {
        for (var x = this.x - distance; x < this.x + distance; ++ x) {
            poss[i ++] = new RoomPosition(x,y,this.roomName);
        }
    }
    return poss;
}