#!/bin/sh
version=`cat ../version`
unsigned_apk=cat-printer-release-unsigned-$version-.apk
signed_apk=cat-printer-android-$version.apk

if {
    $ANDROIDSDK/build-tools/*/zipalign 4 $unsigned_apk $signed_apk;
    $ANDROIDSDK/build-tools/*/apksigner sign --ks $1 $signed_apk;
}; then
echo "Complete! Moving APK..."
mv $signed_apk $signed_apk.idsig ../
rm *.apk
fi
