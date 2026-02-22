<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserSearchTerm extends Model
{
   protected $fillable = [
  'user_id',
  'term',
  'searches_count',
  'last_searched_at',
  'results_found',
  'results_count',
];


    protected $casts = [
        'last_searched_at' => 'datetime',
    ];
}
