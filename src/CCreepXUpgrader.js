// ########### GENERAL SECTION #########################################

Creep.prototype.runUpgrader = function() {
    if (this.memory.phase == PHASE_SEARCH) {
        delete this.memory.harvesterSourceId;
        LOG_DETAIL_THIS("upgrader has no idea what to do")
        this.moveAround();
    }
    if (this.memory.phase == PHASE_UPGRADE) {
        if (this.energy > this.energyCapacity / 2) {
            this.movePredefined(this.room.controller.pos);
        } else {
            var link = this.room.controllerLink;
            if (link) {
                this.movePredefined(link.pos);
                restult = link.transferEnergy(this);
            } else {
                this.logError("no controllerLink available");
            }
        }
        this.upgradeController(this.room.controller);
    }
}