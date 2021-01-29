#!/bin/bash

# https://stackoverflow.com/a/64644990/8608146
exe(){
    set -x
    "$@"
    { set +x; } 2>/dev/null
}

new_inst=false
if [ ! -d "venv" ]; then
    echo "Creating python virtual env at ./venv"
    exe python -m venv venv
    new_inst=true
fi

source venv/bin/activate
pwd
echo -n "Using "
which pip; pip -V

if [ $new_inst == true ]; then
    echo "Installing python requirements"
    exe pip install -r ../requirements.txt
fi

if ! [ -f "server/scripts/scripts" ]; then
    exe cd server/scripts
    exe go get -u -v github.com/RobCherry/vibrant
    exe go build -x
    exe cd ../../
fi

exe python -m server
