/**
 * Creates an instance of CTasks.
 *
 * @constructor
 * @param {String}          type        [TASK_HARVEST|TASK_COLLECT|TASK_DELIVER
 *                                      |TASK_UPGRADE|TASK_BUILD|TASK_REPAIR]
 * @param {String}          targetId    ID of the target
 * @param {RoomPosition}    pos     
 * @param {Number}          qty         see getQty
 * @param {Bool}            energySource    true if task generates energy, false if consumes energy
 * @this {CTasks}
 */
var CTask = function CTask(type, targetId, pos, qty, energySource) {
    this.type           = type;
    this.targetId       = targetId;
    this.pos            = pos;
    this.qty            = qty;
    this.qtyAssigned    = 0;
    this.energySource   = energySource;

    // todo: add priority. e.g. Repair a rampart with 1M has low prio whereas a source with a little dmg has high prio

    // object of the form {creepName1: {qty1}, creepName2: {qty2}, ...}
    this.assignments = {};

    switch (this.type) {
        case TASK_HARVEST: this.bodyTypes = [BODY_HARVESTER, BODY_DEFAULT]; break; 
        case TASK_COLLECT: this.bodyTypes = [BODY_DEFAULT]; break; 
        case TASK_DELIVER: this.bodyTypes = [BODY_DEFAULT]; break; 
        case TASK_UPGRADE: this.bodyTypes = [BODY_UPGRADER, BODY_DEFAULT]; break; 
        case TASK_BUILD:   this.bodyTypes = [BODY_DEFAULT]; break; 
        case TASK_REPAIR:  this.bodyTypes = [BODY_DEFAULT]; break; 
        default:
            this.logError('task type ' + type + ' not available.');
            return;
    }
};

// ########### CTask getters/setters ########################################
CTask.prototype.getType = function() {
    return this.type;
};
CTask.prototype.getTarget = function() {
    return Game.getObjectById(this.targetId);
};
CTask.prototype.getPos = function() {
    if (this.pos.construtor !== RoomPosition) {
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
 * TASK_COLLECT: how many energy is available (dropped or contained in creep)
 * TASK_DELIVER: how many energy is needed at the target
 * TASK_UPGRADE: how many upgrade spots are to occupy
 * TASK_BUILD: how many energy is needed to complete the contruction
 * TASK_REPAIR: how many energy is needed to repair the structure
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
    if (this.qtyAssigned === undefined) {
        var qtyAssigned = 0;
        _.forEach(this.getAssignments(), function(assignment) {
            qtyAssigned += assignment;
        });
        this.qtyAssigned = qtyAssigned;
    }
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
        this.code = this.type + "_" + this.pos.x + "_" + this.pos.y;
    }
    return this.code;
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
        if (!creep) {
            if (task.energySource)  creep = task.getPos().findClosestCreepEmpty(bodyType);
            else                    creep = task.getPos().findClosestCreepFull(bodyType);
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
            if (creep.getBodyType() == BODY_HARVESTER)  qty = this.qty;
            else                                        qty = 1;
            break;
        case TASK_COLLECT: qty = creep.energyCapacity - creep.energy;   break; 
        case TASK_DELIVER: qty = creep.energy;                          break; 
        case TASK_UPGRADE: qty = qty = 1;                               break; 
        case TASK_BUILD:
        case TASK_REPAIR:
            if (creep.getBodyType() == BODY_HARVESTER)  qty = this.qty;
            else                                        qty = 1;
            break;
        default:
            this.logError("Can't assign task, type " + type + " not available.");
            return;
    }
    creep.taskAssign(this);
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