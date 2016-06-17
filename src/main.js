"use strict";

let Profiler            = require('Profiler');
let Logger              = require('Logger');

let GameManager         = require('GameManager');

let CTask               = require('CTask');
let CTasks              = require('CTasks');


var includes = ['CMap', 'CSpawn', 'CStructure', 'CSource', 'CRoomPosition', 'CCreep', 'CCreepXGuard', 'CCreepXHealer', 'CRoom_Tasks', 'CRoom'];
var modules = [];
for (var i in includes) {
   modules.push(require(includes[i]));
}



module.exports.loop = function () {
    if (Game.cpu.tickLimit < 500) {
        for(var creepName in Game.creeps) {
            var creep = Game.creeps[creepName];
            if (creep.bodyType === 'BODY_HARVESTER') creep.run();
        }
        Logger.log("Execution of loop is not possible, because tick limit is " + Game.cpu.tickLimit + "<500");
        return;
    }

    for (var i in modules) modules[i]();

    Profiler._.init();
    Logger._.init();

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
