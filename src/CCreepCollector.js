// ########### GENERAL SECTION #########################################

Creep.prototype.runCollector = function() {
    // is full
    if(this.energy == this.energyCapacity) {
        this.memory.role = 'harvester';
        this.memory.phase = PHASE_DELIVER;
        return;
    // searches dropped energy
    } else {
    	var target = null;
        if (this.memory.currentTargetId) {
            target = Game.getObjectById(this.memory.currentTargetId);
            if (target && target.constructor != Source) target = null;
        } 
        if (!target) {
            target = this.pos.findClosest(this.room.energy);
            if (target) this.memory.currentTargetId = target.id;
        }
        
    	if (target) {
    			this.movePredefined(target.pos);
    			this.pickup(target);
		} else {
            this.memory.phase = PHASE_SEARCH;
            this.moveAround();
		}
	}
}