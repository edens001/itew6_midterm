# Dockerfile for CCS Profiling System
# Vue.js Frontend + PHP Backend API

# Stage 1: Build Vue.js Frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy frontend package files
COPY frontend/package*.json ./
COPY frontend/package-lock.json* ./

# Install dependencies (run as root in alpine)
RUN npm install --legacy-peer-deps

# Copy frontend source code
COPY frontend/ ./

# Fix: Use npm directly without npx and ensure proper permissions
RUN chmod -R 755 node_modules/.bin/

# Build Vue.js app (use npm run directly)
RUN npm run build

# Verify build output exists
RUN test -d dist && echo "✅ Build successful" || (echo "❌ Build failed - dist folder not found" && exit 1)

# List dist contents for debugging
RUN ls -la dist/

# Stage 2: Production Image with PHP/Apache
FROM php:8.2-apache

# Install system dependencies and SSL support for TiDB Cloud
RUN apt-get update && \
    apt-get install -y \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    ca-certificates \
    libssl-dev \
    sudo \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && update-ca-certificates

# Install PHP extensions (including SSL support)
RUN docker-php-ext-install \
    mysqli \
    pdo \
    pdo_mysql \
    mbstring \
    bcmath \
    gd

# Enable Apache modules
RUN a2enmod rewrite headers expires

# Copy backend files
COPY backend/ /var/www/html/backend/

# Copy built Vue.js frontend from builder stage
COPY --from=frontend-builder /app/dist /var/www/html/

# Create necessary upload directories
RUN mkdir -p /var/www/html/backend/api/uploads/profile_pictures && \
    chmod -R 755 /var/www/html/backend/api/uploads

# Set proper permissions
RUN chown -R www-data:www-data /var/www/html && \
    chmod -R 755 /var/www/html && \
    find /var/www/html -type d -exec chmod 755 {} \;

# Create .htaccess for root (Vue.js SPA routing)
RUN cat > /var/www/html/.htaccess << 'EOF'
<IfModule mod_negotiation.c>
    Options -MultiViews
</IfModule>

<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Handle Authorization Header
    RewriteCond %{HTTP:Authorization} .
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
    
    # Redirect Trailing Slashes If Not A Folder...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} (.+)/$
    RewriteRule ^ %1 [L,R=301]
    
    # API requests go to PHP backend
    RewriteRule ^backend/api/(.*)$ backend/api/index.php [QSA,L]
    
    # Send all other requests to Vue's index.html
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^ index.html [L]
</IfModule>

# Disable directory browsing
Options -Indexes
EOF

# Create .htaccess for backend API
RUN cat > /var/www/html/backend/api/.htaccess << 'EOF'
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /backend/api/
    
    # Handle Authorization Header
    RewriteCond %{HTTP:Authorization} .
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
    
    # Handle CORS
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"
    
    # Handle OPTIONS method for CORS preflight
    RewriteCond %{REQUEST_METHOD} OPTIONS
    RewriteRule ^(.*)$ $1 [R=200,L]
    
    # Route all API requests to index.php
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ index.php [QSA,L]
</IfModule>

# Disable directory browsing for API
Options -Indexes
EOF

# Configure Apache virtual host
RUN cat > /etc/apache2/sites-available/000-default.conf << 'EOF'
<VirtualHost *:80>
    ServerAdmin webmaster@localhost
    DocumentRoot /var/www/html
    
    <Directory /var/www/html>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        DirectoryIndex index.html index.php
    </Directory>
    
    <Directory /var/www/html/backend/api>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        DirectoryIndex index.php
    </Directory>
    
    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
EOF

# PHP configuration for file uploads and TiDB Cloud
RUN echo "upload_max_filesize = 20M" > /usr/local/etc/php/conf.d/uploads.ini && \
    echo "post_max_size = 20M" >> /usr/local/etc/php/conf.d/uploads.ini && \
    echo "max_execution_time = 300" >> /usr/local/etc/php/conf.d/uploads.ini && \
    echo "memory_limit = 256M" >> /usr/local/etc/php/conf.d/uploads.ini && \
    echo "mysqli.allow_local_infile = on" >> /usr/local/etc/php/conf.d/uploads.ini

# PHP configuration for SSL (TiDB Cloud requirement)
RUN echo "mysqli.default_socket =" > /usr/local/etc/php/conf.d/tidb.ini && \
    echo "pdo_mysql.default_socket =" >> /usr/local/etc/php/conf.d/tidb.ini

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Expose port
EXPOSE 80

# Start Apache
CMD ["apache2-foreground"]