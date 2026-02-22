<?php

namespace App\Http\Controllers\front;

use App\Http\Controllers\Controller;
use App\Models\OrderItem;
use App\Models\ReturnRequest;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ReturnRequestController extends Controller
{
    public function index(Request $request)
    {
        $returns = ReturnRequest::with(['orderItem'])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->paginate(20);

        return response()->json($returns);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'order_item_id' => ['required', 'integer', 'exists:order_items,id'],
            'qty' => ['required', 'integer', 'min:1'],
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $orderItem = OrderItem::with('order')->findOrFail($data['order_item_id']);

        // Ensure order belongs to this user
        if ((int)$orderItem->order->user_id !== (int)$request->user()->id) {
            abort(403, 'This order item does not belong to you.');
        }

        // ✅ IMPORTANT: In your DB screenshot status is "pending".
        // Return should be allowed only when delivered/completed.
        // Change this to your real delivered status (example: delivered)
       if ($orderItem->order->status !== 'delivered') {
    throw ValidationException::withMessages([
        'order_item_id' => 'Item must be delivered before return.',
    ]);
}

        $purchasedQty = (int)$orderItem->qty;
        $alreadyReturned = (int)$orderItem->returned_qty;
        $available = max(0, $purchasedQty - $alreadyReturned);

        if ($data['qty'] > $available) {
            throw ValidationException::withMessages([
                'qty' => "You can return maximum {$available} quantity.",
            ]);
        }

        $rr = ReturnRequest::create([
            'order_id' => $orderItem->order_id,
            'order_item_id' => $orderItem->id,
            'user_id' => $request->user()->id,
            'qty' => $data['qty'],
            'reason' => $data['reason'] ?? null,
            'status' => 'requested',
        ]);

        return response()->json([
            'message' => 'Return request submitted successfully.',
            'return_request' => $rr,
        ], 201);
    }
}