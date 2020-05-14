#!/bin/bash

# pip install virtualenv && virtualenv venv
# virtualenv venv
source venv/bin/activate
pwd
pip install -r ../requirements.txt

if ! [ -x "$(command -v redis-server)" ]; then
    echo 'Warning: redis is not installed or is not in the $PATH.' >&2
    curl -O http://download.redis.io/redis-stable.tar.gz
    tar xvzf redis-stable.tar.gz
    rm redis-stable.tar.gz
    cd redis-stable
    make -j8
fi

if ! [ -f "server/scripts/scripts" ]; then
    cd server/scripts
    go get -u -v github.com/RobCherry/vibrant
    go build
    cd ../../
fi

echo -e "\n\n\n -------------------------------------"
x-terminal-emulator -e ./run-redis.sh &
x-terminal-emulator -e ./run-celery.sh &
python -m server
