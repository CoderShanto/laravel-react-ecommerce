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
    Schema::table('user_search_terms', function (Blueprint $table) {
        $table->boolean('results_found')->default(true)->after('term');
        $table->unsignedInteger('results_count')->default(0)->after('results_found'); // optional but useful
    });
}

public function down(): void
{
    Schema::table('user_search_terms', function (Blueprint $table) {
        $table->dropColumn(['results_found', 'results_count']);
    });
}

};
