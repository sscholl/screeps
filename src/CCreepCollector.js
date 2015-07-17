// ########### GENERAL SECTION #########################################

Creep.prototype.runCollector = function() {
    // is full
    if(this.energy >= this.energyCapacity * 0.8) {
        this.memory.role = 'harvester';
        this.memory.phase = PHASE_DELIVER;
        return;
    // searches dropped energy
    } else {
        var target = null;
        if (this.memory.currentTargetId) {
            target = Game.getObjectById(this.memory.currentTargetId);
            if (target && target.constructor != Energy) target = null;
        } 
        if (!target) {
            var i = Math.floor(Math.random() * this.room.energy.length);
            target = this.room.energy[i];
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