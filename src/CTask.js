/**
 * Creates an instance of CTasks.
 *
 * @constructor
 * @param {String} [TASK_HARVEST|TASK_COLLECT|TASK_DELIVER|TASK_UPGRADE|
 *                  TASK_BUILD|TASK_REPAIR]
 * @param {String}          ID of the target
 * @param {RoomPosition} 
 * @param {Number}          see getQty
 * @param {Bool}            true if task generates energy, false if consumes energy
 * @this {CTasks}
 */
var CTask = function CTask(type, targetId, pos, qty, energySource)
{
    this.type = type;
    this.targetId = targetId;
    this.pos = pos;
    this.qty = qty;
    this.energySource = energySource;

    // todo: add priority. e.g. Repair a rampart with 1M has low prio whereas a source with a little dmg has high prio

    // object of the form {creepName1: {qty1}, creepName2: {qty2}, ...}
    this.assignments = {};

    switch (this.type) {
        case TASK_HARVEST: this.bodyType = [BODY_HARVESTER, BODY_DEFAULT]; break; 
        case TASK_COLLECT: this.bodyType = [BODY_DEFAULT]; break; 
        case TASK_DELIVER: this.bodyType = [BODY_DEFAULT]; break; 
        case TASK_UPGRADE: this.bodyType = [BODY_UPGRADER, BODY_DEFAULT]; break; 
        case TASK_BUILD:   this.bodyType = [BODY_DEFAULT]; break; 
        case TASK_REPAIR:  this.bodyType = [BODY_DEFAULT]; break; 
        default:
            this.logError('task type ' + type + ' not available.');
            return;
    }
}

// ########### CTask getters/setters ########################################
CTask.prototype.getType = function()
{
    return this.type;
}
CTask.prototype.getTarget = function()
{
    return Game.getObjectById(this.targetId);
}
CTask.prototype.getPos = function()
{
    if (this.pos.construtor != RoomPosition) {
        this.pos.__proto__ = RoomPosition.prototype;
    }
    return this.pos;
}
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
CTask.prototype.getQty = function()
{
    return this.qty;
}
/**
 * Returns the qty that is already assigned to a creep.
 * @return {Number} 
 */
CTask.prototype.getQtyAssigned = function()
{
    if (this.qtyAssigned == undefined) {
    return this.qty;
}
CTask.prototype.getAssignments = function()
{
    return this.assignments;
}
CTask.prototype.getAssignmentsCnt = function()
{
    return Object.keys(this.assignments).length;
}
CTask.prototype.getBodyType = function()
{
    this.bodyType;
}

/**
 * Generates a unique code of the task. (todo: multiple dropped energy should be added to an existing task) 
 * @return {String} 
 */
CTask.prototype.getCode = function()
{
    if (this.code == undefined) {
        this.code = this.type + "_" + this.pos.x + "_" + this.pos.y;
    }
    return this.code;
}

// ########### CTask methods ############################################

/**
 * Returns the qty that is already assigned to a creep.
 * @return {number} 
 */
CTask.prototype.assignSearch = function(creep)
{
    ???
}

/**
 * assign a creep to this task.
 * the selected qty depends on the capabilities of the creep
 * @param {Creep} the creep, that shoud do this task
 */
CTask.prototype.assign = function(creep)
{
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
    if (qty > this.qty) qty = this.qty;
    this.assignments[creep.id] = qty;
    delete qtyAssigned;
}

/**
 * Delete an assignment of a creep from the task.
 * @param {Creep} 
 */
CTask.prototype.assignDel = function(creep)
{
    delete this.assignments[creep.id];
    delete qtyAssigned;
}

/**
 * Checks if the Task is the same.
 * @return {CTask} 
 */
CTask.prototype.equals = function(task)
{
    if (this.type == task.type
        && this.targetId == task.targetId
        && this.pos == task.pos
        && this.qty == task.qty //qty can change
        && this.energySource == task.energySource
        && this.energySink == task.energySink
    ) {
        return true;
    } else {
        return false;
    }
}

/**
 * Updates the task by new values like qty
 * @return {CTask} 
 */
CTask.prototype.update = function(task)
{
    this.type = task.type;
    this.targetId = task.targetId;
    this.pos = task.pos;
    this.qty = task.qty;
    this.energySource = task.energySource;
    this.energySink = task.energySink;
}