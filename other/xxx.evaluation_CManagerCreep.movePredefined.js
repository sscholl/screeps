var VERBOSE = false;

Creep.prototype.movePredefined = function(targetPos, opts) {

    if (Game.time % 2 == 0) {
        var startCpu = Game.getUsedCpu();

        this.moveTo(targetPos, opts); 
        var endCpu = Game.getUsedCpu();
        Memory.cpuCreepMoveTo.time += endCpu - startCpu;
        Memory.cpuCreepMoveTo.uses ++;
    } else {
        var startCpu = Game.getUsedCpu();

        var recalculateMove = false;
        var move = this.memory._move;
        if ( move && Number.isInteger(move.step)) {
            if (
                (move.step + 1) < (move.path.length - 1)
                && move.dest.x == targetPos.x 
                && move.dest.y == targetPos.y
                && move.path[move.step].x == this.pos.x 
                && move.path[move.step].y == this.pos.y
            ) {
                if (this.move(move.path[move.step + 1].direction) == OK)
                    ++ move.step;
            } else {
                recalculateMove = true;
            }
        } else {
            recalculateMove = true;
        }
        if (recalculateMove) {
            var result = this.moveTo(targetPos, opts); 
            if (result == OK) {
                this.memory._move.step = 0
            }
        } else {
            if (VERBOSE) console.log(this.name + " uses a predefined path " + targetPos);  
        }

        var endCpu = Game.getUsedCpu();
        Memory.cpuCreepMovePredefined.time += endCpu - startCpu;
        Memory.cpuCreepMovePredefined.uses ++; 

    }
    
}

THE EVALUATION RESUTLS:


cpuCreepMoveTo {
    time    :   5211.23,
    uses    :   6980
}
cpuCreepMovePredefined {
    time    :   1142.03,
    uses    :   7023
}

--> the results show, that the predefined path uses a little bit more than a half of the cpu time with repeating calculation of the path in rooms W12S3 and W12S2
