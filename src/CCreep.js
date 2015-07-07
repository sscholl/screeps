// include all creep files
#include "CCreepBodyDefault.js"
#include "CCreepBuilder.js"
#include "CCreepCollector.js"
#include "CCreepHarvester.js"
#include "CCreepPionier.js"
#include "CCreepRepairer.js"
#include "CCreepUpgrader.js"

#include "CCreepXWorker.js"
#include "CCreepXUpgrader.js"

#include "CCreepXGuard.js"
#include "CCreepXHealer.js"

// ########### GENERAL SECTION #########################################

Creep.prototype.run = function() {
    var body = this.memory.body;
    var role = this.memory.role;
    if (role == 'harvester')        this.runDefaultHarvester();
    else if (role == 'builder')     this.runBuilder();
    else if (role == 'collector')   this.runCollector();
    else if (role == 'pionier')     this.runPionier();
    else if (role == 'repairer')    this.runRepairer();
    else if (role == 'upgrader')    this.runDefaultUpgrader();

    else if (body == BODY_HARVESTER) this.runHarvester();
    else if (body == BODY_UPGRADER)  this.runUpgrader();
    
    else if (body == BODY_HEALER)   this.runHealer();

    else if (role == 'guard')       this.runGuard();
    else this.logError("has no role");
}

// ########### MOVE SECTION ###########################################

Creep.prototype.movePredefined = function(targetPos, opts, onPos) {

    var recalculateMove = false;
    var move = this.memory._move;
    if ( 
        // predefined move is available
        move && Number.isInteger(move.step)
        // do not go the last move
        && (!onPos && (move.step + 1) < (move.path.length - 1))
        // is already on position
        && move.dest.x == targetPos.x 
        && move.dest.y == targetPos.y
        // the predefined move is invalid
        && move.path[move.step].x == this.pos.x 
        && move.path[move.step].y == this.pos.y
    ) {
        //this.logCompact("next:" + (move.step + 1) + " last: "+ (move.path.length - 1));
        if (this.move(move.path[move.step + 1].direction) == OK) {
            ++ move.step;
        }
        //this.logCompact("use a predefined path - " + this.pos + "->" + targetPos); 
    } else {
        // do not go the last move if onPos is not set
        if (!onPos && this.pos.inRangeTo(targetPos, 1)) {
            return;
        }
        var result = this.moveTo(targetPos, opts); 
        if (result == OK) {
            this.memory._move.step = 0
        }
    }
    
}

Creep.prototype.moveAround = function() {
    this.move(Game.time % 8 + 1);
} 

Creep.prototype.moveRandom = function() {
    this.move(Math.floor(Math.random() * 8) % 8 + 1);
} 

// ########### OTHER SECTION ###########################################

Creep.prototype.logDetail = function(message) {
    console.log('[' + this.name + "] in room " + this.room.name + " "+ message);
}
Creep.prototype.logError = function(message) {
    console.log('!!!ERROR!!! [' + this.name + "] in room " + this.room.name + " "+ message);
} 