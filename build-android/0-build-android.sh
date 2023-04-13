#!/bin/sh
version=`cat ../version`

p4a apk --requirements "`cat build-deps.txt`" --version "$version" $@
