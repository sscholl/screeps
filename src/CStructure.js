Structure.prototype.isFull = function() {
	return this.energy >= this.energyCapacity;
}

Structure.prototype.isEmpty = function() {
	return this.energy <= 0;
}