"use strict";

let Profiler = require('Profiler');
let Logger = require('Logger');

module.exports = function () {
}

// ########### GENERAL SECTION #########################################

Object.defineProperty(Source.prototype, "memory", { get: function () {
        if ( !this._memory ) {
            this._memory = this.room.memory.sources[this.id] = this.room.memory.sources[this.id] || {};
        }
        return this._memory;
}});

Object.defineProperty(Source.prototype, "spot", { get: function () {
        if (this._spot === undefined) {
            var targetPos = this.room.centerPos;
            if ( this.link ) targetPos = this.link.pos;
            var path = this.pos.findPathTo(targetPos, {ignoreCreeps:true});
            if ( path[0] ) {
                this._spot = new RoomPosition(path[0].x, path[0].y, this.room.name);
            } else {
                this._spot = this.pos;
                this.room.logError("no prefered spot for source found");
            }
        }
        return this._spot;
}});

Object.defineProperty(Source.prototype, "link", {
    get: function () {
        if ( this._link === undefined )
            if ( this.memory.linkId && Game.getObjectById(this.memory.linkId) ) {
                this._link = Game.getObjectById(this.memory.linkId);
            } else {
                var link = this.pos.findInRangeLink(2);
                if ( link[0] ) {
                    this.memory.linkId = link[0].id;
                }
            }
        return this._link;
    },
    set: function (v) {
        this._link = v;
        this.memory.linkId = v.id;
    },
});

Object.defineProperty(Source.prototype, "container", {
    get: function () {
        if ( this._container === undefined )
            if ( this.memory.containerId && Game.getObjectById(this.memory.containerId) ) {
                this._container = Game.getObjectById(this.memory.containerId);
            } else {
                for ( let s of this.spot.lookFor(LOOK_STRUCTURES) )
                    if ( s instanceof StructureContainer )
                        this.container = s;
            }
        return this._container;
    },
    set: function (v) {
        this._container = v;
        this.memory.containerId = v.id;
    },
});

Object.defineProperty(Source.prototype, "hostileSpawn", {
    get: function () {
        if ( this._hostileSpawn === undefined )
            if ( this.memory.hostileSpawnId && Game.getObjectById(this.memory.hostileSpawnId) ) {
                this._hostileSpawn = Game.getObjectById(this.memory.hostileSpawnId);
            } else {
                for ( let s of this.pos.findEnemyStructuresInAttackRange() ) 
                    if ( s instanceof StructureSpawn )
                        this.hostileSpawn = s;
            }
        return this._hostileSpawn;
    },
    set: function (v) {
        this._hostileSpawn = v;
        this.memory.hostileSpawnId = v.id;
    },
});

Object.defineProperty(Source.prototype, "centerDistance", {
    get: function () {
        if (this._centerDistance === undefined) {
            var targetPos = this.room.centerPos;
            var path = this.pos.findPathTo(targetPos, {ignoreCreeps:true});
            if ( path ) {
                this._centerDistance = path.length;
            } else {
                this._centerDistance = 10;
                this.room.logError("no path from source to center could be found.");
            }
        }
        return this._centerDistance;
    },
});

Source.prototype.getSpotsCnt = function() {
    if ( this.memory.spotsCnt === undefined ) {
        this.memory.spotsCnt = this.pos.getSpotsCnt();
    }
    return this.memory.spotsCnt;
}
