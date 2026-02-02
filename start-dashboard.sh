#!/bin/bash
# Leon Dashboard wrapper script

# Export environment variables for NextAuth
export NODE_ENV=production
export NEXTAUTH_URL=https://18.221.219.255
export NEXTAUTH_SECRET=changeme-in-production-use-openssl-rand-hex-32
export GITHUB_ID=your-github-client-id
export GITHUB_SECRET=your-github-client-secret
export GOOGLE_ID=your-google-client-id
export GOOGLE_SECRET=your-google-client-secret

# OpenClaw Gateway (internal, keep loopback)
export OPENCLAW_GATEWAY_URL=http://127.0.0.1:18789
export OPENCLAW_GATEWAY_TOKEN=ef4985704cebcd47a70b934208ac4c6b18eda78e7e5f06e8

# Start Next.js with public binding
cd /home/openclaw/.openclaw/workspace/repos/codesidh/Leon-dashboard
exec npx next start --port 3100 --hostname 0.0.0.0
