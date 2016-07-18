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
        this.qtyAssigned    = 0;

        // todo: add priority. e.g. Repair a rampart with 1M has low prio whereas a source with a little dmg has high prio

        // object of the form {creepName1: {qty1}, creepName2: {qty2}, ...}
        this.assignments = {};
        switch (this.type) {
            case 'TASK_HARVEST':
                this.bodyTypes = ['BODY_HARVESTER', 'BODY_DEFAULT'];
                this.energySource = true;
                break;
            case 'TASK_COLLECT':
            case 'TASK_GATHER':
                this.bodyTypes = ['BODY_CARRIER'];
                this.energySource = true;
                break;
            case 'TASK_DELIVER':
                this.bodyTypes = ['BODY_CARRIER', 'BODY_DEFAULT'];
                this.energySource = false;
                break;
            case 'TASK_UPGRADE':
                this.bodyTypes = ['BODY_UPGRADER', 'BODY_DEFAULT'];
                this.energySource = false;
                break;
            case 'TASK_BUILD':
                this.bodyTypes = ['BODY_DEFAULT'];
                this.energySource = null;
                break;
            case 'TASK_REPAIR':
                this.bodyTypes = ['BODY_DEFAULT'];
                this.energySource = false;
                break;
            case 'TASK_FILLSTORAGE':
                this.bodyTypes = ['BODY_CARRIER_TINY', 'BODY_DEFAULT', 'BODY_CARRIER'];
                this.energySource = null;
                break;
            case 'TASK_MOVE':
                this.bodyTypes = [];
                this.energySource = null;
                break;
            case 'TASK_HARVEST_REMOTE':
                this.bodyTypes = ['BODY_HARVESTER'];
                this.energySource = null;
                break;
            case 'TASK_GATHER_REMOTE':
                this.bodyTypes = ['BODY_CARRIER'];
                this.energySource = true;
                break;
            case 'TASK_BUILD_REMOTE':
                this.bodyTypes = ['BODY_DEFAULT'];
                this.energySource = null;
                break;
            case 'TASK_RESERVE_REMOTE':
                this.bodyTypes = ['BODY_CLAIM'];
                this.energySource = null;
                break;
            case 'TASK_RESERVE':
                this.bodyTypes = ['BODY_CLAIM'];
                this.energySource = null;
                break;
            case 'TASK_GUARD':
            case 'TASK_GUARD_REMOTE':
                this.bodyTypes = ['BODY_MELEE', 'BODY_RANGER'];
                this.energySource = null;
                break;
            default:
                this.getRoom().logError('task type ' + type + ' not available.');
                return;
        }
    }

    get multiTask () {
        return {'BODY_DEFAULT': false, 'BODY_HARVESTER': true, 'BODY_CARRIER': false, 'BODY_CARRIER_TINY': true, 'BODY_UPGRADER': true, 'BODY_MELEE': false, 'BODY_RANGER': false, } ;
    }

    getType () {
        return this.type;
    }

    get targetIds () {
        if ( this._targetIds === undefined ) this._targetIds = [];
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

    /**
     * @return {Room}
     */
    getRoom () {
        if (this.roomName) return Game.rooms[this.roomName];
        else               return undefined;
    }

    /**
     * Returns the qty of the task. This can express different values:
     * TASK_HARVEST: how many harvest spots are to occupy
     * TASK_COLLECT: how many dropped energy is available
     * TASK_GATHER: how many energy is carried by the creep
     * TASK_DELIVER: how many energy is needed at the target
     * TASK_UPGRADE: how many upgrade spots are to occupy
     * TASK_BUILD: how many energy is needed to complete the contruction
     * TASK_REPAIR: how many energy is needed to repair the structure
     * TASK_FILLSTORAGE: how many spots
     * @return {Number}
     */
    getQty () {
        return this.qty;
    }

    /**
     * Returns the qty that is already assigned to a creep.
     * @return {Number}
     */
    getQtyAssigned () {
        //if (this.qtyAssigned === undefined) {
            var qtyAssigned = 0;
            _.forEach(this.getAssignments(), function(assignment) {
                qtyAssigned += assignment;
            });
            this.qtyAssigned = qtyAssigned;
        //}
        return this.qtyAssigned;
    }

    /**
     * Returns the number of maximum creeps on that task
     * @return {Number}
     */
    getCnt () {
         return this.cnt;
    }

    getAssignments () {
        return this.assignments;
    }

    getAssignmentsCnt () {
        return Object.keys(this.assignments).length;
    }

    getBodyTypes () {
        return this.bodyTypes;
    }

    /**
     * Generates a unique code of the task. (todo: multiple dropped energy should be added to an existing task)
     * @return {String}
     */
    getCode () {
        //this.getRoom().logError("Use deprecated Method!");
        if (this.code === undefined) {
            if ( ! this.target ) {
                this.code = this.type + "_DEFAULT";
            } else if ( this.target instanceof Creep ) {
                this.code =this._code = this.type + "_" + this.targetName;
            } else if (this.target instanceof Flag) {
                this.code =this._code = this.type + "_" + this.targetName;
            } else {
                this.code =this._code = this.type + "_" + this.pos.x + "_" + this.pos.y;
            }
        }
        return this._code;
    }

    getPrio () {
        return this.prio;
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
                        if (this.target.id === this.getRoom().memory.controllerRefillId) {
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
        var bodyTypes = this.getBodyTypes();
        for ( var i in bodyTypes ) {
            var bodyType = bodyTypes[i];
            var room = this.getRoom();
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
if (this.getType()==='TASK_BUILD')
    this.getRoom().log("build")
if(creep&&creep.memory.body==='BODY_DEFAULT'){
    creep.say(this.getCode());
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
                if (creep.getBodyType() === 'BODY_HARVESTER')   qty = creep.getBodyPartCnt(WORK);
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
        delete this.qtyAssigned;
    }

    /**
     * Delete an assignment of a creep from the task.
     * @param {Creep} creep
     */
    assignmentDelete (creepName) {
        delete this.assignments[creepName];
        delete this.qtyAssigned;
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
        if (this.roomName !== room.name) this.getRoom().logError("task changed room " + this.getCode());
        if (
            this.roomName === room.name
            && this.type === type
            && this.targetId === target instanceof Flag ? target.name : target.id
            && this.targetName === target.name
            && this.qty === qty 
            && this.cnt === cnt
            && this.cnt === cnt
            && prio === undefined ? true : this.prio === prio
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
        this.getRoom().getTasks().del(this);
    }

};

module.exports = CTask;
