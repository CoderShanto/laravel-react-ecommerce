<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;
use App\Models\Shipping;
use Illuminate\Http\Request;

class AdminShippingController extends Controller
{
    // GET /api/admin/shipping
    public function show(Request $request)
    {
        // ✅ if you want admin-only protection, keep this check
        $admin = $request->user();
        if (!$admin || $admin->role !== 'admin') {
            return response()->json(['status' => 403, 'message' => 'Forbidden'], 403);
        }

        $shipping = Shipping::where('is_active', 1)->orderBy('id', 'desc')->first();

        return response()->json([
            'status' => 200,
            'data' => $shipping,                 // may be null if no row
            'charge' => (int) ($shipping->charge ?? 0), // helpful for frontend
        ]);
    }

    // PUT /api/admin/shipping
    public function update(Request $request)
    {
        $admin = $request->user();
        if (!$admin || $admin->role !== 'admin') {
            return response()->json(['status' => 403, 'message' => 'Forbidden'], 403);
        }

        $request->validate([
            'charge' => 'required|integer|min:0'
        ]);

        // ✅ deactivate old
        Shipping::where('is_active', 1)->update(['is_active' => 0]);

        // ✅ create new active
        $shipping = Shipping::create([
            'charge' => (int) $request->charge,
            'is_active' => 1
        ]);

        return response()->json([
            'status' => 200,
            'message' => 'Shipping updated successfully',
            'data' => $shipping,
            'charge' => (int) $shipping->charge
        ]);
    }
}
