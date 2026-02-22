<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('user_product_interest', function (Blueprint $table) {
            $table->unsignedInteger('view_count')->default(0)->after('product_id');
            $table->unsignedInteger('click_count')->default(0)->after('view_count');
            $table->unsignedInteger('cart_count')->default(0)->after('click_count');
            $table->unsignedInteger('purchase_count')->default(0)->after('cart_count');
        });
    }

    public function down(): void
    {
        Schema::table('user_product_interest', function (Blueprint $table) {
            $table->dropColumn(['view_count', 'click_count', 'cart_count', 'purchase_count']);
        });
    }
};
