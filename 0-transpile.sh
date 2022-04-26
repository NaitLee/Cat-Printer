#!/bin/sh
cd www
npx tsc  --allowJs  --outFile main.comp.js  polyfill.js i18n-ext.js i18n.js image.js accessibility.js main.js
cd ..
