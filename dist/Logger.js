"use strict";

var Logger = class Logger {

    /**
     * Get the singleton object
     * @return {Logger}
     */
    static get _ () {
       if (Logger._singleton === undefined)
            Logger._ = new Logger();
       return Logger._singleton;
    }

    /**
     * Set the singleton object
     * @param {Logger}
     */
    static set _ (singleton) {
        Logger._singleton = singleton;
    }

    /**
     * Instantiate the Logger
     * @constructor
     * @this {Logger}
     */
    constructor () {
        Logger.ACTIVE = true;
        Logger.MODULES = {
            ROOM:          false,
            ROOMPOSITION:   false,
        };

        Logger.indentation = ["", "  ", "    ", "      ", "        ", "          ", "            ", "              ", "                ", "                ", "                  ", "                    ", "                      ", "                        ", "                          ", "                            ", "                              ", "                                ", "                                  ", "                                    ", "                                      ", "                                        "];

        Logger.level = 0;
        Logger.logStack = [];
        Logger.logStackEnterLevel = [];
        Logger.logStackShowLevel = [];
    }

    /**
     * Apply the wrapper to selected functions
     */
    init () {
        if (Logger.ACTIVE && this._init !== true) {
            this._init = true;
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
    wrap (LoggerName, c, method, tReqBoundary = 5) {
        if (Logger.ACTIVE) {
            var f = c.prototype[method];
            c.prototype[method] = function() {
                Logger.functionEnter(LoggerName + '.' + method);

                var tStart      = Game.cpu.getUsed();
                try {
                    var returnValue = f.apply(this, arguments);
                } catch (e) {
                    Logger.logDebug(e);
                    Logger.logError(e.stack);
                }
                var tReq        = Game.cpu.getUsed() - tStart;
                
                if ( tReq >= tReqBoundary ) Logger.logStackShowLevel[Logger.level - 1] = true;

                Logger.functionExit(LoggerName + '.' + method,  + tReq);

                return returnValue;
            };
        }
    }

    /**
     * log a message
     * @param {String} msg
     */
    static functionEnter (name) {
        Logger.log( '--> ' + name, true, false );
        Logger.level ++;
    }

    /**
     * log a message
     * @param {String} msg
     */
    static functionExit (name, tReq) {
        Logger.level --;
        Logger.log( '<-- ' + name  + ' [' + tReq.toFixed(2) + '] ', false, true);
    }
    
    static logPrintStack () {
        for ( let i = 0; i < Logger.logStack.length; i ++ ) {
            console.log(Logger.logStack[i]);
        }
        Logger.logStack = [];
    }

    /**
     * log a message
     * @param {String} msg
     */
    static log (msg, enter = false, exit = false) {
        if ( enter ) {
            Logger.logStack.push( Logger.logMessage(msg) );
            Logger.logStackEnterLevel[Logger.level] = Logger.logStack.length;
            Logger.logStackShowLevel[Logger.level] = false;
        } else if ( exit ) {
            if ( Logger.logStackShowLevel[Logger.level] ) {
                Logger.logStack.push( Logger.logMessage(msg) );
                Logger.logPrintStack ();
                if (Logger.level > 0 ) Logger.logStackShowLevel[Logger.level - 1] = true;
            } else {
                for ( let i = Logger.logStack.length - 1; i >= Logger.logStackEnterLevel[Logger.level] - 1; i --) {
                    Logger.logStack.pop();
                }
            }
        } else {
            Logger.logStack.push( Logger.logMessage(msg) );
            Logger.logStackShowLevel[Logger.level - 1] = true;
        }
    }

    /**
     * log a message
     * @param {String} msg
     */
    static logError (msg) {
        Logger.log( 'ERROR: ' + msg );
    }

    /**
     * log a object
     * @param {String} obj
     */
    static logDebug (obj) {
        Logger.log( 'DEBUG: ' + JSON.stringifyOnce(obj) );
    }
    
    static logMessage (msg) {
        return Logger.indentation[Logger.level] + msg;
    }

};

JSON.stringifyOnce = function(obj, replacer, indent){
    var printedObjects = [];
    var printedObjectKeys = [];

    function printOnceReplacer(key, value){
        if ( printedObjects.length > 2000){ // browsers will not print more than 20K, I don't see the point to allow 2K.. algorithm will not be fast anyway if we have too many objects
        return 'object too long';
        }
        var printedObjIndex = false;
        printedObjects.forEach(function(obj, index){
            if(obj===value){
                printedObjIndex = index;
            }
        });

        if ( key == ''){ //root element
             printedObjects.push(obj);
            printedObjectKeys.push("root");
             return value;
        }

        else if(printedObjIndex+"" != "false" && typeof(value)=="object"){
            if ( printedObjectKeys[printedObjIndex] == "root"){
                return "(pointer to root)";
            }else{
                return "(see " + ((!!value && !!value.constructor) ? value.constructor.name.toLowerCase()  : typeof(value)) + " with key " + printedObjectKeys[printedObjIndex] + ")";
            }
        }else{

            var qualifiedKey = key || "(empty key)";
            printedObjects.push(value);
            printedObjectKeys.push(qualifiedKey);
            if(replacer){
                return replacer(key, value);
            }else{
                return value;
            }
        }
    }
    return JSON.stringify(obj, printOnceReplacer, indent);
};

module.exports = Logger;
