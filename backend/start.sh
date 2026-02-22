#!/usr/bin/env bash
set -e

# Cache config (optional but good)
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

# Run migrations automatically (optional)
php artisan migrate --force || true

# Start php-fpm in background
php-fpm -D

# Start nginx
nginx -g "daemon off;"