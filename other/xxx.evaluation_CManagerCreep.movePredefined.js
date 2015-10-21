========================
THE EVALUATION RESUTLS:


cpuCreepMoveTo {
    time    :   475.70,
    uses    :   3120
}
cpuCreepMovePredefined {
    time    :   791.03,
    uses    :   3158
}
========================

var VERBOSE = false;

Creep.prototype.movePredefined = function(targetPos, opts, onPos) {

    if (Game.time % 100 < 50) {
        var startCpu = Game.getUsedCpu();

        if (!this.pos.inRangeTo(targetPos, 1) || onPos) {
            if (!opts) opts = {};
            opts.reusePath = 200;
            this.moveTo(targetPos, opts); 
        }

        var endCpu = Game.getUsedCpu();
        Memory.cpuCreepMoveTo.time += endCpu - startCpu;
        Memory.cpuCreepMoveTo.uses ++;
    } else {
        var startCpu = Game.getUsedCpu();
        //--- actual code ---
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
        //--- actual code end ---

        var endCpu = Game.getUsedCpu();
        Memory.cpuCreepMovePredefined.time += endCpu - startCpu;
        Memory.cpuCreepMovePredefined.uses ++; 
    }
    
}


