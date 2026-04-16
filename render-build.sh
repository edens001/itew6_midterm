#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting Render build process..."

# Update package lists
apt-get update

# Install PHP extensions for MySQL and SSL
apt-get install -y \
    php8.2-mysql \
    php8.2-pdo \
    php8.2-mysqli \
    ca-certificates

# Update SSL certificates
update-ca-certificates

# Set proper permissions for uploads directory
if [ -d "backend/api/uploads" ]; then
    chmod -R 755 backend/api/uploads
    echo "✅ Set permissions for uploads directory"
fi

# Create uploads directory if it doesn't exist
if [ ! -d "backend/api/uploads/profile_pictures" ]; then
    mkdir -p backend/api/uploads/profile_pictures
    chmod -R 755 backend/api/uploads/profile_pictures
    echo "✅ Created profile_pictures directory"
fi

# Copy environment file if it exists
if [ -f ".env" ]; then
    cp .env backend/.env
    echo "✅ Copied .env file to backend"
fi

echo "✅ Build completed successfully!"