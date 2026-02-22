<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UserInsightsController extends Controller
{
    // GET /api/admin/users/{user}/insights
    public function show(Request $request, User $user)
    {
        // TODO: add admin middleware check (example below in routes)
        $topTerms = $user->searchTerms()
            ->orderByDesc('searches_count')
            ->limit(3)
            ->get(['term', 'searches_count', 'last_searched_at']);

        $topProducts = $user->productInterests()
            ->join('products', 'products.id', '=', 'user_product_interest.product_id')
            ->orderByDesc('user_product_interest.score')
            ->limit(3)
            ->get([
                'products.id',
                'products.name',
                'user_product_interest.score',
                'user_product_interest.last_interacted_at'
            ]);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'top_search_terms' => $topTerms,
            'top_products' => $topProducts,
        ]);
    }
}
