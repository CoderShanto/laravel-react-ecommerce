<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_interest_stats', function (Blueprint $table) {
            $table->dropColumn('total_clicks');
        });
    }

    public function down(): void
    {
        Schema::table('product_interest_stats', function (Blueprint $table) {
            $table->unsignedInteger('total_clicks')->default(0)->after('product_id');
        });
    }
};