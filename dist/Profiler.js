"use strict";

let Logger = require('Logger');

var Profiler = class Profiler {

    /**
     * Get the singleton object
     * @return {Profiler}
     */
    static get _ () {
       if (Profiler._singleton === undefined) {
            Profiler._ = new Profiler();
            Logger._.wrap('Profiler', Profiler, 'report');
        }
       return Profiler._singleton;
    }

    /**
     * Set the singleton object
     * @param {Profiler}
     */
    static set _ (singleton) {
        Profiler._singleton = singleton;
    }

    /**
     * Instantiate the Profiler class
     * @constructor
     * @this {Profiler}
     */
    constructor () {
        Profiler.ACTIVE = false;
        Profiler.MODULES = {
            ROOM:          true,
            ROOMPOSITION:   true,
        };
        Profiler.REPORT_INTERVALL = 100;
        Profiler.REPORT_EMAIL = true;
        Profiler.SCREEPS_GRAFANA = true;
    }

    /**
     * Apply the wrapper functions to classes to measure timings
     */
    init () {
        if (Profiler.ACTIVE && this._init !== true) {
            this._init = true;
            Memory.timer = Memory.timer || {};
            var methods = [];
            if (Profiler.MODULES.ROOM) {
                methods = Object.getOwnPropertyNames(Room.prototype).filter(function (p) {
                    return typeof Room.prototype[p] === 'function' && p !== 'constructor' && p !== 'toString' && p !== 'toJSON';
                });
                //console.log('adding methods: ' + JSON.stringify(methods));
                for (var i in methods) this.wrap('Room', Room, methods[i]);
            }
            if (Profiler.MODULES.ROOMPOSITION) {
                methods = Object.getOwnPropertyNames(RoomPosition.prototype).filter(function (p) {
                    return typeof RoomPosition.prototype[p] === 'function' && p !== 'constructor' && p !== 'toString' && p !== 'toJSON';
                });
                //console.log('adding methods: ' + JSON.stringify(methods));
                for (var i in methods) this.wrap('RoomPosition', RoomPosition, methods[i]);
            }

        }
    }

    /**
     *
     */
    finalize () {
        if ( Profiler.ACTIVE && Game.time % Profiler.REPORT_INTERVALL === 0 )
            this.report();
    }

    /**
     * wrap function of class c
     * @param {String} class name
     * @param {Object} class object
     * @param {String} method name
     */
    wrap (className, c, method) {
        if ( Profiler.ACTIVE ) {
            var timer = Memory.timer[className + '.' + method] || { usage: 0, count: 0 , average: null , percentage: null };
            Memory.timer[className + '.' + method] = timer;

            var f = c.prototype[method];
            c.prototype[method] = function() {
                var tStart      = Game.cpu.getUsed();
                var returnValue = f.apply(this, arguments);
                var tReq        = Game.cpu.getUsed() - tStart;
                timer.usage     += tReq;
                ++ timer.count;
                return returnValue;
            };
        }
    }

    /**
     * report the measured data to console and email
     */
    report () {
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
                if ( timer.usage > 0 ) {
                    timer.percentage = timer.average * 100 / sum;
                    msg = n + ': ' + timer.usage.toFixed(2) + ' s / ' + timer.count + ' = ' + timer.average.toFixed(2) + ' s ' + ' (' + timer.percentage.toFixed(2) + '%)';
                    msgMail += msg;
                    Logger.log(msg);
                    
                    if ( Profiler.SCREEPS_GRAFANA ) {
                        //add stats for screeps-grafana
                        Memory.stats["Profiler." + n + '.usage'] = timer.usage;
                        Memory.stats["Profiler." + n + '.count'] = timer.count;
                        Memory.stats["Profiler." + n + '.average'] = timer.average;
                    }
                }
            }
            if ( Profiler.REPORT_EMAIL ) Game.notify(msgMail, 1);
        }
    }

};

module.exports = Profiler;
