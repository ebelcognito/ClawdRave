#!/bin/bash

# This script runs every time your Studio starts, from your home directory.

# Logs from previous runs can be found in ~/.lightning_studio/logs/

# List files under fast_load that need to load quickly on start (e.g. model checkpoints).
#
# ! fast_load
# <your file here>

# Check whether we need to write the initial config from
# /teamspace/studios/this_studio/initial_openclaw.json into /teamspace/studios/this_studio/.openclaw/openclaw.json

TARGET_DIR="/teamspace/studios/this_studio/.openclaw"
TARGET_FILE="${TARGET_DIR}/openclaw.json"
SOURCE_FILE="/teamspace/studios/this_studio/initial_openclaw.json"

if [ ! -f "$TARGET_FILE" ]; then
    mkdir -p "$TARGET_DIR"
    cp "$SOURCE_FILE" "$TARGET_FILE"
fi

openclaw gateway --port 18789 --verbose