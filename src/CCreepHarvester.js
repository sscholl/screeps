// ########### GENERAL SECTION #########################################

Creep.prototype.runDefaultHarvester = function() {
    var empty   = this.energy <= 0;
    var full    = this.energy >= this.energyCapacity;
    var phase   = this.memory.phase;

    if      (phase == PHASE_SEARCH && empty)    this.memory.phase = PHASE_SEARCH;
    else if (phase == PHASE_SEARCH && !empty)   this.memory.phase = PHASE_DELIVER;
    else if (phase == PHASE_HARVEST && !full)   this.memory.phase = PHASE_HARVEST;
    else if (phase == PHASE_HARVEST && full)    this.memory.phase = PHASE_DELIVER;
    else if (phase == PHASE_DELIVER && !empty)  this.memory.phase = PHASE_DELIVER;
    else if (phase == PHASE_DELIVER && empty)   this.memory.phase = PHASE_SEARCH;
    else {
        this.memory.phase = PHASE_SEARCH;
    }
    
	if (this.memory.phase == PHASE_SEARCH) {
        delete this.memory.harvesterSourceId;
        this.moveAround();
    }
    if (this.memory.phase == PHASE_HARVEST) {
		var source = this.room.sources[this.memory.harvesterSourceId];
		if ( source != null ) {
            //this.say(this.memory.harvesterSourceId);
            this.movePredefined(source.pos);
            this.harvest(source);
		} else {
            this.memory.phase = PHASE_SEARCH;
		}
    } else if (this.memory.phase == PHASE_DELIVER) {
        var ext = this.pos.findClosestEmptyExtension();
        if (ext != null) {
            this.movePredefined(ext.pos);
            this.transferEnergy(ext)
        } else {
            if (this.room.defaultSpawn.energy < this.room.defaultSpawn.energyCapacity) {
                this.movePredefined(this.room.defaultSpawn.pos);
                this.transferEnergy(this.room.defaultSpawn);
            } else {
                this.memory.phase = PHASE_SEARCH;
            }
        }
	}
}