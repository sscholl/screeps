let Profiler = require('Profiler');
let Logger = require('Logger');

// ######## RoomPosition ##############################################
RoomPosition.prototype.getRoom = function() {
    return Game.rooms[this.roomName];
}

RoomPosition.prototype.getSpotsCnt = function() {
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

var methods = ['getSpotsCnt', 'getInRangePositions'];
for (var i in methods) {
    Profiler._.wrap('RoomPosition', RoomPosition, methods[i]);
    Logger._.wrap('RoomPosition', RoomPosition, methods[i]);
}
