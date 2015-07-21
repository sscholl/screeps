#include "CRoomPosition_Find.js"

RoomPosition.prototype.getRoom = function() {
    return Game.rooms[this.roomName];
}

// ######## RoomPosition ##############################################
RoomPosition.prototype.getSpotsCnt = function() {
    // seach all available spots of the source
    //var positions = this.room.lookForAtArea('terrain', this.pos.y - 1, this.pos.x - 1, this.pos.y + 1, this.pos.x + 1);

    var cnt = 0;

    // add this spots to this.spots
    for (var y = this.y - 1; this.y + 1 >= y; ++ y) {
        for (var x = this.x - 1; this.x + 1 >= x; ++ x) {
            if (x === this.x && y === this.y) continue;
            var pos = this.getRoom().lookAt(x, y); // @todo this operation consumes approx. 1.3 cpu
            var isFree = true;

            // if any of the terrain fields are a wall, the spot is not a real spot
            for (var i in pos) {
                if (
                    (pos[i].type === 'terrain' 
                        && pos[i].terrain !== 'plain'
                        && pos[i].terrain !== 'swamp'
                    ) || (pos[i].type === 'structure'
                        && pos[i].structure
                        && pos[i].structure.structureType !== 'road'
                        && pos[i].structure.structureType !== 'rampart'
                    )
                ) {
                    isFree = false;
                }
            }
            if (isFree) ++ cnt;
        }
    }
    return cnt;
};