<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    protected $fillable = [
        'order_id',
        'product_id',
        'product_name',
        'product_sku',
        'image_url',
        'size',
        'unit_price',
        'qty',
        'line_subtotal',
        'line_discount',
        'line_total',
        'status',
        'returned_qty',
        'return_reason',
        'returned_at',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
    public function returnRequests()
{
    return $this->hasMany(\App\Models\ReturnRequest::class);
}
}