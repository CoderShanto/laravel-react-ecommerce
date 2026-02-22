<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Shipping;
use Illuminate\Support\Facades\Schema;

class ShippingPublicController extends Controller
{
    public function active()
    {
        // ✅ if table not found -> return 0 (prevents 500)
        $table = (new Shipping)->getTable();

        if (!Schema::hasTable($table)) {
            return response()->json([
                'status' => 200,
                'shipping' => 0,
                'note' => "Table '$table' not found"
            ]);
        }

        $row = Shipping::where('is_active', 1)->orderBy('id', 'desc')->first();

        return response()->json([
            'status' => 200,
            'shipping' => (int) ($row->charge ?? 0),
        ]);
    }
}
