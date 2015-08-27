// ########### GENERAL SECTION #########################################

Creep.prototype.runRanger = function() {
    var target = this.pos.findClosest(this.room.getHostileCreeps());
    if (target) {
        if (target.owner.username != 'Source Keeper') {
            Game.notify("User " + target.owner.username + " moved into room " + this.room.name + " with body " + JSON.stringify(target.body), 0);
        }

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
          //console.log(JSON.stringify(stuff));
        //this.rangedAttack(target.structure);

        delete this.memory.currentTargetId;
    }
}