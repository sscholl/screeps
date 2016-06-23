"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Logger = (function () {
    _createClass(Logger, null, [{
        key: "_",

        /**
         * Get the singleton object
         * @return {Logger}
         */
        get: function get() {
            if (Logger._singleton === undefined) Logger._ = new Logger();
            return Logger._singleton;
        },

        /**
         * Set the singleton object
         * @param {Logger}
         */
        set: function set(singleton) {
            Logger._singleton = singleton;
        }

        /**
         * Instantiate the Logger
         * @constructor
         * @this {Logger}
         */
    }]);

    function Logger() {
        _classCallCheck(this, Logger);

        Logger.ACTIVE = true;
        Logger.MODULES = {
            ROOM: false,
            ROOMPOSITION: false
        };

        Logger.indentation = ["", "  ", "    ", "      ", "        ", "          ", "            ", "              ", "                ", "                ", "                  ", "                    ", "                      ", "                        ", "                          ", "                            ", "                              ", "                                ", "                                  ", "                                    ", "                                      ", "                                        "];

        Logger.level = 0;
    }

    /**
     * Apply the wrapper to selected functions
     */

    _createClass(Logger, [{
        key: "init",
        value: function init() {
            if (Logger.ACTIVE) {
                var methods = [];
                if (Logger.MODULES.ROOM) {
                    this.wrap('Room', Room, 'find');
                    this.wrap('Room', Room, 'findPath');
                }
                if (Logger.MODULES.ROOMPOSITION) {
                    this.wrap('RoomPosition', RoomPosition, 'findPathTo');
                    this.wrap('RoomPosition', RoomPosition, 'findClosestByPath');
                }
            }
        }

        /**
         * wrap function of class c
         * @param {String} class name
         * @param {Object} class object
         * @param {String} method name
         */
    }, {
        key: "wrap",
        value: function wrap(LoggerName, c, method) {
            if (Logger.ACTIVE) {
                var f = c.prototype[method];
                c.prototype[method] = function () {
                    Logger.functionEnter(LoggerName + '.' + method);

                    var tStart = Game.cpu.getUsed();
                    var returnValue = f.apply(this, arguments);
                    var tReq = Game.cpu.getUsed() - tStart;

                    Logger.functionExit(LoggerName + '.' + method, +tReq);

                    return returnValue;
                };
            }
        }

        /**
         * log a message
         * @param {String} msg
         */
    }], [{
        key: "functionEnter",
        value: function functionEnter(name) {
            Logger.log('--> ' + name);
            Logger.level++;
        }

        /**
         * log a message
         * @param {String} msg
         */
    }, {
        key: "functionExit",
        value: function functionExit(name, tReq) {
            Logger.level--;
            Logger.log('<-- ' + name + ' [' + tReq.toFixed(2) + '] ');
        }

        /**
         * log a message
         * @param {String} msg
         */
    }, {
        key: "log",
        value: function log(msg) {
            console.log(Logger.indentation[Logger.level] + msg);
        }

        /**
         * log a message
         * @param {String} msg
         */
    }, {
        key: "logError",
        value: function logError(msg) {
            console.log(Logger.indentation[Logger.level] + 'ERROR: ' + msg);
        }

        /**
         * log a object
         * @param {String} obj
         */
    }, {
        key: "logDebug",
        value: function logDebug(obj) {
            console.log(Logger.indentation[Logger.level] + 'DEBUG: ' + JSON.stringify(obj));
        }
    }]);

    return Logger;
})();

module.exports = Logger;
