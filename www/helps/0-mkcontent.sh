#!/bin/sh
for dir in $(ls); do {
    if [ -d $dir ]; then
        rm "$dir/content.txt"
        for file in $(ls $dir); do {
            printf 'helps/%s/%s\t%s\n' $dir $file ${file%--} >> "$dir/content.txt"
        }; done
    fi
}; done
