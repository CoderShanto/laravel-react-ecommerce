<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductReview;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ProductReviewController extends Controller
{
    // ✅ Get reviews + avg rating + can_review
    public function index(Request $request,$productId)
    {
        // ✅ If Bearer token exists, try to authenticate user for this request
    if ($request->bearerToken()) {
        Auth::shouldUse('sanctum');
    }

        $reviews = ProductReview::with('user:id,name')
            ->where('product_id', $productId)
            ->where('status', 'approved')
            ->latest()
            ->get();

        $avg = ProductReview::where('product_id', $productId)
            ->where('status', 'approved')
            ->avg('rating');

        // ✅ if logged in => compute can_review
        $canReview = false;
        if (Auth::check()) {
            $userId = Auth::id();

            $hasBought = DB::table('orders')
                ->join('order_items', 'orders.id', '=', 'order_items.order_id')
                ->where('orders.user_id', $userId)
                ->where('order_items.product_id', $productId)
                // optional if you have status column:
                // ->where('orders.status', 'delivered')
                ->exists();

            // already reviewed?
            $alreadyReviewed = ProductReview::where('user_id', $userId)
                ->where('product_id', $productId)
                ->exists();

            $canReview = $hasBought && !$alreadyReviewed;
        }

        return response()->json([
            'status' => 200,
            'reviews' => $reviews,
            'avg_rating' => round($avg ?? 0, 1),
            'total_reviews' => $reviews->count(),
            'can_review' => $canReview,
        ]);
    }

    // ✅ Store review (ONLY verified buyer)
    public function store(Request $request, $productId)
    {
        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:2000',
        ]);

        $user = Auth::user();

        // ✅ must have bought the product
        $hasBought = DB::table('orders')
            ->join('order_items', 'orders.id', '=', 'order_items.order_id')
            ->where('orders.user_id', $user->id)
            ->where('order_items.product_id', $productId)
            // optional:
            // ->where('orders.status', 'delivered')
            ->exists();

        if (!$hasBought) {
            return response()->json([
                'status' => 403,
                'message' => 'Only verified buyers can review this product.'
            ], 403);
        }

        // ✅ prevent duplicate
        $alreadyReviewed = ProductReview::where('user_id', $user->id)
            ->where('product_id', $productId)
            ->exists();

        if ($alreadyReviewed) {
            return response()->json([
                'status' => 422,
                'message' => 'You already reviewed this product.'
            ], 422);
        }

        ProductReview::create([
            'user_id' => $user->id,
            'product_id' => $productId,
            'rating' => $request->rating,
            'comment' => $request->comment,
            'status' => 'approved', // or pending
        ]);

        return response()->json([
            'status' => 201,
            'message' => 'Review submitted successfully.'
        ], 201);
    }


    public function canReview($productId)
{
    $userId = Auth::id();

    $hasBought = DB::table('orders')
        ->join('order_items', 'orders.id', '=', 'order_items.order_id')
        ->where('orders.user_id', $userId)
        ->where('order_items.product_id', $productId)
        ->exists();

    $alreadyReviewed = ProductReview::where('user_id', $userId)
        ->where('product_id', $productId)
        ->exists();

    return response()->json([
        'status' => 200,
        'can_review' => ($hasBought && !$alreadyReviewed),
        'has_bought' => $hasBought,
        'already_reviewed' => $alreadyReviewed,
    ]);
}

}

