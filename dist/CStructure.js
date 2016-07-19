"use strict";

module.exports = function () {
}

Structure.prototype.isFull = function() {
    if (this.store) return this.store.energy >= this.storeCapacity;
    else            return this.energy >= this.energyCapacity;
};

Structure.prototype.isEmpty = function() {
    if (this.store) return this.store.energy <= 0;
    else            return this.energy <= 0;
};

Structure.prototype.getEnergyPercentage = function(name) {
    if (this.store) return this.store.energy / this.storeCapacity;
    else            return this.energy / this.energyCapacity;
};

Structure.prototype.needsRepair = function(max = false) {
    if ( this.structureType === STRUCTURE_WALL || this.structureType === STRUCTURE_RAMPART ) {
        let v = max ? 400000 : 200000;
        return this.hits < v;
    }
    return this.hits < this.hitsMax * ( max ? 1 : 0.95);
};
