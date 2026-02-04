#!/bin/bash

# This script runs every time your Studio starts, from your home directory.

# Logs from previous runs can be found in ~/.lightning_studio/logs/

# List files under fast_load that need to load quickly on start (e.g. model checkpoints).
#
# ! fast_load
# <your file here>

# Check whether we need to write the initial config from
# /teamspace/studios/this_studio/initial_openclaw.json into /teamspace/studios/this_studio/.openclaw/openclaw.json

TARGET="/teamspace/studios/this_studio/.openclaw/openclaw.json"
SOURCE="/teamspace/studios/this_studio/initial_openclaw.json"

[ ! -f "$TARGET" ] && cp "$SOURCE" "$TARGET"

openclaw gateway --port 18789 --verbose