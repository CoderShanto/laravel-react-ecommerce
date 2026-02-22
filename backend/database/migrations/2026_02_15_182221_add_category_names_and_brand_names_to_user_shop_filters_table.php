<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::table('user_shop_filters', function (Blueprint $table) {
        $table->json('category_names')->nullable()->after('category_ids');
        $table->json('brand_names')->nullable()->after('brand_ids');
    });
}

public function down(): void
{
    Schema::table('user_shop_filters', function (Blueprint $table) {
        $table->dropColumn(['category_names', 'brand_names']);
    });
}
};
