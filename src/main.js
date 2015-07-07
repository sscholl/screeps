//######## Include Debug ######################################################

#include "debug.h"

#if DEBUG
	console.log('===============================================' + Game.time +
			 	'===============================================');
#endif

TIMER_BEGIN(TIMER_MODULE_MAIN, 'main')

// ######## Include prototype extension of classes ############################
#include "CSource.js"
#include "CRoomPosition.js"
#include "CCreep.js"
#include "CRoom.js"

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
    } else {
        room.defaultSpawn = Game.spawns.Spawn1;
    }

    room.run();
}
TIMER_END(TIMER_MODULE_MAIN, 'room')

// ######## Execute Creeps Actions ############################################
TIMER_BEGIN(TIMER_MODULE_MAIN, 'creeps')
for(var creepName in Game.creeps) {
    var creep = Game.creeps[creepName];
    //TIMER_BEGIN_(TIMER_MODULE_MAIN, 'creep', creep.name + ' role:' + creep.memory.role);
        creep.run();
    //TIMER_END(TIMER_MODULE_MAIN, 'creep');
}
TIMER_END(TIMER_MODULE_MAIN, 'creeps')

// ######## End ###############################################################

TIMER_END(TIMER_MODULE_MAIN, 'main')