<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserShopFilter extends Model
{
    protected $table = 'user_shop_filters';

    protected $fillable = [
        'user_id',
        'query',
        'category_ids',
        'category_names',
        'brand_ids',
        'brand_names',
        'min_price',
        'max_price',
        'results_found',
        'tracked_at',
    ];

    protected $casts = [
        'category_ids' => 'array',
        'category_names' => 'array',
        'brand_ids' => 'array',
        'brand_names' => 'array',
        'tracked_at' => 'datetime',
    ];
}
