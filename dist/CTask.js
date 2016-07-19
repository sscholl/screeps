"use strict";

let Profiler = require('Profiler');
let Logger = require('Logger');

class CTask {

    /**
     * Init the class
     * @return {CTask}
     */
    static init () {
        if (CTask._init !== true) {
           CTask._init = true;

           var methods = ['assignmentSearch', 'assignmentCreate', 'assignmentDelete'];
           for (var i in methods) {
               Profiler._.wrap('CTask', CTask, methods[i]);
               Logger._.wrap('CTask', CTask, methods[i]);
           }
        }
    }

    /**
     * Creates an instance of CTask.
     *
     * @constructor
     * @param {String}          type        [TASK_HARVEST|TASK_COLLECT|TASK_GATHER|TASK_DELIVER
     *                                      |'TASK_UPGRADE'|'TASK_BUILD'
     *                                      |'TASK_REPAIR'|'TASK_FILLSTORAGE']
     * @param {String}          targetId    ID of the target
     * @param {RoomPosition}    pos
     * @param {Number}          qty         see getQty
     * @param {Bool}            energySource    true if task generates energy, false if consumes energy
     * @this {CTasks}
     */
    constructor (code, room, type, target, targets, qty, cnt, prio) {
        CTask.init();
        this._code          = code;
        this.update(room, type, target, targets, qty, cnt, prio);
    }

    get multiTask () {
        return {'BODY_DEFAULT': false, 'BODY_HARVESTER': true, 'BODY_CARRIER': false, 'BODY_CARRIER_TINY': true, 'BODY_UPGRADER': true, 'BODY_MELEE': false, 'BODY_RANGER': false, } ;
    }

    get type () {
        return this._type;
    }
    set type (v) {
        this._type = v;
    }

    get targetId () {
        return this._targetId;
    }
    set targetId (v) {
        this._targetId = v;
    }

    get targetName () {
        return this._targetName;
    }
    set targetName (v) {
        this._targetName = v;
    }

    get targetIds () {
        if ( this._targetIds === undefined ) this.targetIds = [];
        return this._targetIds;
    }
    set targetIds (v) {
        this._targetIds = v;
    }

    get target () {
        if ( Game.flags[this.targetId] ) return Game.flags[this.targetId];
        return Game.getObjectById(this.targetId);
    }

    get targets () {
        let t = [];
        for ( let id of this.targetIds ) {
            t.push(Game.getObjectById(id));
        }
        return t;
    }

    get pos () {
        return this.target.pos ;
    }

    get roomName () {
        return this._roomName;
    }
    set roomName (v) {
        this._roomName = v;
    }

    get room () {
        if (this.roomName) return Game.rooms[this.roomName];
        else               return undefined;
    }

    get energySource () {
        if ( this._energySource === undefined ) {
            switch (this.type) {
                case 'TASK_HARVEST':
                case 'TASK_COLLECT':
                case 'TASK_GATHER':
                case 'TASK_GATHER_REMOTE':
                    this.energySource = true;
                    break;
                case 'TASK_DELIVER':
                case 'TASK_UPGRADE':
                    this.energySource = false;
                    break;
                case 'TASK_BUILD':
                case 'TASK_REPAIR':
                case 'TASK_FILLSTORAGE':
                case 'TASK_MOVE':
                case 'TASK_HARVEST_REMOTE':
                case 'TASK_BUILD_REMOTE':
                case 'TASK_RESERVE_REMOTE':
                case 'TASK_RESERVE':
                case 'TASK_GUARD':
                case 'TASK_GUARD_REMOTE':
                    this.energySource = null;
                    break;
                default:
                    this.room.logError('task type ' + type + ' not available.');
                    return;
            }
        }
        return this._energySource;
    }
    set energySource (v) {
        this._energySource = v;
    }


    get qty () {
        return this._qty;
    }
    set qty (v) {
        this._qty = v;
    }

    get qtyAssigned () {
        //if (this._qtyAssigned === undefined) {
            var qtyAssigned = 0;
            _.forEach(this.assignments, function(assignment) {
                qtyAssigned += assignment;
            });
            this._qtyAssigned = qtyAssigned;
        //}
        return this._qtyAssigned;
    }

    get cnt () {
        return this._cnt;
    }
    set cnt (v) {
        this._cnt = v;
    }

    get assignments () {
        if ( this._assignments === undefined ) this.assignments = {};
        return this._assignments;
    }
    set assignments (v) {
        this._assignments = v;
    }

    get assignmentsCnt () {
        return Object.keys(this.assignments).length;
    }

