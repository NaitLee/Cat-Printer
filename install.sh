#!/bin/sh
venv_path=".venv"
if [ -d $venv_path ]; then
    venv_init=false
else
    venv_init=true
fi
$venv_init && python3 -m venv $venv_path
source $venv_path/bin/activate
$venv_init && pip3 install -r requirements.txt
echo "Testing environment"
python3 printer.py -f MX06 - <<EOF
P4
384 0
EOF
