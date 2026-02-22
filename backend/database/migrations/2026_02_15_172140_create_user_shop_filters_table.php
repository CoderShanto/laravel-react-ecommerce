<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('user_shop_filters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

            // what user did on shop page
            $table->string('query')->nullable();                 // search text in box
            $table->json('category_ids')->nullable();  
            $table->json('category_names')->nullable();          // [1,2]
            $table->json('brand_ids')->nullable(); 
            $table->json('brand_names')->nullable();              // [3,4]
            $table->unsignedInteger('min_price')->nullable();
            $table->unsignedInteger('max_price')->nullable();

            // analytics
            $table->boolean('results_found')->default(false);
            $table->unsignedInteger('results_count')->default(0);

            $table->timestamp('tracked_at')->useCurrent();
            $table->timestamps();

            $table->index(['user_id', 'tracked_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_shop_filters');
    }
};
