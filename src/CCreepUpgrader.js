// ########### GENERAL SECTION #########################################

Creep.prototype.runDefaultUpgrader = function() {
    if(this.energy <= 0) {
        var energyContainer = this.room.defaultSpawn;
        //var energyContainer = this.pos.findClosestEnergyContainer();
        if (energyContainer && energyContainer.energy >= 150) {
           this.movePredefined(energyContainer.pos);
           energyContainer.transferEnergy(this);
        } else {
            this.memory.phase = PHASE_SEARCH;
        }
    } else {
        this.movePredefined(this.room.controller.pos);
        this.upgradeController(this.room.controller);
    }
}