#!/bin/sh
p4a apk --private .. --dist_name="cat-printer" --package="io.github.naitlee.catprinter" --name="Cat Printer" \
    --icon=icon.png --version="0.3.0" --bootstrap=webview --window --requirements=android,pyjnius,bleak \
    --blacklist-requirements=sqlite3,openssl --port=8095 --arch=arm64-v8a --blacklist="blacklist.txt" \
    --presplash=blank.png --presplash-color=black --add-source="advancedwebview" --orientation=user \
    --permission=BLUETOOTH --permission=BLUETOOTH_SCAN --permission=BLUETOOTH_CONNECT \
    --permission=BLUETOOTH_ADMIN --permission=ACCESS_FINE_LOCATION --permission=ACCESS_COARSE_LOCATION
