// ########### GENERAL SECTION #########################################

Creep.prototype.runCollector = function() {
    // is full
    if(this.energy == this.energyCapacity) {
        var ext = this.pos.findClosestEmptyExtension();
        if (
            ext != null 
            && this.room.defaultSpawn.energy == this.room.defaultSpawn.energyCapacity
        ) {
            this.movePredefined(ext.pos);
            this.transferEnergy(ext)
        } else {
            this.movePredefined(this.room.defaultSpawn.pos);
            this.transferEnergy(this.room.defaultSpawn);
        }
    // searches dropped energy
    } else {
    	var target = this.pos.findClosest(FIND_DROPPED_ENERGY);
    	if (target ) {
    			this.movePredefined(target.pos);
    			this.pickup(target);
		} else {
            this.memory.phase = 'search';
            this.moveAround();
		}
	}
}