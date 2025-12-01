#!/bin/bash
# ONE-COMMAND FIX FOR 502 BAD GATEWAY
# Run this on your server: sudo bash FIX_NOW.sh

cd /opt/smokava && git pull origin main && sudo bash scripts/fix-502-bulletproof.sh

