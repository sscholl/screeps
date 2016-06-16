"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Logger = require('Logger');
var Profiler = require('Profiler');

var GameManager = (function () {
  _createClass(GameManager, [{
    key: 'memory',

    /**
     * Get memory
     * @return {Object}
     */
    get: function get() {
      if (Memory.GameManager === undefined) Memory.GameManager = {};
      return Memory.GameManager;
    }

    /**
     * Instantiate the GameManager class
     * @constructor
     * @this {GameManager}
     */
  }], [{
    key: '_',

    /**
     * Get the singleton object
     * @return {GameManager}
     */
    get: function get() {
      if (GameManager._singleton === undefined) GameManager._ = new GameManager();
      return GameManager._singleton;
    },

    /**
     * Set the singleton object
     * @param {GameManager}
     */
    set: function set(singleton) {
      GameManager._singleton = singleton;
    }
  }]);

  function GameManager() {
    _classCallCheck(this, GameManager);
  }

  /**
   *
   */

  _createClass(GameManager, [{
    key: 'run',
    value: function run() {
      this.garbageCollection();
    }

    /**
     *
     */
  }, {
    key: 'garbageCollection',
    value: function garbageCollection() {
      if (Game.time % 1000 == 0) {
        if (Memory.creeps) _.difference(Object.keys(Memory.creeps), Object.keys(Game.creeps)).forEach(function (key) {
          delete Memory.creeps[key];
        });
        if (Memory.flags) _.difference(Object.keys(Memory.flags), Object.keys(Game.flags)).forEach(function (key) {
          delete Memory.flags[key];
        });
        if (Memory.rooms) _.difference(Object.keys(Memory.rooms), Object.keys(Game.rooms)).forEach(function (key) {
          delete Memory.rooms[key];
        });
        if (Memory.spawns) _.difference(Object.keys(Memory.spawns), Object.keys(Game.spawns)).forEach(function (key) {
          delete Memory.spawns[key];
        });
        if (Memory.structures) _.difference(Object.keys(Memory.structures), Object.keys(Game.structures)).forEach(function (key) {
          delete Memory.structures[key];
        });
      }
    }
  }]);

  return GameManager;
})();

module.exports = GameManager;

var methods = ['init'];
for (var i in methods) {
  Profiler._.wrap('GameManager', GameManager, methods[i]);
  Logger._.wrap('GameManager', GameManager, methods[i]);
}
