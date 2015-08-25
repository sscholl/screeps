// ########### GENERAL SECTION #########################################

Creep.prototype.runRepairer = function() {
    this.logError("WHY I AM A REPAIRER???");
            this.moveAround();
    this.memory.phase = PHASE_SEARCH;
    return;
    if(this.carry.energy == 0) {
        this.movePredefined(this.room.defaultSpawn);
        if (this.room.defaultSpawn.energy >= 50) this.room.defaultSpawn.transferEnergy(this);
        else {
            this.memory.phase = PHASE_SEARCH;
            this.moveAround();
        }
    } else {
        var structure = null;
        if (this.memory.currentTargetId) {
            structure = Game.getObjectById(this.memory.currentTargetId);
            if (!(structure instanceof Structure) || structure.hits >= structure.hitsMax) {
                structure = null;
                delete this.memory.currentTargetId;
            }
        } 
        if (!(structure instanceof Structure)) {
            structure = this.pos.findClosest(FIND_MY_STRUCTURES, {filter: 
                function(object) {
                    return object.structureType == STRUCTURE_RAMPART && object.hits < 1000;
                }
            });
            if (!(structure instanceof Structure)) {
                var structure = this.pos.findClosest(FIND_MY_STRUCTURES, {filter: 
                    function(object) {
                        return object.structureType == STRUCTURE_RAMPART && object.hits < 10000;
                    }
                });
            }
            if (!(structure instanceof Structure)) {
                var structure = this.pos.findClosest(FIND_MY_STRUCTURES, {filter: 
                    function(object) {
                        return object.structureType == STRUCTURE_RAMPART && object.hits < 25000;
                    }
                });
            }
            if (!(structure instanceof Structure)) {
                var structure = this.pos.findClosest(FIND_MY_STRUCTURES, {filter: 
                    function(object) {
                        return object.structureType == STRUCTURE_RAMPART && object.hits < 100000;
                    }
                });
            }
            if (!(structure instanceof Structure)) {
                var structure = this.pos.findClosest(FIND_STRUCTURES, {filter: 
                    function(object) {
                        return (object.structureType == STRUCTURE_ROAD  && object.hits < object.hitsMax * 0.98)
                    }
                });
            }
            if (!(structure instanceof Structure)) {
                var structure = this.pos.findClosest(FIND_MY_STRUCTURES, {filter: 
                    function(object) {
                        return object.structureType == STRUCTURE_RAMPART && object.hits < 250000;
                    }
                });
            }
            if (!(structure instanceof Structure)) {
                var structure = this.pos.findClosest(FIND_MY_STRUCTURES, {filter: 
                    function(object) {
                        return object.structureType == STRUCTURE_RAMPART && object.hits < 1000000;
                    }
                });
                this.memory.phase = PHASE_SEARCH;
            }
            if (!(structure instanceof Structure)) {
                var structure = this.pos.findClosest(FIND_MY_STRUCTURES, {filter: 
                    function(object) {
                        return object.structureType == STRUCTURE_RAMPART && object.hits < 10000000;
                    }
                });
            }
            if (!(structure instanceof Structure)) {
                var structure = this.pos.findClosest(FIND_MY_STRUCTURES, {filter: 
                    function(object) {
                        return object.structureType == STRUCTURE_RAMPART && object.hits < object.hitsMax * 0.98;
                    }
                });
            }
        }
        if (structure != null) {
            this.memory.currentTargetId = structure.id;
            this.movePredefined(structure.pos);
            var result = this.repair(structure);
            if (result != OK && result != ERR_NOT_IN_RANGE) console.log(this.name + " can't repair " + result);
        } else {
            this.memory.phase = PHASE_SEARCH;
            this.moveAround();
        }
    }
}