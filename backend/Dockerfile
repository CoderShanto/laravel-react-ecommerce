FROM php:8.2-fpm

# System deps + nginx + PHP extensions (MySQL)
RUN apt-get update && apt-get install -y \
    nginx git unzip curl libzip-dev default-mysql-client \
    && docker-php-ext-install pdo pdo_mysql zip \
    && rm -rf /var/lib/apt/lists/*

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY . .

# PHP deps
RUN composer install --no-dev --optimize-autoloader

# Permissions (Laravel)
RUN chown -R www-data:www-data storage bootstrap/cache

# Make sure nginx uses OUR config as the default site
RUN rm -f /etc/nginx/sites-enabled/default
COPY nginx.conf /etc/nginx/sites-available/default
RUN ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

# Start script
COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 8080
CMD ["/start.sh"]