#!/bin/sh
cd zh-conv
echo "Convert Chinese Language with OpenCC"
./0-convert.sh
cd ../www
echo "tsc bundle scripts..."
./0-transpile.sh
cd ..
