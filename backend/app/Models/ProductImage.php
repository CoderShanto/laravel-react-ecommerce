<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductImage extends Model
{
    protected $appends = ['image_url'];

    // ✅ Cloudinary URL directly
    public function getImageUrlAttribute()
    {
        return $this->image ?: '';
    }
}