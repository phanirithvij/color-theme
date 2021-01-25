"""
Usage use with ./run-celery.sh

"""

import signal
import subprocess
from datetime import datetime
from pathlib import Path
from shutil import copyfile

logfile = 'logs/latest.log'

print('[scripts/celery.py] Restarted Celery')
print(f'[scripts/celery.py] Logging to {logfile}')
# print('[scripts/celery.py] disk_usage', disk_usage(Path('logs/')))

Path(logfile).touch()
assert Path(logfile).is_file()

with open(logfile, 'w'):
    pass


command_args = \
    ['celery', '-A', 'server.tasks.tasks', 'worker', '-E',
        '--loglevel=info', '-f', logfile]
proc = subprocess.Popen(command_args, shell=False)

try:
    proc.communicate()
except KeyboardInterrupt:
    proc.send_signal(signal.SIGTERM)
    time = datetime.now()
    # rename the log file
    copyfile(logfile, f"logs/log{time}.log")
    exit(0)
