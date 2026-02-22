<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductInterestStat extends Model
{
    protected $fillable = [
        'product_id',
        'total_clicks',
        'total_cart',
        'total_purchase',
        'total_score',
        'last_interacted_at',
    ];

    protected $casts = [
        'last_interacted_at' => 'datetime',
    ];

   public function product()
{
    return $this->belongsTo(\App\Models\Product::class, 'product_id');
}
}