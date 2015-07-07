// ########### GENERAL SECTION #########################################

Creep.prototype.runPionier = function() {
    if (this.room.defaultSpawn) {
        this.memory.phase = 'search';
    }

    var empty   = this.energy <= 0;
    var full    = this.energy >= this.energyCapacity;
    var phase   = this.memory.phase;
    if      (phase == PHASE_SEARCH)             ;
    else if (phase == PHASE_HARVEST && !full)   ;
    else if (phase == PHASE_HARVEST && full)    this.memory.phase = PHASE_DELIVER;
    else if (phase == PHASE_DELIVER && !empty)  ;
    else if (phase == PHASE_DELIVER && empty)   this.memory.phase = PHASE_SEARCH;
    else {
        this.memory.phase = PHASE_SEARCH;
        console.log("No harvester phase for " + this.name + " - phase:" + phase + " empty:" + empty + " full:" + full)
    }

    if (this.memory.phase == PHASE_SEARCH) {
        this.memory.phase = PHASE_HARVEST;
    }
    if (this.memory.phase == PHASE_HARVEST) {
        sources = this.room.find(FIND_SOURCES);
        for (var sourceId in sources) {
            var source = sources[sourceId];
            if ( source != null ) {
                var targets = source.pos.findEnemiesInAttackRange();
                var targetsStructures = source.pos.findEnemyStructuresInAttackRange();
                if(targets.length == 0 && targetsStructures == 0) {
                    this.moveTo(source);
                    this.harvest(source);
                    break;
                }
            }
        }
    } else if (this.memory.phase == PHASE_DELIVER) {
    	var target = this.pos.findClosest(FIND_CONSTRUCTION_SITES);
		this.moveTo(target);
		var result = this.build(target);
        if (result == ERR_RCL_NOT_ENOUGH) this.memory.role = "upgrader";
		else if (result != OK && result != ERR_NOT_IN_RANGE) {
            if (result != ERR_INVALID_TARGET) console.log(this.name + " can't build " + result);
        }
        this.moveTo(Game.spawns.Spawn2);
    }
}