#!/bin/sh
cd www
npx tsc  $@  --allowJs  --outFile main.comp.js  $(cat all_js.txt)
cd ..
