import os
import sqlite3
import pytz
import requests
import json
from os.path import expanduser
from datetime import datetime, timedelta
from collections import defaultdict
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Path to the knowledgeC.db file that stores the screen time data
knowledge_db = expanduser("~/Library/Application Support/Knowledge/knowledgeC.db")

def query_database():
    # Check if knowledgeC.db exists
    if not os.path.exists(knowledge_db):
        print("Could not find knowledgeC.db at %s." % (knowledge_db))
        exit(1)

    # Check if knowledgeC.db is readable
    if not os.access(knowledge_db, os.R_OK):
        print("The knowledgeC.db at %s is not readable.\nPlease grant full disk access to the application running the script (e.g. Terminal, iTerm, VSCode etc.)." % (knowledge_db))
        exit(1)

    # Connect to the SQLite database
    with sqlite3.connect(knowledge_db) as con:
        cur = con.cursor()

        # Execute the SQL query to fetch data
        query = """
        SELECT
            ZOBJECT.ZVALUESTRING AS "app", 
            (ZOBJECT.ZENDDATE - ZOBJECT.ZSTARTDATE) AS "usage",
            (ZOBJECT.ZSTARTDATE + 978307200) as "start_time", 
            (ZOBJECT.ZENDDATE + 978307200) as "end_time",
            (ZOBJECT.ZCREATIONDATE + 978307200) as "created_at", 
            ZOBJECT.ZSECONDSFROMGMT AS "tz",
            ZSOURCE.ZDEVICEID AS "device_id",
            ZMODEL AS "device_model"
        FROM
            ZOBJECT 
            LEFT JOIN
            ZSTRUCTUREDMETADATA 
            ON ZOBJECT.ZSTRUCTUREDMETADATA = ZSTRUCTUREDMETADATA.Z_PK 
            LEFT JOIN
            ZSOURCE 
            ON ZOBJECT.ZSOURCE = ZSOURCE.Z_PK 
            LEFT JOIN
            ZSYNCPEER
            ON ZSOURCE.ZDEVICEID = ZSYNCPEER.ZDEVICEID
        WHERE
            ZSTREAMNAME = "/app/usage"
        ORDER BY
            ZSTARTDATE DESC
        """
        cur.execute(query)

        # Fetch all rows from the result set
        return cur.fetchall()

def transform_data(rows):
    # Create a nested dictionary to store the transformed data
    data = defaultdict(lambda: defaultdict(int))

    # Calculate yesterday's date in the 'Asia/Seoul' timezone
    seoul_tz = pytz.timezone('Asia/Seoul')
    yesterday = datetime.now(seoul_tz) - timedelta(days=1)
    yesterday_date = yesterday.date()

    # Get the target device model from the environment variables
    target_device_model = os.getenv('DEVICE_MODEL')
    
    for r in rows:
        app = r[0]
        usage = r[1]
        time = r[3]
        device_id = r[6]
        device_model = r[7]
    
        if device_model == target_device_model:
            dt = datetime.utcfromtimestamp(time).replace(tzinfo=pytz.utc).astimezone(seoul_tz)
            # Only include data for yesterday
            if dt.date() == yesterday_date:
                data[dt.date()][app] += usage

    # Sort and limit the data to top 5 apps by usage for each date
    for date in data:
        apps_usage = data[date]
        # Sort apps by usage in descending order and keep only top 5
        top_apps_usage = dict(sorted(apps_usage.items(), key=lambda item: item[1], reverse=True)[:5])
        data[date] = top_apps_usage
    
    return data

def print_sorted_data(data):
    # Sort by date in descending order
    for date in sorted(data.keys(), reverse=True):
        apps = data[date]
        # Sort by usage in descending order
        for app, usage in sorted(apps.items(), key=lambda item: item[1], reverse=True):
            print(f"Date: {date}, App: {app}, Usage: {usage}")

def send_data_to_server(data):
    url = os.getenv('VERCEL_DOMAIN')
    headers = {'Content-Type': 'application/json'}
    
    screen_time_data = []
    for date, apps in data.items():
        for app, usage in apps.items():
            screen_time_data.append({
                'date': str(date),
                'appName': app,
                'usageTime': usage
            })
    
    response = requests.post(url, headers=headers, data=json.dumps(screen_time_data))
    
    if response.status_code == 200:
        print("Data sent successfully")
    else:
        print(f"Failed to send data: {response.text}")

# Main execution flow
if __name__ == "__main__":
    fetched_data = query_database()
    transformed_data = transform_data(fetched_data)
    print_sorted_data(transformed_data)
    send_data_to_server(transformed_data)
