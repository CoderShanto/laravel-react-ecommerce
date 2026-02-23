#!/usr/bin/env bash
set -e

# ✅ create upload folders if missing
mkdir -p /var/www/html/public/uploads/temp
mkdir -p /var/www/html/public/uploads/products/small
mkdir -p /var/www/html/storage/app/public

# ✅ fix permissions for Laravel + uploads
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/public/uploads
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/public/uploads

# cache (optional)
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

php-fpm -D
nginx -g "daemon off;"