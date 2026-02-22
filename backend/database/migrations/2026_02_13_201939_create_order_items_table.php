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
        Schema::create('order_items', function (Blueprint $table) {
             $table->id();

    $table->foreignId('order_id')->constrained()->onDelete('cascade');

    // product snapshot
    $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
    $table->string('product_name');
    $table->string('product_sku')->nullable();
    $table->string('image_url')->nullable();

    // variant info
    $table->string('size')->nullable();

    // pricing
    $table->decimal('unit_price', 12, 2);
    $table->unsignedInteger('qty');

    $table->decimal('line_subtotal', 12, 2)->default(0);
    $table->decimal('line_discount', 12, 2)->default(0);
    $table->decimal('line_total', 12, 2)->default(0);

    // item status
    $table->enum('status', [
        'pending',
        'confirmed',
        'shipped',
        'delivered',
        'cancelled',
        'returned'
    ])->default('pending');

    // return/refund
    $table->unsignedInteger('returned_qty')->default(0);
    $table->text('return_reason')->nullable();
    $table->timestamp('returned_at')->nullable();

    $table->timestamps();

    $table->index(['order_id', 'product_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
