// ########### GENERAL SECTION #########################################

Creep.prototype.runUpgrader = function() {
    if (!this.memory.phase || this.memory.phase === PHASE_SEARCH) {
        this.fillOnStructure(this.room.controllerStorage);
    }
    if (this.memory.phase === PHASE_TASK) {
        if (this.carry.energy > 20) {
            this.movePredefined(this.room.controller.pos);
        } else {
            this.fillOnStructure(this.room.controllerStorage);
        }
        this.upgradeController(this.room.controller);
    }
}