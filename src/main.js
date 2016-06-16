"use strict";

let Profiler            = require('Profiler');
let Logger              = require('Logger');
Profiler._.init();
Logger._.init();

let GameManager         = require('GameManager');

let CTask               = require('CTask');
let CTasks              = require('CTasks');
require('CMap');
require('CSpawn');
require('CStructure');
require('CSource');
require('CRoomPosition_Find');
require('CRoomPosition');
require('CCreep');
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

    GameManager._.run();

    for (var roomName in Game.rooms) {
        var room = Game.rooms[roomName];
        room.run();
    }

    for(var creepName in Game.creeps) {
        var creep = Game.creeps[creepName];
        creep.run();
    }

    Profiler._.report();

    Logger.functionExit("MAIN TIME ", Game.cpu.getUsed() - time);
}
