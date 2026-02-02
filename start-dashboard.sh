#!/bin/bash
# Leon Dashboard wrapper script

# Export environment variables for Next.js
export NODE_ENV=production
export NEXTAUTH_URL=https://18.221.219.255
export NEXTAUTH_SECRET=5a46bb2abb160283153d55a21df0ea72a56425ff3d2a4a8db796b5b7d35fd6e7

# OpenClaw Gateway (internal, keep loopback)
export OPENCLAW_GATEWAY_URL=http://127.0.0.1:18789
export OPENCLAW_GATEWAY_TOKEN=ef4985704cebcd47a70b934208ac4c6b18eda78e7e5f06e8

# Start Next.js with public binding
# Dashboard will be protected by oauth2-proxy running on port 4180
# Next.js binds to all interfaces for proxy to reach
cd /home/openclaw/.openclaw/workspace/repos/codesidh/Leon-dashboard
exec npx next start --port 3100 --hostname 0.0.0.0
