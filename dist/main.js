let Profiler = require('Profiler');
let Logger = require('Logger');
Profiler._.init();
Logger._.init();

var GameManager = require('GameManager');

require('CTask');
require('CTasks');
require('CMap');
require('CSpawn');
require('CStructure');
require('CSource');
require('CRoomPosition_Find');
require('CRoomPosition');
require('CCreep');
require('CCreepBodyDefault');
require('CCreepXUpgrader');
require('CCreepXGuard');
require('CCreepXHealer');
require('CRoom_Find');
require('CRoom_Tasks');
require('CRoom');



module.exports.loop = function () {
    if (Game.cpu.tickLimit < 500) {
        Logger.log("Execution of loop is not possible, because tick limit is " + Game.cpu.tickLimit + "<500");
        return;
    }

    var time = Game.cpu.getUsed();
    Logger.functionEnter("LOAD TIME " + time);
    Logger.log("Game.cpu.limit " + Game.cpu.limit);
    Logger.log("Game.cpu.tickLimit " + Game.cpu.tickLimit);
    Logger.log("Game.cpu.bucket " + Game.cpu.bucket);

    GameManager._.init();

    for (var roomName in Game.rooms) {
        var room = Game.rooms[roomName];

        room.spawns = room.find(FIND_MY_STRUCTURES, {filter:{structureType:STRUCTURE_SPAWN}});
        if (room.spawns.length > 0) {
            room.defaultSpawn = room.spawns[0];
        }
        room.run();
    }

    for(var creepName in Game.creeps) {
        var creep = Game.creeps[creepName];
        creep.run();
    }

    Profiler._.report();

    Logger.functionExit("MAIN TIME ", Game.cpu.getUsed() - time);
}
