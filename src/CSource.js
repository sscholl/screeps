// ########### GENERAL SECTION #########################################

Source.prototype.memory = undefined;

Source.prototype.setMemory = function() {
	this.memory = this.room.memory.sources[this.id];
}

Source.prototype.initSpots = function() {
    TIMER_BEGIN_(TIMER_MODULE_ROOM, 'initSpots', 'of room ' + this.room.name)
	this.memory.spots = [];

	//if is source save for harvest
    var targetsStructures = this.pos.findEnemyStructuresInAttackRange();

    this.memory.hasHostileSpawn = targetsStructures.length > 0;

    // seach all available spots of the source
    	//var positions = this.room.lookForAtArea('terrain', this.pos.y - 1, this.pos.x - 1, this.pos.y + 1, this.pos.x + 1);

    // add this spots to this.spots
    for (var y = this.pos.y - 1; this.pos.y + 1 >= y; ++ y) {
        for (var x = this.pos.x - 1; this.pos.x + 1 >= x; ++ x) {
            var pos = this.room.lookAt(x, y); // @todo this operation consumes approx. 1.3 cpu
            var isFree = true;

            // if any of the terrain fields are a wall, the spot is not a real spot
            for (var nr in pos) 
                if (pos[nr].type == 'terrain' && pos[nr].terrain == 'wall') 
                    isFree = false;

            if (isFree) {
                ++ this.room.memory.sourceSpotCount;

                this.memory.spots.push(
                    {sourceId: this.id, x:x, y:y}
                );
            }
        }
    }
    TIMER_END(TIMER_MODULE_ROOM, 'initSpots')
}

// ########### OTHER SECTION ############################################
Source.prototype.logDetail = function(message) {
    logDetail("[SOURCE] " + message);
}