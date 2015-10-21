/**
 * Creates an instance of CTasks.
 *
 * @constructor
 * @param {String}          type        [TASK_HARVEST|TASK_COLLECT|TASK_GATHER|TASK_DELIVER
 *                                      |TASK_UPGRADE|TASK_BUILD
 *                                      |TASK_REPAIR|TASK_FILLSTORAGE]
 * @param {String}          targetId    ID of the target
 * @param {RoomPosition}    pos     
 * @param {Number}          qty         see getQty
 * @param {Bool}            energySource    true if task generates energy, false if consumes energy
 * @this {CTasks}
 */
var CTask = function CTask(type, targetId, pos, qty, energySource, bodyTypes) {
    this.type           = type;
    this.targetId       = targetId;
    this.pos            = pos;
    this.qty            = qty;
    this.qtyAssigned    = 0;

    // todo: add priority. e.g. Repair a rampart with 1M has low prio whereas a source with a little dmg has high prio

    // object of the form {creepName1: {qty1}, creepName2: {qty2}, ...}
    this.assignments = {};
    switch (this.type) {
        case TASK_HARVEST: this.bodyTypes = [BODY_HARVESTER, BODY_DEFAULT]; 
            this.energySource = true;
            break; 
        case TASK_COLLECT: 
        case TASK_GATHER:       this.bodyTypes = [BODY_CARRIER, BODY_DEFAULT]; 
            this.energySource = true;
            break; 
        case TASK_DELIVER:      this.bodyTypes = [BODY_CARRIER, BODY_DEFAULT]; 
            this.energySource = false;
            break; 
        case TASK_UPGRADE:      this.bodyTypes = [BODY_UPGRADER, BODY_DEFAULT]; 
            this.energySource = false;
            break; 
        case TASK_BUILD:        this.bodyTypes = [BODY_DEFAULT]; 
            this.energySource = false;
            break; 
        case TASK_REPAIR:       this.bodyTypes = [BODY_DEFAULT];
            this.energySource = false;
            break; 
        case TASK_FILLSTORAGE:  this.bodyTypes = [BODY_CARRIER_TINY, BODY_DEFAULT, BODY_CARRIER];
            this.energySource = null;
            break; 
        case TASK_MOVE:         this.bodyTypes = [BODY_CARRIER, BODY_DEFAULT];
            this.energySource = null;
            break; 
        default:
            this.logError('task type ' + type + ' not available.');
            return;
    }
    if (energySource !== undefined) this.energySource = energySource;
    if (bodyTypes !== undefined)    this.bodyTypes = bodyTypes;
};

// ########### CTask getters/setters ########################################
CTask.prototype.getType = function() {
    return this.type;
};
CTask.prototype.getTarget = function() {
    return Game.getObjectById(this.targetId);
};
CTask.prototype.getPos = function() {
    if (this.pos.constructor !== RoomPosition) {
        this.pos.__proto__ = RoomPosition.prototype;
    }
    return this.pos;
};
/**
 * @return {Room}
 */
CTask.prototype.getRoom = function() {
    return Game.rooms[this.pos.roomName];
};
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
CTask.prototype.getQty = function() {
    return this.qty;
};
/**
 * Returns the qty that is already assigned to a creep.
 * @return {Number} 
 */
CTask.prototype.getQtyAssigned = function() {
    //if (this.qtyAssigned === undefined) {
        var qtyAssigned = 0;
        _.forEach(this.getAssignments(), function(assignment) {
            qtyAssigned += assignment;
        });
        this.qtyAssigned = qtyAssigned;
    //}
    return this.qtyAssigned;
};
CTask.prototype.getAssignments = function() {
    return this.assignments;
};
CTask.prototype.getAssignmentsCnt = function() {
    return Object.keys(this.assignments).length;
};
CTask.prototype.getBodyTypes = function() {
    return this.bodyTypes;
};
/**
 * Generates a unique code of the task. (todo: multiple dropped energy should be added to an existing task) 
 * @return {String} 
 */
CTask.prototype.getCode = function() {
    if (this.code === undefined) {
        if (this.getTarget() instanceof Creep)
            this.code = this.type + "_" + this.getTarget().name;
        else 
            this.code = this.type + "_" + this.pos.x + "_" + this.pos.y;
    }
    return this.code;
};

