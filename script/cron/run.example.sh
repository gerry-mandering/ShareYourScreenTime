#!/bin/bash

# Path to your Python executable in the virtual environment
VENV_PYTHON="/YOUR_CURRENT_PROJECT_PATH/script/crawler/venv/bin/python"

# Path to your Python script
PYTHON_SCRIPT="/YOUR_CURRENT_PROJECT_PATH/script/crawler/screenTimeCrawl.py"

# File to keep track of the last run date
LAST_RUN_FILE="/YOUR_CURRENT_PROJECT_PATH/script/cron/last_run_date.txt"

# Log file path
LOG_FILE="/YOUR_CURRENT_PROJECT_PATH/script/cron/logfile.log"

# Check if the script has already run today
# Deactivated because icloud drive sync issue
#if [ -f "$LAST_RUN_FILE" ]; then
#    LAST_RUN_DATE=$(cat "$LAST_RUN_FILE")
#    TODAY=$(date "+%Y-%m-%d")
#
#	if [ "$LAST_RUN_DATE" == "$TODAY" ]; then
#        echo "$(date "+%Y-%m-%d %H:%M:%S") - Script has already run today." >> "$LOG_FILE"
#        exit 0
#    fi
#fi

# Check for network connectivity
if nc -zw1 google.com 443; then
    # Update last run date
    date "+%Y-%m-%d %H:%M:%S" > "$LAST_RUN_FILE"

    # Run the Python script and log the output
    echo "$(date "+%Y-%m-%d %H:%M:%S") - Starting Python script." >> "$LOG_FILE"
    "$VENV_PYTHON" "$PYTHON_SCRIPT" >> "$LOG_FILE" 2>&1
    echo "$(date "+%Y-%m-%d %H:%M:%S") - Python script completed." >> "$LOG_FILE"
	echo >> "$LOG_FILE"
else
    echo "$(date "+%Y-%m-%d %H:%M:%S") - No network connection." >> "$LOG_FILE"
	echo >> "$LOG_FILE"
fi
