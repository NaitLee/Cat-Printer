#!/bin/sh
export version=`cat ../version`
export unsigned_apk=cat-printer-release-unsigned-$version-.apk
export signed_apk=cat-printer-android-$version.apk
$ANDROIDSDK/build-tools/32.0.0/zipalign 4 $unsigned_apk $signed_apk
$ANDROIDSDK/build-tools/32.0.0/apksigner sign --ks $1 $signed_apk
mv $signed_apk $signed_apk.idsig ../
rm *.apk
