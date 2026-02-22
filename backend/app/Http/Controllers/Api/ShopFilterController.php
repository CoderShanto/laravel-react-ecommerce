<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserShopFilter;
use App\Models\Category;
use App\Models\Brand;
use Illuminate\Http\Request;

class ShopFilterController extends Controller
{
    // POST /api/shop/track-filters
    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user) return response()->json(['message' => 'Unauthenticated'], 401);

        $validated = $request->validate([
            'query' => 'nullable|string|max:255',
            'category_ids' => 'nullable|array',
            'category_ids.*' => 'integer|exists:categories,id',
            'brand_ids' => 'nullable|array',
            'brand_ids.*' => 'integer|exists:brands,id',
            'min_price' => 'nullable|integer|min:0',
            'max_price' => 'nullable|integer|min:0',
            'results_found' => 'nullable|boolean',
        ]);

        $categoryIds = $validated['category_ids'] ?? [];
        $brandIds = $validated['brand_ids'] ?? [];

        // ✅ convert ids -> names
        $categoryNames = Category::whereIn('id', $categoryIds)->pluck('name')->toArray();
        $brandNames = Brand::whereIn('id', $brandIds)->pluck('name')->toArray();

        $row = UserShopFilter::create([
            'user_id' => $user->id,
            'query' => $validated['query'] ?? null,

            'category_ids' => $categoryIds,
            'category_names' => $categoryNames,

            'brand_ids' => $brandIds,
            'brand_names' => $brandNames,

            'min_price' => $validated['min_price'] ?? null,
            'max_price' => $validated['max_price'] ?? null,

            'results_found' => $validated['results_found'] ?? null,
            'tracked_at' => now(),
        ]);

        return response()->json([
            'status' => 200,
            'message' => 'Filters tracked',
            'data' => $row,
        ]);
    }
}
