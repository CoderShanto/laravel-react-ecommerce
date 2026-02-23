#!/usr/bin/env bash
set -e

php artisan config:cache || true
# IMPORTANT: do NOT cache routes while debugging deployment
# php artisan route:cache || true
php artisan view:cache || true

php-fpm -D
nginx -g "daemon off;"