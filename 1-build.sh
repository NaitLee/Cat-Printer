#!/bin/sh
# For ultimate laziness!
rm -rf cat-printer-*.zip cat-printer-*.apk* cat-printer-sha256-*.txt
echo -n 'Version tag: '
read version
echo -n $version > version
echo -n 'Key file for signing apk: '
read signkey
echo 'Building common editions...'
cd ./build-common/
./0-bundle-all.sh
echo 'Building for Android...'
cd ../build-android/
./3-formal-build.sh > /dev/null
echo 'Signing apk with keyfile...'
./4-sign.sh $signkey
cd ../
echo 'SHA256 Hash...'
sha256sum cat-printer-* > cat-printer-sha256-$version.txt
echo 'Complete!'
