#!/bin/bash

if [ "${1}" == "debug" ]; then
	PARAMS="-DDEBUG=1 -DTIMER=1"
else
	PARAMS=""
fi

gcc -E -P -xc src/main.js -o bin/main.js $PARAMS ${2}
gcc -E -P -xc src/CManagerGame.js -o bin/CManagerGame.js $PARAMS ${2}

grunt screeps 
