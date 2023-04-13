#!/bin/sh
version=`cat ../version`

rm -rf "dist"
unzip -q "../cat-printer-bare-$version.zip"
mv "cat-printer" "dist"
p4a apk --version="$version" --requirements="`cat build-deps.txt`" --release $@
