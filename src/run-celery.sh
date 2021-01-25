#!/bin/bash
source venv/bin/activate


dev=True
#dev=notTrue

if [[ $dev == "True" ]]; then
	# https://stackoverflow.com/a/43929298/8608146
	echo "[INFO] Dev mode watching file changes"
	watchmedo auto-restart -p '*.py' \
	--ignore-directories \
	--ignore-patterns './venv/*' \
	--recursive \
	-- python server/scripts/celery.py
else
	python server/scripts/celery.py
fi
