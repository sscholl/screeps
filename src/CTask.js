// ########### CTask construtor #########################################
var CTask = function CTask(type, targetId, pos, qty, energySource, energySink)
{
    this.type = type;
    this.targetId = targetId;
    this.target = undefined;
    this.pos = pos;
    this.qty = qty;
    this.energySource = energySource;
    this.energySink = energySink;

    // object of the form {creepId1: {qty1}, creepId2: {qty2}, ...}
    this.assignment = {};
}

// ########### CTask methods ############################################
CTask.prototype.getType = function()
{
    return this.type;
}
CTask.prototype.getTarget = function()
{
    if (target == undefined) {
        this.target = Game.getObjectById(this.targetId);
    }
    return this.target;
}
CTask.prototype.getPos = function()
{
    if (this.pos.construtor == undefined) {
        this.pos.construtor = RoomPosition;
    }
    return this.pos;
}
CTask.prototype.getQty = function()
{
    return this.qtyAssigned;
}
CTask.prototype.getAssignment = function()
{
    return this.assignment;
}

CTask.prototype.assign = function(creep)
{
    var qty = 0;
    switch (this.type) {
        case TASK_HARVEST:
            if (creep.getBodyType() == BODY_HARVESTER)
                qty = this.qty;
            else 
                qty = 1;
            break; 
        default:
            this.logError("Can't assign task, type ' + type + ' not available.");
            return;
    }
    if (qty > this.qty) qty = this.qty;
    this.assignment[creep.id] = qty;
}

CTask.prototype.getCode = function()
{
    if (this.code == undefined) {
        this.code = this.type + "_" + this.pos.x + "_" + this.pos.y;
    }
    return this.code;
}

CTask.prototype.assign = function(creep)
{
    var qty = 0;
    switch (this.type) {
        case TASK_HARVEST:
            if (creep.getBodyType() == BODY_HARVESTER)
                qty = this.qty;
            else 
                qty = 1;
            break; 
        default:
            this.logError('task type ' + type + ' not available.');
            return;
    }
    if (qty > this.qty) qty = this.qty;
    this.assignment[creep.id] = qty;
}

CTask.prototype.equals = function(task)
{
    if (this.type == task.type
        && this.targetId == task.targetId
        && this.pos == task.pos
        //&& this.qty == task.qty //qty can change
        && this.energySource == task.energySource
        && this.energySink == task.energySink
    ) {
        return true;
    } else {
        return false;
    }
}