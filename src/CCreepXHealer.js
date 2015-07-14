// ########### GENERAL SECTION #########################################

Creep.prototype.runHealer = function() {
    var damagedCreep = this.pos.findClosest(FIND_MY_CREEPS, {
        filter: function(object) {
            return object !== this && object.hits < object.hitsMax;
        }
    });
    if (this.hits < this.hitsMax - 50 /* no more heal */) {
    	this.movePredefined(this.room.defaultSpawn);
    	this.heal(damagedCreep);
        this.rangedHeal(damagedCreep);
    	return;
    }
    
    if(damagedCreep) {
        var hisTarget = Game.getObjectById(damagedCreep.memory.currentTargetId);
        if (hisTarget && this.pos.inRangeTo(hisTarget, 3))
            this.movePredefined(this.room.defaultSpawn);
        else
            if (!this.pos.inRangeTo(damagedCreep, 1))
                this.movePredefined(damagedCreep);
        this.rangedHeal(damagedCreep);
    	this.heal(damagedCreep);
    	return;
    }
    if (this.room.name == 'W12S3' && Game.rooms.W12S2.creepsHealer.length < 2) {
        this.movePredefined(Game.flags.W12S2.pos);
        return;
    }
    
    var guard = this.pos.findClosest(FIND_MY_CREEPS, {
        filter: function(creep) {
	        return creep.memory.role === 'guard';
        }
    });
    if (guard) {
        if (!this.pos.inRangeTo(guard, 1))
    	   this.movePredefined(guard);
    } else {
        var collectionPoint = Game.flags[this.room.name];
        if (collectionPoint) {
          this.movePredefined(collectionPoint.pos, {}, true);
        } else {
        	this.movePredefined(this.room.defaultSpawn);
        }
    }
}