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
        Schema::create('orders', function (Blueprint $table) {
           $table->id();

    $table->string('order_number')->unique(); // Public order ID like ORD-2025-0001

    $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');

    // Amounts
    $table->decimal('subtotal', 12, 2);
    $table->decimal('shipping', 12, 2)->default(0);
    $table->decimal('discount', 12, 2)->default(0);
    $table->decimal('grand_total', 12, 2);

    // Payment
    $table->enum('payment_method', ['bkash', 'nagad', 'cod', 'card'])->default('cod');
    $table->enum('payment_status', ['pending', 'paid', 'failed', 'refunded'])->default('pending');
    $table->string('transaction_id')->nullable(); // bKash/Nagad trxID

    // Order Status
    $table->enum('status', [
        'pending',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
        'returned'
    ])->default('pending');

    // Shipping / Billing Info
    $table->string('name');
    $table->string('email');
    $table->string('mobile');
    $table->text('address');
    $table->string('area')->nullable();   // Dhanmondi, Mirpur
    $table->string('city');
    $table->string('district')->nullable(); // BD useful
    $table->string('postal_code')->nullable();
    $table->string('country')->default('Bangladesh');

    // Courier info (Future upgrade)
    $table->string('courier_name')->nullable(); // Pathao / RedX
    $table->string('tracking_number')->nullable();

    // Notes
    $table->text('order_note')->nullable();
    $table->text('admin_note')->nullable();

    $table->timestamp('delivered_at')->nullable();
    $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
