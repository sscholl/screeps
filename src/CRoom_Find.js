"use strict";

Room.prototype.findDroppedEnergy = function() {
    return this.find(FIND_DROPPED_ENERGY,
        { filter: function (energy) { return energy.energy >= 20; } }
    );
};