    get bodyTypes () {
        if ( this._bodyTypes === undefined ) {
            switch (this.type) {
                case 'TASK_HARVEST':        this.bodyTypes = ['BODY_HARVESTER', 'BODY_DEFAULT']; break;
                case 'TASK_COLLECT':
                case 'TASK_GATHER':
                case 'TASK_DELIVER':        this.bodyTypes = ['BODY_CARRIER', 'BODY_DEFAULT']; break;
                case 'TASK_UPGRADE':        this.bodyTypes = ['BODY_UPGRADER', 'BODY_DEFAULT']; break;
                case 'TASK_REPAIR':
                case 'TASK_BUILD':          this.bodyTypes = ['BODY_DEFAULT']; break;
                case 'TASK_FILLSTORAGE':    this.bodyTypes = ['BODY_CARRIER_TINY', 'BODY_DEFAULT', 'BODY_CARRIER']; break;
                case 'TASK_MOVE':           this.bodyTypes = []; break;
                case 'TASK_HARVEST_REMOTE': this.bodyTypes = ['BODY_HARVESTER']; break;
                case 'TASK_GATHER_REMOTE':  this.bodyTypes = ['BODY_CARRIER']; break;
                case 'TASK_BUILD_REMOTE':   this.bodyTypes = ['BODY_DEFAULT']; break;
                case 'TASK_RESERVE':
                case 'TASK_RESERVE_REMOTE': this.bodyTypes = ['BODY_CLAIM']; break;
                case 'TASK_GUARD':
                case 'TASK_GUARD_REMOTE':   this.bodyTypes = ['BODY_MELEE', 'BODY_RANGER']; break;
                default:
                    this.room.logError('task type ' + type + ' not available.');
                    return;
            }
        }
        return this._bodyTypes;
    }
    set bodyTypes (v) {
        this._bodyTypes = v;
    }

    /**
     * Generates a unique code of the task. (todo: multiple dropped energy should be added to an existing task)
     * @return {String}
     */
    get code () {
        //this.room.logError("Use deprecated Method!");
        if (this._code === undefined) {
            if ( ! this.target ) {
                this.code = this.type + "_DEFAULT";
            } else if ( this.target instanceof Creep ) {
                this.code = this.type + "_" + this.targetName;
            } else if (this.target instanceof Flag) {
                this.code = this.type + "_" + this.targetName;
            } else {
                this.code = this.type + "_" + this.pos.x + "_" + this.pos.y;
            }
        }
        return this._code;
    }
    set code (v) {
        this._code = v;
    }

    get prio () {
        if ( this._prio === undefined ) {
            switch (this.type) {
                case 'TASK_HARVEST': this.prio = 50; break;
                case 'TASK_COLLECT':
                    if (this.target && this.target.amount >= 100) this.prio = 65;
                    else this.prio = 60;
                break;
                case 'TASK_GATHER':  this.prio = 62; break;
                case 'TASK_DELIVER':
                    if ( this.target instanceof StructureStorage || this.target instanceof StructureContainer ) {
                        this.prio = 15;
                    } else if (this.target instanceof StructureLab ) {
                        this.prio = 20;
                    } else if (this.target instanceof StructureTower ) {
                        this.prio = 25;
                    } else if (this.target instanceof Spawn ) {
                        if (this.target.id === this.room.memory.controllerRefillId) {
                            this.prio = 50;
                        } else {
                            this.prio = 56;
                        }
                    } else {
                        this.prio = 55;
                    }
                    break;
                case 'TASK_UPGRADE':      this.prio = 10; break;
                case 'TASK_BUILD':        this.prio = 30; break;
                case 'TASK_REPAIR':       this.prio = 40; break;
                case 'TASK_FILLSTORAGE':  this.prio = 20; break;
                case 'TASK_MOVE':         this.prio = 5; break;
                case 'TASK_HARVEST_REMOTE':         this.prio = 47; break;
                case 'TASK_GATHER_REMOTE':         this.prio = 46; break;
                case 'TASK_BUILD_REMOTE':         this.prio = 20; break;
                case 'TASK_RESERVE_REMOTE':         this.prio = 45; break;
                case 'TASK_RESERVE':         this.prio = 50; break;
                case 'TASK_GUARD':         this.prio = 49; break;
                case 'TASK_GUARD_REMOTE':   this.prio = 47.5; break;
                default:
                    this.logError('task type ' + type + ' not available.');
                    return;
            }
        }
        return this._prio;
    }
    set prio (v) {
        this._prio = v;
    }

    // ########### CTask methods ############################################

