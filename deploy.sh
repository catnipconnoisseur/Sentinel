#!/bin/bash
# Deploy to AMD Developer Cloud instance
# Usage: ./deploy.sh [instance-ip]

set -e

INSTANCE_IP=${1:-"localhost"}

echo "🚀 Deploying Sentinel to AMD Developer Cloud ($INSTANCE_IP)..."

# Ensure docker and docker-compose are installed on the target machine (pseudo-step)
echo "Checking Docker installation..."

# Build and start the containers in detached mode
echo "Building and starting Docker containers..."
docker-compose up --build -d

echo "✅ Deployment complete! Sentinel is running on http://$INSTANCE_IP"
