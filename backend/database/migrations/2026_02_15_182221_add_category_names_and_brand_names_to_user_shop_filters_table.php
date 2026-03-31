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
            if (!Schema::hasColumn('user_shop_filters', 'category_names')) {
                $table->json('category_names')->nullable()->after('category_ids');
            }

            if (!Schema::hasColumn('user_shop_filters', 'brand_names')) {
                $table->json('brand_names')->nullable()->after('brand_ids');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_shop_filters', function (Blueprint $table) {
            $columnsToDrop = [];

            if (Schema::hasColumn('user_shop_filters', 'category_names')) {
                $columnsToDrop[] = 'category_names';
            }

            if (Schema::hasColumn('user_shop_filters', 'brand_names')) {
                $columnsToDrop[] = 'brand_names';
            }

            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};