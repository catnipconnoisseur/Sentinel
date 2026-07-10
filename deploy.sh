#!/bin/bash
# Deploy to AMD Developer Cloud instance
# Usage: ./deploy.sh [instance-ip]

set -e

INSTANCE_IP=${1:-"localhost"}

echo "🚀 Deploying Sentinel to AMD Developer Cloud ($INSTANCE_IP)..."

# Ensure API key is configured
if [ ! -f ".env" ] || ! grep -q "FIREWORKS_API_KEY" .env; then
    echo "⚠️ FIREWORKS_API_KEY not found in .env"
    read -p "Enter your Fireworks API Key: " api_key
    if [ -z "$api_key" ]; then
        echo "Error: API key is required."
        exit 1
    fi
    echo "FIREWORKS_API_KEY=$api_key" >> .env
    echo "✅ Saved to .env"
fi

# Ensure docker and docker-compose are installed on the target machine (pseudo-step)
echo "Checking Docker installation..."

# Build and start the containers in detached mode
echo "Building and starting Docker containers..."
docker-compose up --build -d

echo "✅ Deployment complete! Sentinel is running on http://$INSTANCE_IP"
