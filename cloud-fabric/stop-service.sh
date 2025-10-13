#!/bin/bash

# Stop Cloud Fabric service running on port 3000

echo "🛑 Stopping Cloud Fabric service..."

# Find and kill any process using port 3000
PID=$(lsof -ti:3000)

if [ -z "$PID" ]; then
    echo "✅ No service running on port 3000"
else
    echo "   Found process: $PID"
    kill -9 $PID 2>/dev/null
    sleep 1

    # Verify it's stopped
    if lsof -i:3000 > /dev/null 2>&1; then
        echo "❌ Failed to stop service"
        exit 1
    else
        echo "✅ Service stopped successfully"
    fi
fi
