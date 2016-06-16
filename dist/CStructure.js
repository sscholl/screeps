"use strict";

Structure.prototype.isFull = function () {
    return this.energy >= this.energyCapacity;
};

Structure.prototype.isEmpty = function () {
    return this.energy <= 0;
};

Structure.prototype.needsRepair = function (name) {
    return this.hits < this.hitsMax * 0.98;
};
