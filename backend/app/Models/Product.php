<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $appends = ['image_url', 'final_price'];

    protected $fillable = [
        'title',
        'price',
        'compare_price',
        'description',
        'short_description',
        'image',
        'category_id',
        'brand_id',
        'qty',
        'sku',
        'barcode',
        'status',
        'is_featured',
        'discount_type',
        'discount_value',
    ];

    // ✅ FIX: Cloudinary URL (no asset path)
    public function getImageUrlAttribute()
    {
        return $this->image ?: '';
    }

    public function getFinalPriceAttribute()
    {
        $price = (float) $this->price;

        if (!$this->discount_type || !$this->discount_value) {
            return $price;
        }

        if ($this->discount_type === 'percent') {
            $off = ($price * (float) $this->discount_value) / 100;
            return max(0, $price - $off);
        }

        return max(0, $price - (float) $this->discount_value);
    }

    public function product_images()
    {
        return $this->hasMany(ProductImage::class);
    }

    public function product_sizes()
    {
        return $this->hasMany(ProductSize::class);
    }

    public function sizes()
    {
        return $this->belongsToMany(Size::class, 'product_sizes', 'product_id', 'size_id');
    }

    public function interestedUsers()
    {
        return $this->hasMany(\App\Models\UserProductInterest::class);
    }
}