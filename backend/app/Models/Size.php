<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Size extends Model
{
        public function products()
    {
        return $this->belongsToMany(Product::class, 'product_sizes');
    }

}
