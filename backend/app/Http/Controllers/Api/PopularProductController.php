<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductInterestStat;
use Illuminate\Http\Request;

class PopularProductController extends Controller
{
    /**
     * ✅ Popular Products (PUBLIC)
     * GET /api/products/popular?limit=12
     */
    public function index(Request $request)
    {
        $limit = max(1, min((int) $request->query('limit', 12), 50));

        $rows = ProductInterestStat::with([
                // ✅ only columns that exist in your products table
                'product:id,title,price,compare_price,discount_type,discount_value,short_description,image'
            ])
            ->orderByDesc('total_score')
            ->limit($limit)
            ->get();

        return response()->json([
            'status' => 200,
            'data' => $rows,
        ]);
    }
}