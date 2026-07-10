FROM python:3.9-slim

WORKDIR /app

# Install system dependencies (needed for compiling some python packages if any)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application, including the pre-generated data/ folder
COPY . .

# Ensure the app starts on port 8000
EXPOSE 8000

# Make entrypoint executable
RUN chmod +x /app/entrypoint.sh

# Start using entrypoint to bootstrap data
ENTRYPOINT ["/app/entrypoint.sh"]
