#!/bin/bash
source venv/bin/activate

# https://stackoverflow.com/a/43929298/8608146
watchmedo auto-restart -p '*.py' \
--ignore-directories \
--ignore-patterns './venv/*' \
--recursive \
-- python server/scripts/celery.py

# python server/scripts/celery.py