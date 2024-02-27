# ShareYourScreenTime
**ShareYourScreenTime** is a project designed to track and visualize your daily screen time from your iPhone. It collects data on how much time you spend on different apps and presents this information in SVG format.

## Quick Demo
<p align="center">
  <a href="https://github.com/gerry-mandering/ShareYourScreenTime">
    <img src="https://share-your-screen-time.vercel.app" alt="Yesterday's Screen Time">
  </a>
</p>

## Ideas
> **Disclaimer**: I highly recommend not attempting this at home. Currently, there is no official method to access iPhone's screen time data. This project operates by extracting data from Mac's system files following the synchronization of screen time between iPhone and Mac via iCloud.

This project was initiated following the inspiration from Felix Kohlhas's work, [Exporting and Analyzing iOS Screen Time Data using Python and InfluxDB](https://felixkohlhas.com/projects/screentime/), with the objective of publicly disseminating my screen time data as a measure to combat phone addiction.

## Key Features

**Data Collection**: This process involves the use of a Python script coupled with a Shell script to extract data pertaining to screen time, which is subsequently transmitted to a Vercel server and stored within a Postgres database.

**Visualization**: Generates dynamic SVG with bar chart to visualize yesterday's screen time data.

## Installation Guide

To set up **ShareYourScreenTime** for personal use, follow these steps:

1. **Enable Screen Time Sharing**: On your iPhone, go to Screen Time settings and activate the `Share Across Devices` option.
2. **Clone the Repository**: Clone this project to your local
3. **Deploy on Vercel**: Push the cloned repository to Vercel for hosting.
4. **Database Connection**: Link the Vercel server with a Postgres database hosted on Vercel.
5. **Configure Database**: Insert the app icon URLs into the database as specified in the `create-app-icons-table.ts` schema.
6. **Virtual Environment Setup**: Run the following commands to set up the Python virtual environment:
   
   ```sh
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

7. **Environment Variable Setup**: Fill in the `VERCEL_DOMAIN` and `DEVICE_MODEL` in the `/script/crawler/.env` file.
8. **Script Permissions**: Ensure `/script/cron/run.sh` is executable by modifying its permissions.
9. **Cron Job**: Schedule a cron job to run `/script/cron/run.sh` at regular intervals to collect screen time data. (Note: This is essential as Apple does not facilitate real-time synchronization of screen time data).
 
## Current Limitations
A notable constraint, as previously highlighted, is Apple's lack of support for real-time synchronization of screen time data. Consequently, this can result in occasional omissions of screen time data.
