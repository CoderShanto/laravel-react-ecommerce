<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Shipping;


class OrderController extends Controller
{
    // GET: /api/admin/orders
    public function index(Request $request)
    {
        $orders = Order::query()
            ->select([
                'id',
                'order_number',
                'user_id',
                'name',
                'email',
                'grand_total',
                'payment_method',
                'payment_status',
                'status',
                'created_at',
            ])
            ->latest()
            ->paginate(20);

        return response()->json([
            'status' => 200,
            'orders' => $orders
        ]);
    }

    // GET: /api/admin/orders/{id} (optional)
    public function show($id)
    {
        $order = Order::with('items')->find($id);

        if (!$order) {
            return response()->json([
                'status' => 404,
                'message' => 'Order not found'
            ], 404);
        }

        return response()->json([
            'status' => 200,
            'order' => $order
        ]);
    }

    public function update(Request $request, $id)
{
    $order = Order::find($id);

    if (!$order) {
        return response()->json([
            'status' => 404,
            'message' => 'Order not found'
        ], 404);
    }

    $validated = $request->validate([
        'status' => 'required|string|in:pending,processing,shipped,delivered,cancelled,returned',
        'payment_status' => 'required|string|in:pending,paid,failed,refunded',

        'courier_name' => 'nullable|string|max:255',
        'tracking_number' => 'nullable|string|max:255',
        'order_note' => 'nullable|string',
        'admin_note' => 'nullable|string',

        // accept string and parse manually
        'delivered_at' => 'nullable',
    ]);

    $order->status = $validated['status'];
    $order->payment_status = $validated['payment_status'];
    $order->courier_name = $validated['courier_name'] ?? null;
    $order->tracking_number = $validated['tracking_number'] ?? null;
    $order->order_note = $validated['order_note'] ?? null;
    $order->admin_note = $validated['admin_note'] ?? null;

    // ✅ safest parse
    if (!empty($validated['delivered_at'])) {
        $order->delivered_at = Carbon::parse($validated['delivered_at'])->format('Y-m-d H:i:s');
    } else {
        $order->delivered_at = null;
    }

    $order->save();

    return response()->json([
        'status' => 200,
        'message' => 'Order updated successfully',
        'order' => $order->fresh()->load('items')
    ]);
}




    public function destroy($id)
{
    DB::beginTransaction();

    try {
        $order = Order::findOrFail($id);

        // delete order items first (if no cascade)
        $order->items()->delete();

        // delete order
        $order->delete();

        DB::commit();

        return response()->json([
            'status' => 200,
            'message' => 'Order deleted successfully'
        ]);
    } catch (\Exception $e) {
        DB::rollBack();

        return response()->json([
            'status' => 500,
            'message' => 'Delete failed',
            'error' => $e->getMessage()
        ], 500);
    }
}

}
