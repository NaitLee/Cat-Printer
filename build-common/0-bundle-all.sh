#!/bin/sh
for i in $(find | grep -E '.*\.pyc'); do rm $i; done
python3 bundle.py $1
python3 bundle.py -w $1
python3 bundle.py -b $1
