<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('user_search_terms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('term', 150);
            $table->unsignedInteger('searches_count')->default(1);
            $table->timestamp('last_searched_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'term']);
            $table->index(['user_id', 'searches_count']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_search_terms');
    }
};
