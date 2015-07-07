Room.prototype.findDroppedEnergy = function() {
    return this.find(FIND_DROPPED_ENERGY, 
        { filter:
            function (energy) {
                return energy.energy >= 50;
            }
        }
    );
}

Room.prototype.findSearchingDefaultWorker = function() {
    return this.find(FIND_MY_CREEPS, { filter:
        function (creep) {
            return creep.memory.body == BODY_DEFAULT && creep.memory.phase == PHASE_SEARCH 
        }
    });
}