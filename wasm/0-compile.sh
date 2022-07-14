#!/bin/sh
if [[ $1 == 1 ]]; then
    npm run asbuild:release;
else
    npm run asbuild:debug;
fi
