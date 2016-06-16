'use strict';

var Profiler = require('Profiler');
var Logger = require('Logger');
Profiler._.init();
Logger._.init();

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

    // do someething time consuming
    for (var roomName in Game.rooms) {
        var room = Game.rooms[roomName];
        var spawn = room.find(FIND_MY_SPAWNS)[0];
        for (var i = 0; i < 2; ++i) room.findPath(spawn.pos.findClosestByPath(FIND_SOURCES).pos, spawn.pos);
    }

    Profiler._.report();

    Logger.functionExit("MAIN TIME ", Game.cpu.getUsed() - time);
};
