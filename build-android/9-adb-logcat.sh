#!/bin/sh
adb logcat | grep -E 'python|chromium'
