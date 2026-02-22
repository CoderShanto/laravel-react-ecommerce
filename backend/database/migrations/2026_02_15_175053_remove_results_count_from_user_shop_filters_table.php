<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('user_shop_filters', function (Blueprint $table) {
            $table->dropColumn('results_count');
        });
    }

    public function down(): void
    {
        Schema::table('user_shop_filters', function (Blueprint $table) {
            $table->unsignedInteger('results_count')->default(0);
        });
    }
};
