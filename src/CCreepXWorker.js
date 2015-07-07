// ########### GENERAL SECTION #########################################

Creep.prototype.runWorker = function() {
	if (this.memory.phase == PHASE_SEARCH) {
        delete this.memory.harvesterSourceNr;
        this.log(" worker has no idea what to do");
        this.moveAround();
    }
    if (this.memory.phase == PHASE_HARVEST) {
		var source = this.room.sources[this.memory.harvesterSourceNr];
		if ( source != null ) {
            this.say(this.memory.harvesterSourceNr);
            this.movePredefined(source.pos);
            this.harvest(source);
		} else {
            this.memory.phase = PHASE_SEARCH;
		}
    }
}