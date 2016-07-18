"use strict";

let Profiler            = require('Profiler');
let Logger              = require('Logger');

let GameManager         = require('GameManager');

let CTask               = require('CTask');
let CTasks              = require('CTasks');

// before requires of prototype extensions
Profiler._.init();
Logger._.init();

let includes = ['CMap', 'CSpawn', 'CStructure', 'CSource', 'CRoomPosition', 'CCreep', 'CCreepXGuard', 'CCreepXHealer', 'CRoom_Tasks', 'CRoom'];
let modules = [];
for (let i in includes) {
    modules.push(require(includes[i]));
}

Logger.ACTIVE=true;

module.exports.loop = function () {
    if (Game.cpu.tickLimit < 500) {
        for(let creepName in Game.creeps) {
            let creep = Game.creeps[creepName];
            if (creep.bodyType === 'BODY_HARVESTER' || creep.bodyType === 'BODY_RANGER' || creep.bodyType === 'BODY_HEALER') creep.run();
        }
        console.log("Execution of loop is not possible, because tick limit is " + Game.cpu.tickLimit + "<500");
        Memory.stats["Game.tickSkipped"] = 1;
        return;
    }
        Memory.stats["Game.tickSkipped"] = 0;

    for (let i in modules) modules[i]();

    let time = Game.cpu.getUsed();
    Logger.functionEnter("LOAD TIME " + time);
//    Logger.log("Game.cpu.limit " + Game.cpu.limit);
//    Logger.log("Game.cpu.tickLimit " + Game.cpu.tickLimit);
//    Logger.log("Game.cpu.bucket " + Game.cpu.bucket);

    GameManager._.run();

    let timeRooms = Game.cpu.getUsed();
    Logger.functionEnter("rooms[" + Object.keys(Game.rooms).length + "].run");
    for (let roomName in Game.rooms) {
        let room = Game.rooms[roomName];
        room.run();
    }
    Logger.functionExit("rooms[" + Object.keys(Game.rooms).length + "].run", Game.cpu.getUsed() - timeRooms);

    let timeCreeps = Game.cpu.getUsed();
    Logger.functionEnter("creeps[" + Object.keys(Game.creeps).length + "].run");
    for(let creepName in Game.creeps) {
        let creep = Game.creeps[creepName];
        creep.run();
    }
    Logger.functionExit("creeps[" + Object.keys(Game.creeps).length + "].run", Game.cpu.getUsed() - timeCreeps);

    Profiler._.finalize();

    Logger.functionExit("MAIN TIME ", Game.cpu.getUsed() - time);
    Memory.stats["Game.timeUsed"] = Game.cpu.getUsed() - time;
}
