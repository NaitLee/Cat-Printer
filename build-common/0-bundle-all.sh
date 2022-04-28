#!/bin/sh
export version=`cat ../version`
for i in $(find | grep -E '.*\.pyc'); do rm $i; done
for i in $(find | grep -E '__pycache__'); do rm -d $i; done
python3 bundle.py $version
python3 bundle.py -w $version
python3 bundle.py -b $version
