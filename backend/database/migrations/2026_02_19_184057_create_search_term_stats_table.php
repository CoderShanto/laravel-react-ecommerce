<?php

// database/migrations/xxxx_xx_xx_create_search_term_stats_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void {
    Schema::create('search_term_stats', function (Blueprint $table) {
      $table->id();
      $table->string('term')->unique();
      $table->unsignedBigInteger('total_searches')->default(0);
      $table->unsignedBigInteger('results_found_count')->default(0); // optional
      $table->unsignedBigInteger('no_results_count')->default(0);    // optional
      $table->timestamp('last_searched_at')->nullable();
      $table->timestamps();
      $table->index('total_searches');
    });
  }

  public function down(): void {
    Schema::dropIfExists('search_term_stats');
  }
};