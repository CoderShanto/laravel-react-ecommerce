<?php

namespace App\Http\Controllers\front;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Foundation\Bootstrap\RegisterFacades;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\UserProductInterest;
use Illuminate\Support\Facades\Schema;
use App\Models\Shipping;



class OrderController extends Controller
{
    //
  public function saveOrder(Request $request)
{
    $request->validate([
        'billing.name' => 'required',
        'billing.email' => 'required|email',
        'billing.mobile' => 'required',
        'billing.address' => 'required',
        'billing.city' => 'required',
        'payment_method' => 'required',
        'cart' => 'required|array|min:1'
    ]);

    DB::beginTransaction();

    try {
        $user = $request->user();
        if (!$user) {
            return response()->json(['status' => 401, 'message' => 'Unauthenticated'], 401);
        }

        // Generate order number
        $orderNumber = 'ORD-' . date('Ymd') . '-' . strtoupper(Str::random(5));

        $subtotal = 0;
        $discount = 0;
        // ✅ get latest active shipping charge from DB
        $shippingRow = Shipping::where('is_active', true)->latest()->first();
        $shipping = (int) ($shippingRow?->charge ?? 0);

        foreach ($request->cart as $item) {
            $subtotal += ($item['unit_price'] * $item['qty']);
        }

        $grandTotal = $subtotal + $shipping - $discount;

        // Create Order
        $order = Order::create([
            'order_number' => $orderNumber,
            'user_id' => $user->id,

            'subtotal' => $subtotal,
            'shipping' => $shipping,
            'discount' => $discount,
            'grand_total' => $grandTotal,

            'payment_method' => $request->payment_method,
            'payment_status' => 'pending',
            'status' => 'pending',

            'name' => $request->billing['name'],
            'email' => $request->billing['email'],
            'mobile' => $request->billing['mobile'],
            'address' => $request->billing['address'],
            'area' => $request->billing['area'] ?? null,
            'city' => $request->billing['city'],
            'district' => $request->billing['district'] ?? null,
            'postal_code' => $request->billing['postal_code'] ?? null,
            'country' => 'Bangladesh',
        ]);

        // ✅ collect total qty per product_id (important!)
        $purchaseQtyByProduct = [];

        // Create Order Items
        foreach ($request->cart as $item) {
            $product = Product::select('sku')->find($item['product_id']);

            $lineSubtotal = $item['unit_price'] * $item['qty'];
            $lineDiscount = 0;
            $lineTotal = $lineSubtotal - $lineDiscount;

            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $item['product_id'],
                'product_name' => $item['product_name'],
                'product_sku' => $product?->sku,
                'image_url' => $item['image_url'] ?? null,
                'size' => $item['size'] ?? null,

                'unit_price' => $item['unit_price'],
                'qty' => $item['qty'],

                'line_subtotal' => $lineSubtotal,
                'line_discount' => $lineDiscount,
                'line_total' => $lineTotal,

                'status' => 'pending'
            ]);

            // ✅ aggregate purchase qty per product
            $pid = (int) $item['product_id'];
            $q = (int) $item['qty'];
            $purchaseQtyByProduct[$pid] = ($purchaseQtyByProduct[$pid] ?? 0) + $q;
        }

        // ✅ UPDATE INTEREST: PURCHASE (after order items created)
        $hasPurchaseCount = Schema::hasColumn('user_product_interest', 'purchase_count');

        foreach ($purchaseQtyByProduct as $productId => $qty) {
            $row = UserProductInterest::firstOrCreate(
                ['user_id' => $user->id, 'product_id' => $productId],
                ['score' => 0]
            );

            // ✅ score: purchase weight = 50 * qty (change if you want)
            $row->increment('score', 50 * $qty);

            // ✅ if your table has purchase_count column, update it too
            if ($hasPurchaseCount) {
                $row->increment('purchase_count', $qty);
            }

            $row->update(['last_interacted_at' => now()]);
        }

        DB::commit();

        return response()->json([
            'status' => 200,
            'message' => 'Order placed successfully',
            'order_number' => $order->order_number
        ]);

    } catch (\Exception $e) {

        DB::rollBack();

        return response()->json([
            'status' => 500,
            'message' => 'Order failed',
            'error' => $e->getMessage()
        ], 500);
    }
}


public function showByOrderNumber($order_number)
{
    $order = Order::with('items')
        ->where('order_number', $order_number)
        ->first();

    if(!$order){
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

// GET /api/account/orders
public function index(Request $request)
{
    $orders = Order::query()
        ->where('user_id', $request->user()->id)
         ->with(['items:id,order_id,product_name'])
        ->select([
            'id',
            'order_number',
            'name',
            'email',
            'mobile',
            'city',
            'area',
            'postal_code',
            'country',
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

    // GET /api/account/orders/{id}
    public function show(Request $request, $id)
    {
        $order = Order::with('items')
            ->where('user_id', $request->user()->id)
            ->find($id);

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

      // PUT /api/account/orders/{id}
    // ✅ user can ONLY update order_note
    public function update(Request $request, $id)
    {
        $userId = Auth::id();

        $order = Order::where('user_id', $userId)->find($id);

        if (!$order) {
            return response()->json([
                'status' => 404,
                'message' => 'Order not found'
            ], 404);
        }

        // optional: stop editing if shipped/delivered
        if (in_array($order->status, ['shipped', 'delivered', 'cancelled'])) {
            return response()->json([
                'status' => 403,
                'message' => 'You cannot edit note after order is shipped/delivered/cancelled'
            ], 403);
        }

        $validated = $request->validate([
            'order_note' => 'nullable|string|max:1000',
        ]);

        $order->order_note = $validated['order_note'] ?? null;
        $order->save();

        return response()->json([
            'status' => 200,
            'message' => 'Note updated',
            'order' => $order
        ]);
    }

}