<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\UserProductInterest;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class RecommendationController extends Controller
{
    /**
     * GET /api/recommendations?limit=12
     * Returns products the CURRENT USER already interacted with,
     * ranked by interest score + purchase qty.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $limit = max(1, min((int) $request->query('limit', 12), 50));

        if (!$user) {
            return response()->json([
                'status' => 401,
                'message' => 'Unauthorized',
            ], 401);
        }

        $baseUrl = config('app.url') ?: 'http://localhost:8000';

        // ---------------------------------------------
        // 1) Get interest rows for this user
        // ---------------------------------------------
        $interestRows = UserProductInterest::query()
            ->where('user_id', $user->id)
            ->whereNotNull('product_id')
            ->select([
                'product_id',
                'click_count',
                'cart_count',
                'purchase_count',
                'score',
                'last_interacted_at',
            ])
            ->orderByDesc('score')
            ->limit(300) // allow enough before final ranking
            ->get();

        // ---------------------------------------------
        // 2) Get purchased qty per product for this user
        // ---------------------------------------------
        $purchaseQtyMap = OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('orders.user_id', $user->id)
            ->whereNotNull('order_items.product_id')
            ->groupBy('order_items.product_id')
            ->select([
                'order_items.product_id',
                DB::raw('SUM(order_items.qty) as total_qty'),
                DB::raw('COUNT(DISTINCT order_items.order_id) as orders_count'),
            ])
            ->pluck('total_qty', 'product_id'); // product_id => total_qty

        // If user has no interest + no purchases -> fallback (latest or popular)
        if ($interestRows->isEmpty() && $purchaseQtyMap->isEmpty()) {
            $fallback = Product::query()
                ->orderByDesc('id')
                ->limit($limit)
                ->get($this->productCols());

            return response()->json([
                'status' => 200,
                'type' => 'cold_start_latest',
                'count' => $fallback->count(),
                'data' => $this->decorate($fallback, $baseUrl),
            ]);
        }

        // ---------------------------------------------
        // 3) Build a combined candidate list
        //    (includes BOTH interest products + purchased products)
        // ---------------------------------------------
        $candidateIds = collect($interestRows->pluck('product_id'))
            ->merge($purchaseQtyMap->keys())
            ->unique()
            ->values();

        // Load product data
        $products = Product::query()
            ->whereIn('id', $candidateIds)
            ->get($this->productCols());

        // Create quick map for interest score
        $interestScoreMap = $interestRows->keyBy('product_id');

        // ---------------------------------------------
        // 4) Rank products for THIS user
        // ---------------------------------------------
        $ranked = $products->map(function ($p) use ($interestScoreMap, $purchaseQtyMap) {
            $interest = $interestScoreMap->get($p->id);
            $interestScore = (int) ($interest->score ?? 0);

            $purchaseQty = (int) ($purchaseQtyMap[$p->id] ?? 0);

            // ✅ Ranking formula (edit weights anytime)
            // Purchase is stronger, so *20
            $finalRank = $interestScore + ($purchaseQty * 20);

            return [
                'product' => $p,
                'final_rank' => $finalRank,
                'interest_score' => $interestScore,
                'purchase_qty' => $purchaseQty,
            ];
        })
        ->sortByDesc('final_rank')
        ->take($limit)
        ->values();

        // ---------------------------------------------
        // 5) Return decorated products + debug (optional)
        // ---------------------------------------------
        $data = $ranked->map(function ($row) use ($baseUrl) {
            $p = $row['product'];

            $price = (float) ($p->price ?? 0);
            $final = $this->finalPrice($price, $p->discount_type, $p->discount_value);

            return [
                'id' => (int) $p->id,
                'title' => $p->title,
                'price' => $price,
                'compare_price' => $p->compare_price !== null ? (float) $p->compare_price : null,
                'discount_type' => $p->discount_type,
                'discount_value' => $p->discount_value !== null ? (float) $p->discount_value : null,
                'short_description' => $p->short_description,
                'image' => $p->image,
                'image_url' => $p->image ? ($baseUrl . '/uploads/products/small/' . $p->image) : null,
                'final_price' => $final,

                // ✅ helpful debug per user (you can remove later)
                'my_interest_score' => $row['interest_score'],
                'my_purchase_qty' => $row['purchase_qty'],
                'my_rank_score' => $row['final_rank'],
            ];
        });

        return response()->json([
            'status' => 200,
            'type' => 'user_history_based',
            'count' => $data->count(),
            'data' => $data,
        ]);
    }

    private function productCols(): array
    {
        return [
            'id',
            'title',
            'price',
            'compare_price',
            'discount_type',
            'discount_value',
            'short_description',
            'image',
        ];
    }

    private function decorate($products, string $baseUrl)
    {
        return $products->map(function ($p) use ($baseUrl) {
            $price = (float) ($p->price ?? 0);
            $final = $this->finalPrice($price, $p->discount_type, $p->discount_value);

            return [
                'id' => (int) $p->id,
                'title' => $p->title,
                'price' => $price,
                'compare_price' => $p->compare_price !== null ? (float) $p->compare_price : null,
                'discount_type' => $p->discount_type,
                'discount_value' => $p->discount_value !== null ? (float) $p->discount_value : null,
                'short_description' => $p->short_description,
                'image' => $p->image,
                'image_url' => $p->image ? ($baseUrl . '/uploads/products/small/' . $p->image) : null,
                'final_price' => $final,
            ];
        })->values();
    }

    private function finalPrice(float $price, $discountType, $discountValue): float
    {
        $discountValue = (float) ($discountValue ?? 0);
        if ($price <= 0) return 0;

        if ($discountValue > 0 && $discountType === 'percent') {
            return max(0, round($price - ($price * ($discountValue / 100)), 2));
        }

        if ($discountValue > 0 && $discountType === 'fixed') {
            return max(0, round($price - $discountValue, 2));
        }

        return round($price, 2);
    }
}