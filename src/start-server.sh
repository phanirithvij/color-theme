#!/bin/bash

# https://stackoverflow.com/a/64644990/8608146
exe(){
    set -x
    "$@"
    { set +x; } 2>/dev/null
}


# TODO if windows
py -m venv winenv
winenv/Scripts/activate.bat
pip install -r ../requirements.freeze.txt

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

elif [ -x "$(command -v x-terminal-emulator)" ]; then
    exe python -m server
else
    echo "Please add your terminal emulator in the else block of the start-server.sh script"
fi
