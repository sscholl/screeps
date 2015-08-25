// ########### GENERAL SECTION #########################################

Creep.prototype.runUpgrader = function() {
    if (!this.memory.phase || this.memory.phase === PHASE_SEARCH) {
        this.fillOnStorage();
    }
    if (this.memory.phase === PHASE_TASK) {
        if (this.carry.energy > this.carryCapacity / 2) {
            this.movePredefined(this.room.controller.pos);
        } else {
            this.fillOnStorage();
        }
        this.upgradeController(this.room.controller);
    }
}

Creep.prototype.fillOnStorage = function() {
    var storage = this.room.controllerStorage;
    if (storage) {
        this.movePredefined(storage.pos);
        restult = storage.transferEnergy(this);
    } else {
        this.logError("no controller storage available");
    }
}