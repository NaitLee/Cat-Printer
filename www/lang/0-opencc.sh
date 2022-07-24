#!/bin/sh
# convert with OpenCC: https://github.com/BYVoid/OpenCC
sed 's/中文（简体）/中文（臺灣正體）/' < zh-CN.json | opencc -c s2twp.json > zh-TW.json