    /**
     * Returns the best matching creep for this task
     * @return {Creep}
     */
    assignmentSearch () {
        var creep = null;
        var bodyTypes = this.bodyTypes;
        for ( var i in bodyTypes ) {
            var bodyType = bodyTypes[i];
            var room = this.room;
            if ( !creep ) {
                if ( this.multiTask[bodyType] ) {
                    if (room.hasCreep(bodyType)) {
                        creep = this.pos.findClosestCreep(bodyType);
                        if (!(creep instanceof Creep)) room.hasCreep(bodyType, true);
                    }
                } else if (this.energySource === true)  {
                    if (room.hasCreepEmpty(bodyType)) {
                        creep = this.pos.findClosestCreepEmpty(bodyType);
                        if (!(creep instanceof Creep)) room.hasCreepEmpty(bodyType, true);
                    }
                } else if (this.energySource === false)  {
                    if (room.hasCreepFull(bodyType)) {
                        creep = this.pos.findClosestCreepFull(bodyType);
                        if (!(creep instanceof Creep)) room.hasCreepFull(bodyType, true);
                    }
                } else {
                    if (room.hasCreep(bodyType)) {
                        creep = this.pos.findClosestCreep(bodyType);
                        if (!(creep instanceof Creep)) room.hasCreep(bodyType, true);
                    }
                }
            }
        }
        return creep;
    }

    /**
     * assign a creep to this task.
     * the selected qty depends on the capabilities of the creep
     * @param {Creep} creep the creep, that shoud do this task
     */
    assignmentCreate (creep) {
        var qty = 0;
        switch (this.type) {
            case 'TASK_HARVEST':
                if (creep.bodyType === 'BODY_HARVESTER')   qty = creep.getActiveBodyparts(WORK);
                else                                            qty = 1;
                break;
            case 'TASK_COLLECT':      qty = creep.carryCapacity - creep.carry.energy;   break;
            case 'TASK_GATHER':       qty = creep.getActiveBodyparts(CARRY);            break;
            case 'TASK_DELIVER':      qty = creep.carry.energy;                         break;
            case 'TASK_UPGRADE':      qty = creep.getActiveBodyparts(WORK);             break;
            case 'TASK_BUILD':        qty = creep.carry.energy;                         break;
            case 'TASK_REPAIR':       qty = creep.carry.energy * 100;                   break;
            case 'TASK_FILLSTORAGE':  qty = 1;                                          break;
            case 'TASK_MOVE':         qty = 1;                                          break;
            case 'TASK_HARVEST_REMOTE':         qty = 1;                                break;
            case 'TASK_GATHER_REMOTE':         qty = 1;                                 break;
            case 'TASK_BUILD_REMOTE': qty = creep.getActiveBodyparts(WORK);            break;
            case 'TASK_RESERVE_REMOTE':         qty = 1;                                break;
            case 'TASK_RESERVE':         qty = 1;                                       break;
            case 'TASK_GUARD':
            case 'TASK_GUARD_REMOTE': qty = creep.getActiveBodyparts(ATTACK) + creep.getActiveBodyparts(RANGED_ATTACK) * 2;          break;
            default:
                this.logError("Can't assign task, type " + type + " not available.");
                return;
        }
        if (qty > this.qty) qty = this.qty;
        this.assignments[creep.name] = qty;
        delete this._qtyAssigned;
    }

    /**
     * Delete an assignment of a creep from the task.
     * @param {Creep} creep
     */
    assignmentDelete (creepName) {
        if ( _.has(this.assignments, creepName) ) {
            delete this.assignments[creepName];
            delete this._qtyAssigned;
        }
    }

    /**
     * Checks if the Task is the same.
     * @param {CTask} task
     * @return {Boolean}
     */
    valid () {
        if (this.target instanceof RoomObject) return true;
        else                                        return false;
    }

    /**
     * Checks if the Task is the same.
     * @param {CTask} task
     * @return {Boolean}
     */
    equals (room, type, target, targets, qty, cnt, prio) {
        if (this.roomName !== room.name) this.room.logError("task changed room " + this.code);
        if (
            this.roomName === room.name
            && this.type === type
            && this.targetId === target instanceof Flag ? target.name : target.id
            && this.targetName === target.name
            && this.qty === qty
            && this.cnt === cnt
            && ((prio === undefined) ? true : this.prio === prio)
        ) {
            for ( let t of targets )
                if ( this.targetIds.indexOf(t.id) === -1 )
                    return false;
            return true;
        } else {
            return false;
        }
    }

    /**
     * Updates the task by new values like qty
     * @param {CTask} task
     */
    update (room, type, target, targets, qty, cnt, prio) {
        this.roomName = room.name;
        this.type = type;
        this.targetId = target instanceof Flag ? target.name : target.id ;
        this.targetName = target.name ;
        this.qty = qty;
        this.cnt = cnt;
        this.prio = prio;
        this.targetIds = []; //empty array
        for ( let t of targets )
            this.targetIds.push(t.id);
    }

    /**
     * Delete this task from room's task collection
     */
    delete () {
        this.room.getTasks().del(this);
    }

};

module.exports = CTask;