CTask.prototype.getPrio = function() {
    if (this.prio === undefined) {
        switch (this.type) {
            case TASK_HARVEST: this.prio = 50; break; 
            case TASK_COLLECT: 
                if (this.getTarget().energy >= 100) this.prio = 65; 
                else this.prio = 60;
            break; 
            case TASK_GATHER:  this.prio = 62; break; 
            case TASK_DELIVER:
                if (this.getTarget() instanceof Spawn)
                    this.prio = 56; 
                else if (this.getTarget().structureType === STRUCTURE_STORAGE)
                    this.prio = 15; 
                else
                    this.prio = 55; 
                break; 
            case TASK_UPGRADE:      this.prio = 10; break; 
            case TASK_BUILD:        this.prio = 30; break; 
            case TASK_REPAIR:       this.prio = 40; break; 
            case TASK_FILLSTORAGE:  this.prio = 20; break; 
            case TASK_MOVE:         this.prio = 5; break; 
            default:
                this.logError('task type ' + type + ' not available.');
                return;
        }
    }
    return this.prio;
};

// ########### CTask methods ############################################

/**
 * Returns the best matching creep for this task
 * @return {Creep} 
 */
CTask.prototype.assignmentSearch = function() {
    var creep = null;
    var task = this;
    _.forEach(this.getBodyTypes(), function(bodyType) {
        var room = task.getRoom();
        if (!creep) {
            if (task.energySource === true)  {
                if (room.hasCreepEmpty(bodyType)) {
                    creep = task.getPos().findClosestCreepEmpty(bodyType);
                    if (!(creep instanceof Creep)) room.hasCreepEmpty(bodyType, true);
                }
            } else if (task.energySource === false)  {
                if (room.hasCreepFull(bodyType)) {
                    creep = task.getPos().findClosestCreepFull(bodyType);
                    if (!(creep instanceof Creep)) room.hasCreepFull(bodyType, true);
                }
            } else {
                if (room.hasCreepFull(bodyType)) {
                    creep = task.getPos().findClosestCreep(bodyType);
                    if (!(creep instanceof Creep)) room.hasCreep(bodyType, true);
                }
            }
        }
    });
    return creep;
};

/**
 * assign a creep to this task.
 * the selected qty depends on the capabilities of the creep
 * @param {Creep} creep the creep, that shoud do this task
 */
CTask.prototype.assignmentCreate = function(creep) {
    var qty = 0;
    switch (this.type) {
        case TASK_HARVEST:
            if (creep.getBodyType() === BODY_HARVESTER)     qty = this.qty;
            else                                            qty = 1;
            break;
        case TASK_COLLECT: 
        case TASK_GATHER:       qty = 1;                                     break; 
        case TASK_DELIVER:      qty = creep.carry.energy;                    break; 
        case TASK_UPGRADE:      qty = 1;                                     break; 
        case TASK_BUILD:
        case TASK_REPAIR:       qty = 1;                                     break;
        case TASK_FILLSTORAGE:  qty = 1;                                     break;
        case TASK_MOVE:         qty = 1;                                     break;
        default:
            this.logError("Can't assign task, type " + type + " not available.");
            return;
    }
    if (qty > this.qty) qty = this.qty;
    this.assignments[creep.name] = qty;
    delete this.qtyAssigned;
};

/**
 * Delete an assignment of a creep from the task.
 * @param {Creep} creep
 */
CTask.prototype.assignmentDelete = function(creepName) {
    delete this.assignments[creepName];
    delete this.qtyAssigned;
};

/**
 * Checks if the Task is the same.
 * @param {CTask} task
 * @return {Boolean} 
 */
CTask.prototype.equals = function(task) {
    if (this.type === task.type
        && this.targetId === task.targetId
        && this.pos === task.pos
        && this.qty === task.qty //qty can change
        && this.energySource === task.energySource
        && this.energySink === task.energySink
    ) {
        return true;
    } else {
        return false;
    }
};

/**
 * Updates the task by new values like qty
 * @param {CTask} task
 */
CTask.prototype.update = function(task) {
    this.type = task.type;
    this.targetId = task.targetId;
    this.pos = task.pos;
    this.qty = task.qty;
    this.energySource = task.energySource;
    this.energySink = task.energySink;
};

/**
 * Delete this task from room's task collection
 */
CTask.prototype.delete = function() {
    this.getRoom().getTasks().del(this);
};