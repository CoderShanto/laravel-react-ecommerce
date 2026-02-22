<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void {
    Schema::create('product_interest_stats', function (Blueprint $table) {
      $table->id();
      $table->unsignedBigInteger('product_id')->unique();

      $table->unsignedBigInteger('total_clicks')->default(0);
      $table->unsignedBigInteger('total_cart')->default(0);
      $table->unsignedBigInteger('total_purchase')->default(0);

      $table->unsignedBigInteger('total_score')->default(0);
      $table->timestamp('last_interacted_at')->nullable();

      $table->timestamps();

      $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
      $table->index('total_score');
    });
  }

  public function down(): void {
    Schema::dropIfExists('product_interest_stats');
  }
};

