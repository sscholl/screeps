#define TIMER_MODULE_MAIN "main"
#define TIMER_MODULE_ROOM "room"

#if DEBUG
    Memory.logger = {};
    Memory.logger.level = 0;
    Memory.logger.indentation = ["", "  ", "    ", "      ", "        ", "          ", "            ", "              ", "                ", "                "];
    function logCompact(text) {
        console.log(
            Memory.logger.indentation[Memory.logger.level] + text
        );
    }
    function logDetail(text) {
        console.log(
            Memory.logger.indentation[Memory.logger.level] + text
        );
    }
    function logError(text) {
        console.log(
            Memory.logger.indentation[Memory.logger.level] + '!!!ERROR!!!' + text
        );
    }
    function logLevelIncrease() {
        Memory.logger.level ++;
    }
    function logLevelDecrease() {
        Memory.logger.level --;
    }

    #define LOG_DETAIL(text) logDetail(text);
    #define LOG_DETAIL_THIS(text) this.logDetail(text);
    #define LOG_DEBUG(variable) logDetail(JSON.stringify(variable));
#else
    function logCompact(text) { console.log(text); }
    function logDetail(text) {}
    function logError(text) { console.log('!!!ERROR!!!' + text); }

    #define LOG_DETAIL(text)
    #define LOG_DETAIL_THIS(text)
    #define LOG_DEBUG(variable) 
#endif

#if TIMER && DEBUG
    Memory.timer = {};

    function timerBegin(module, timerName) { timerBegin_(module, timerName, ""); }
    function timerEnd(module, timerName) { timerEnd_(module, timerName, ""); }
    function timerBegin_(module, timerName, text) {
        logDetail('--> ' + timerName + ' ' + text);
        logLevelIncrease();
        Memory.timer[timerName] = Game.getUsedCpu();
    }
    function timerEnd_(module, timerName, text) {
        Memory.timer[timerName] = Game.getUsedCpu() - Memory.timer[timerName];
        logLevelDecrease();
        logDetail('<-- ' + timerName + ' [' + Memory.timer[timerName].toFixed(1) + '] ' + text
        );
    }

    #define TIMER_BEGIN(module, timerName) timerBegin(module, timerName);
    #define TIMER_END(module, timerName) timerEnd(module, timerName);
    #define TIMER_BEGIN_(module, timerName, text) timerBegin_(module, timerName, text);
    #define TIMER_END_(module, timerName, text) timerEnd_(module, timerName, text);
#else 
    #define TIMER_BEGIN(module, timerName)
    #define TIMER_END(module, timerName) 
    #define TIMER_BEGIN_(module, timerName, text)
    #define TIMER_END_(module, timerName, text) 
#endif