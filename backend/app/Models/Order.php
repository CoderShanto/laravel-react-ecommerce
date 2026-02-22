<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'order_number',
        'user_id',
        'subtotal',
        'shipping',
        'discount',
        'tax',
        'grand_total',
        'payment_method',
        'payment_status',
        'status',
        'transaction_id',
        'name',
        'email',
        'mobile',
        'address',
        'area',
        'city',
        'district',
        'postal_code',
        'country',
        'courier_name',
        'tracking_number',
        'order_note',
        'admin_note',
        'delivered_at',
    ];

    public function items()
    {
        return $this->hasMany(OrderItem::class, 'order_id');
    }

    // ✅ used in recommendation query
    public function scopeSuccessful($q)
    {
        // set this EXACTLY to your real values
        return $q->whereIn('status', ['delivered', 'completed'])
                 ->orWhere('payment_status', 'paid');
    }
}