//DEBUG

var _ = require('lodash');


JSON.stringify(Memory);



console.log(this.sources.length + " sources found");
        for (var creepId in this.creeps) {
            var creep = this.creeps[creepId];
            if (creep.role == "harvester" || creep.role == "harvester" || creep.role == "harvester")
                this.creepsWorker.push(creep);
            for (var bodyPartId in creep.body) {
                var bodyPart = creep.body[bodyPartId];
                //console.log(bodyPart.type);
            }
        }
        
        

Game.spawns.Spawn1.createCreep( [WORK, CARRY, MOVE], 'Worker1' );
Game.spawns.Spawn1.createCreep( [WORK, CARRY, MOVE], 'Worker2' );
Game.spawns.Spawn1.createCreep( [WORK, WORK, WORK, CARRY, MOVE], 'Builder1' );
Game.spawns.Spawn1.createCreep( [TOUGH, ATTACK, MOVE, MOVE], 'Guard1' );

Game.creeps.Worker1.role = 'harvester';
Game.creeps.Worker2.role = 'harvester';
Game.creeps.Builder1.role = 'builder';
Game.creeps.Guard1.memory.role = 'guard';




//harvester

    	   
    	    /*if (false && creep.memory.harvestUpgrader == true) {
    	        var avoidPos = [Game.flags.Flag10, Game.flags.Flag11, Game.flags.Flag12, Game.flags.Flag13, Game.flags.Flag14, Game.flags.Flag15]
        		creep.moveTo(creep.room.controller, {ignoreCreeps: false, avoid: avoidPos});
    		    creep.upgradeController(creep.room.controller);
    		    return;
    	    }*/

  
    	    var ext = creep.pos.findClosestEmptyExtension()
    	    var construction = creep.pos.findClosest(FIND_CONSTRUCTION_SITES)
    	    if (ext != null) {
    	        creep.moveTo(ext);
    		    creep.transferEnergy(ext)
    	    } else if (construction != null && Game.spawns.Spawn1.energy >= 300) {
    	        creep.moveTo(construction);
    		    creep.build(construction)
    	    } else {