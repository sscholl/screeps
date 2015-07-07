// ########### GENERAL SECTION #########################################

Creep.prototype.runUpgrader = function() {
    if(this.energy <= 0) {
        var energyContainer = this.room.defaultSpawn;
        //var energyContainer = this.pos.findClosestEnergyContainer();
    	if (energyContainer && energyContainer.energy >= 150) {
           this.movePredefined(energyContainer.pos, {ignoreCreeps: false});
    	   energyContainer.transferEnergy(this);
        } else {
            this.memory.phase = 'search';
            this.memory.role = 'collector';
        }
    } else {
	    this.movePredefined(this.room.controller.pos);
	    this.upgradeController(this.room.controller);
    }
}