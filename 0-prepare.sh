#!/bin/sh
cd www/lang/
echo "opencc zh-CN to zh-TW..."
./0-opencc.sh
cd ..
echo "tsc bundle scripts..."
./0-transpile.sh
cd ..
