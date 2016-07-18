"use strict";

module.exports = function () {
}

Map.prototype.getMemory = function () {
	if ( this.memory === undefined ) {
		if ( Memory.map === undefined ) Memory.map = {};
		this.memory = Memory.map;
	}
	return this.memory;
};

Map.prototype.getExits = function () {
	if ( this.getMemory().exits === undefined ) {
		this.memory.exits = {};
		this.memory.exits
	}
	return this.getMemory().exits;
};

Map.prototype.findExitCached = function (fromRoom, toRoom) {
	let exits = this.getExits();
	if (exits[fromRoom + '_' + toRoom] === undefined)
		this.memory.exits[fromRoom + '_' + toRoom] = this.findExit(fromRoom, toRoom);
	return this.memory.exits[fromRoom + '_' + toRoom];
};
