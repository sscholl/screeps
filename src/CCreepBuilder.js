// ########### GENERAL SECTION #########################################

Creep.prototype.runBuilder = function() {
    if(this.energy == 0) {
        if(this.room.defaultSpawn.energy >= 150) {
            this.movePredefined(this.room.defaultSpawn.pos, {ignoreCreeps: true});
            this.room.defaultSpawn.transferEnergy(this);
        } else {
            this.memory.phase = PHASE_SEARCH;
            this.moveAround();
        }
    } else {
    	var target = this.pos.findClosest(FIND_CONSTRUCTION_SITES);
        if (target) {
    		this.movePredefined(target.pos);
    		var result = this.build(target);
            if (result == ERR_RCL_NOT_ENOUGH) this.memory.role = "upgrader";
    		else if (result != OK && result != ERR_NOT_IN_RANGE) {
                this.movePredefined(this.room.defaultSpawn.pos);
                if (result != ERR_INVALID_TARGET) this.logError(this.name + " can't build " + result);
            }
        } else {
            this.memory.role = "repairer";
            this.memory.phase = "repair";
        }
    }
}