var time = Game.getUsedCpu();
console.log("LOAD TIME " + time);
//######## Include Debug ######################################################

#include "debug.h"
#include "constants.h"

#if DEBUG
    console.log('===============================================' + Game.time +
                 '========================================= with cpu limit of ' + Game.cpuLimit);
#endif

// ######## Include new own classes ###########################################
#include "Task/CTask.js"
#include "Task/CTasks.js"
// ######## Include prototype extension of classes ############################
#include "CMap.js"
#include "CSpawn.js"
#include "CStructure.js"
#include "CSource.js"
#include "CRoomPosition.js"
#include "CCreep.js"
#include "CRoom.js"


var enable_profiling = true;
if (enable_profiling) {
    Memory.p = Memory.p || {};

    var wrap = function(c, n) {
        var p = Memory.p[n] || { usage: 0, count: 0 };
        Memory.p[n] = p;

        var f = c.prototype[n];
        c.prototype[n] = function() {
            var ts = Game.getUsedCpu();
            var rc = f.apply(this, arguments);
            p.usage += Game.getUsedCpu() - ts;
            ++p.count;
            return rc;
        };
    };

    wrap(RoomPosition, 'isNearTo');
    wrap(RoomPosition, 'findPathTo');
    wrap(RoomPosition, 'isEqualTo');
    wrap(RoomPosition, 'findClosestByPath');
    wrap(RoomPosition, 'findClosestByDistance');
    wrap(Creep, 'moveByPath');
    wrap(Creep, 'moveTo');
    wrap(Creep, 'movePredefined');
    wrap(Creep, 'pickup');
    wrap(Creep, 'build');
    wrap(Creep, 'repair');
    wrap(Creep, 'harvest');
    wrap(Creep, 'upgradeController');
    wrap(Room, 'lookAt');
    wrap(Room, 'lookFor');
    wrap(Room, 'lookForAt');
    wrap(Room, 'lookForAtArea');
    wrap(Room, 'find');
    wrap(Spawn, 'createCreep');
    wrap(Spawn, 'spawn');
}



// ######## Game ##############################################################
TIMER_BEGIN(TIMER_MODULE_MAIN, 'game')
var managerGame = require('CManagerGame');
managerGame.run();
TIMER_END(TIMER_MODULE_MAIN, 'game')

// ######## Room ##############################################################
TIMER_BEGIN(TIMER_MODULE_MAIN, 'room')
for (var roomName in Game.rooms) {
    var room = Game.rooms[roomName];

    room.spawns = room.find(FIND_MY_STRUCTURES, {filter:{structureType:STRUCTURE_SPAWN}});
    if (room.spawns.length > 0) {
        room.defaultSpawn = room.spawns[0];
    }
    
    room.run();
}
TIMER_END(TIMER_MODULE_MAIN, 'room')

// ######## Execute Creeps Actions ############################################
TIMER_BEGIN(TIMER_MODULE_MAIN, 'creeps')
for(var creepName in Game.creeps) {
    var creep = Game.creeps[creepName];
    //TIMER_BEGIN_(TIMER_MODULE_MAIN, 'creep', creep.name);

        creep.run();
    //TIMER_END(TIMER_MODULE_MAIN, 'creep');
}
TIMER_END(TIMER_MODULE_MAIN, 'creeps')

// ######## End ###############################################################


var report_interval = 10000;
if (Game.time % report_interval == 0) {
        var summary = 0;
        for (var n in Memory.p) {
            var p = Memory.p[n];
            if (p.count === 0) {
                p.average = 0;
                continue;
            }
            p.average = p.usage / p.count;
            summary += p.average;
        }
        var msg;
        for (var n in Memory.p) {
            var p = Memory.p[n];
            msg = n + ': ' + p.usage.toFixed(2) + '/' + p.count + ' == ' + p.average.toFixed(2)
                        + ' (' + (p.average * 100 / summary).toFixed(2) + '%)';
            logDetail(msg);
            Game.notify(msg, 1);
        }
        msg = '--- ' + summary.toFixed(2);
        logDetail(msg);
        Game.notify(msg, 1);

        Memory.p = {};
}


console.log("MAIN TIME " + (Game.getUsedCpu() - time));