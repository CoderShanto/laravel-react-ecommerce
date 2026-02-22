FROM php:8.2-fpm

RUN apt-get update && apt-get install -y \
    nginx git unzip curl libpq-dev libzip-dev \
    && docker-php-ext-install pdo pdo_pgsql zip \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY . .

RUN composer install --no-dev --optimize-autoloader
RUN chown -R www-data:www-data storage bootstrap/cache

# Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Start script
COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 8080
CMD ["/start.sh"]