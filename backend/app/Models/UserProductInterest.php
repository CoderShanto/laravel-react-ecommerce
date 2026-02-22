<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserProductInterest extends Model
{
    protected $table = 'user_product_interest';

    protected $fillable = [
  'user_id','product_id','score','last_interacted_at',
  'view_count','click_count','cart_count','purchase_count'
];


    protected $casts = [
        'last_interacted_at' => 'datetime',
    ];
    
    public function product()
{
    return $this->belongsTo(\App\Models\Product::class, 'product_id');
}
}
