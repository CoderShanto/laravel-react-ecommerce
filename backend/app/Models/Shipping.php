<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Shipping extends Model
{
    protected $table = 'shipping';

    protected $fillable = [
        'charge',
        'is_active'
    ];

    protected $casts = [
        'charge' => 'integer',
        'is_active' => 'boolean'
    ];
}
