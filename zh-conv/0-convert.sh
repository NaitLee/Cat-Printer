#!/bin/sh
convert() {
    lang=${1}
    langname=${2}
    conf=$lang.json
    opencc -c $conf -i ../readme.i18n/README.zh-Hant-CN.md -o ../readme.i18n/README.$lang.md
    sed "s/中文（傳統字）/$langname/g" ../www/lang/zh-Hant-CN.json | opencc -c $conf >../www/lang/$lang.json
}

convert zh-CN 中文（简体字）
convert zh-HK 中文（香港字）
convert zh-TW 中文（正體字）
