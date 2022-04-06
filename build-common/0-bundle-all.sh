#!/bin/sh
python3 bundle.py $1
python3 bundle.py -w $1
python3 bundle.py -b $1
