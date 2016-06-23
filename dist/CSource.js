"use strict";

module.exports = function () {
}

// ########### GENERAL SECTION #########################################

Source.prototype.memory = undefined;

Source.prototype.getMemory = function() {
    if ( !this.memory ) {
        this.memory = this.room.memory.sources[this.id] = this.room.memory.sources[this.id] || {};
    }
    return this.memory;
}

Source.prototype.getSpotsCnt = function() {
    if ( this.getMemory().spotsCnt === undefined ) {
        this.getMemory().spotsCnt = this.pos.getSpotsCnt();
    }
    return this.getMemory().spotsCnt;
}
