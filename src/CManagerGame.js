module.exports = {
    memory: Memory.GameManager,
    
    run: function () {
        if (this.memory === undefined) Memory.GameManager = {};
        if (!this.memory.timer || this.memory.timer <= 0) {
            this.memory.timer = 60;
            for(var i in Memory.creeps) {
                if(!Game.creeps[i]) {
                    delete Memory.creeps[i];
                }
            }
        }
        -- this.memory.timer;
    }
};
