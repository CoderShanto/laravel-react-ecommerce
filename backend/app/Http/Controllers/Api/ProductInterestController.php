<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserProductInterest;
use App\Models\ProductInterestStat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProductInterestController extends Controller
{
    public function store(Request $request, $productId)
    {
        $request->validate([
            'action' => 'required|string|in:view,cart,purchase',
        ]);

        $action = $request->action;

        // ✅ weights
        $weights = [
            'view' => 1,
            'click' => 1,
            'cart' => 3,
            'purchase' => 8,
        ];
        $scoreAdd = $weights[$action] ?? 1;

        // ✅ 1) per-user table (only if logged in)
        if (Auth::check()) {
            $userId = Auth::id();

            $row = UserProductInterest::firstOrNew([
                'user_id' => $userId,
                'product_id' => $productId,
            ]);

            if (!$row->exists) {
        
                $row->cart_count = 0;
                $row->purchase_count = 0;
                $row->score = 0;
            }

            
            if ($action === 'cart') $row->cart_count += 1;
            if ($action === 'purchase') $row->purchase_count += 1;

            // ✅ recompute score from user counters
            $row->score =
                ($row->click_count * 1) +
                ($row->cart_count * 3) +
                ($row->purchase_count * 8);

            $row->last_interacted_at = now();
            $row->save();
        }

        // ✅ 2) global stats (always)
        $stat = ProductInterestStat::firstOrNew([
            'product_id' => $productId
        ]);

        if (!$stat->exists) {
            
            $stat->total_cart = 0;
            $stat->total_purchase = 0;
            $stat->total_score = 0;
        }

        // ✅ IMPORTANT: update global counters
     
        if ($action === 'cart') $stat->total_cart += 1;
        if ($action === 'purchase') $stat->total_purchase += 1;

        // ✅ score always increases for any allowed action (view/click/cart/purchase)
        $stat->total_score += $scoreAdd;
        $stat->last_interacted_at = now();
        $stat->save();

        return response()->json([
            'status' => 200,
            'message' => 'interest tracked',
            'product_id' => (int) $productId,
            'action' => $action,
            'score_added' => $scoreAdd,
            'global_score' => $stat->total_score,
        ]);
    }
}