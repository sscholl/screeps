// ########### GENERAL SECTION #########################################

Creep.prototype.runRanger = function() {
    var target = this.pos.findClosestByPath(this.room.getHostileCreeps());
    if (target && target.owner.username === "NhanHo") target = false;
    if (target) {
        if (!this.pos.inRangeTo(target, 3))
            this.movePredefined(target);
        if (this.pos.inRangeTo(target, 2) || this.hits < this.hitsMax * 0.3)
            this.movePredefined(this.room.defaultSpawn);
        this.rangedAttack(target);
        this.memory.currentTargetId = target.id;

    } else {
        var collectionPoint = Game.flags[this.room.name];
        if (collectionPoint) {
            this.movePredefined(collectionPoint.pos, {}, true);
        }

        // delete a custom structure
        //var stuff = this.room.lookAt(0,0);
        //var target = stuff[0];
          //LOG_DEBUG(JSON.stringify(stuff));
        //this.rangedAttack(target.structure);

        delete this.memory.currentTargetId;
    }
}