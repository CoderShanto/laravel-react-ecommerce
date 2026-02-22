<?php

// app/Models/SearchTermStat.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SearchTermStat extends Model
{
    protected $fillable = [
        'term',
        'total_searches',
        'results_found_count',
        'no_results_count',
        'last_searched_at',
    ];

    protected $casts = [
        'last_searched_at' => 'datetime',
    ];
}

