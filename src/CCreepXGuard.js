// ########### GENERAL SECTION #########################################

Creep.prototype.runGuard = function() {

        
    if(this.memory.body == 'ranger') {
    	if (this.room.creepsHealer.length >= 2 && this.room.creepsRanger.length >= 2) {
	    	var target = this.pos.findClosest(this.room.getHostileCreeps());
	    	//target = target[0];
	    	if (!target && this.room.getHostileCreeps().length ) {
    			var creeps = this.room.find(FIND_HOSTILE_CREEPS);
    			if (creeps[0]) {
    				console.log("found an invalid target" + JSON.stringify(creeps));
    				target = creeps[0];
    			}
    		}
	    	if(target) {
	    		//console.log(target.owner.username != 'Source Keeper');
	    		if (!this.pos.inRangeTo(target, 3))
	    			this.movePredefined(target);
	    		if (this.pos.inRangeTo(target, 2) || this.hits < this.hitsMax * 0.3)
	    			this.movePredefined(this.room.defaultSpawn);
	    		this.rangedAttack(target);
	    		this.memory.currentTargetId = target.id;
	    	} else {
				if (this.room.name == 'W12S3' && Game.rooms.W12S2.creepsRanger.length <= 4) {
					this.movePredefined(Game.flags.W12S2.pos);
					return;
				}
	    		if (Number.isInteger(this.memory.hostileSpawnNr)) {
	    			var selectedSpawn = this.room.hostileSpawns[this.memory.hostileSpawnNr];
    				var collectionPoint = Game.flags[this.room.name + "Source" + this.memory.hostileSpawnNr];
    				if (collectionPoint && collectionPoint.pos) {
    					this.movePredefined(collectionPoint.pos, {}, true);
    				} else {
    					this.logError(this.room.name + "Source" + this.memory.hostileSpawnNr + " not found");
    				}
    			} else {
		    		var spawns = this.room.find(FIND_HOSTILE_STRUCTURES);
		    		var selectedSpawn = false;
		    		var selectedSpawnTicks = 99999;
		    		for (spawnNr in spawns) {
		    			var spawn = spawns[spawnNr];
		    			if (spawn.ticksToSpawn < 30 && spawn.ticksToSpawn < selectedSpawnTicks) {
		    				selectedSpawn = spawn;
		    				selectedSpawnTicks = spawn.ticksToSpawn;
		    			}
		    		}
		    		if (selectedSpawn) {
		    			if (!this.pos.inRangeTo(selectedSpawn, 6))
		    				this.moveTo(selectedSpawn);

	    			} else {
	    				var collectionPoint = Game.flags[this.room.name];
	    				if (collectionPoint) {
	    					this.movePredefined(collectionPoint.pos, {}, true);
	    				}
	    			}
	            }

	            // delete a custom structure
	            //var stuff = this.room.lookAt(0,0);
	            //var target = stuff[0];
	              //console.log(JSON.stringify(stuff));
	    		//this.rangedAttack(target.structure);

	    		delete this.memory.currentTargetId;
	    	}
    	} else {
	        var collectionPoint = Game.flags[this.room.name];
			if (collectionPoint) {
				this.movePredefined(collectionPoint.pos, {}, true);
			}
        }
    }
}