"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Logger = require('Logger');

var Profiler = (function () {
    _createClass(Profiler, null, [{
        key: '_',

        /**
         * Get the singleton object
         * @return {Profiler}
         */
        get: function get() {
            if (Profiler._singleton === undefined) {
                Profiler._ = new Profiler();
                Logger._.wrap('Profiler', Profiler, 'report');
            }
            return Profiler._singleton;
        },

        /**
         * Set the singleton object
         * @param {Profiler}
         */
        set: function set(singleton) {
            Profiler._singleton = singleton;
        }

        /**
         * Instantiate the Profiler class
         * @constructor
         * @this {Profiler}
         */
    }]);

    function Profiler() {
        _classCallCheck(this, Profiler);

        Profiler.ACTIVE = true;
        Profiler.MODULES = {
            ROOM: true,
            ROOMPOSITION: true
        };
        Profiler.REPORT_INTERVALL = 1000;
        Profiler.REPORT_EMAIL = true;
    }

    /**
     * Apply the wrapper functions to classes to measure timings
     */

    _createClass(Profiler, [{
        key: 'init',
        value: function init() {
            if (Profiler.ACTIVE) {
                Memory.timer = Memory.timer || {};
                var methods = [];
                if (Profiler.MODULES.ROOM) {
                    methods = Object.getOwnPropertyNames(Room.prototype).filter(function (p) {
                        return typeof Room.prototype[p] === 'function' && p != 'constructor' && p != 'toString' && p != 'toJSON';
                    });
                    //console.log('adding methods: ' + JSON.stringify(methods));
                    for (var i in methods) this.wrap('Room', Room, methods[i]);
                }
                if (Profiler.MODULES.ROOMPOSITION) {
                    methods = Object.getOwnPropertyNames(RoomPosition.prototype).filter(function (p) {
                        return typeof RoomPosition.prototype[p] === 'function' && p != 'constructor' && p != 'toString' && p != 'toJSON';
                    });
                    //console.log('adding methods: ' + JSON.stringify(methods));
                    for (var i in methods) this.wrap('RoomPosition', RoomPosition, methods[i]);
                }
            }
        }

        /**
         *
         */
    }, {
        key: 'finalize',
        value: function finalize() {
            if (Profiler.ACTIVE && Game.time % Profiler.REPORT_INTERVALL === 0 && false) this.report();
        }

        /**
         * wrap function of class c
         * @param {String} class name
         * @param {Object} class object
         * @param {String} method name
         */
    }, {
        key: 'wrap',
        value: function wrap(className, c, method) {
            if (Profiler.ACTIVE) {
                var timer = Memory.timer[className + '.' + method] || { usage: 0, count: 0, average: null, percentage: null };
                Memory.timer[className + '.' + method] = timer;

                var f = c.prototype[method];
                c.prototype[method] = function () {
                    var tStart = Game.cpu.getUsed();
                    var returnValue = f.apply(this, arguments);
                    var tReq = Game.cpu.getUsed() - tStart;
                    timer.usage += tReq;
                    ++timer.count;
                    return returnValue;
                };
            }
        }

        /**
         * report the measured data to console and email
         */
    }, {
        key: 'report',
        value: function report() {
            if (Profiler.ACTIVE) {
                var sum = 0;
                for (var n in Memory.timer) {
                    var timer = Memory.timer[n];
                    if (timer.count === 0) {
                        timer.average = 0;
                        continue;
                    }
                    timer.average = timer.usage / timer.count;
                    sum += timer.average;
                }
                var msg;
                var msgMail;
                for (var n in Memory.timer) {
                    var timer = Memory.timer[n];
                    timer.percentage = timer.average * 100 / sum;
                    msg = n + ': ' + timer.usage.toFixed(2) + ' s / ' + timer.count + ' = ' + timer.average.toFixed(2) + ' s ' + ' (' + timer.percentage.toFixed(2) + '%)';
                    msgMail += msg;
                    Logger.log(msg);
                }
                Game.notify(msgMail, 1);
            }
        }
    }]);

    return Profiler;
})();

module.exports = Profiler;
