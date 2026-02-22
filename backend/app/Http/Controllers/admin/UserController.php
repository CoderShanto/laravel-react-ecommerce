<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    // GET: /api/admin/users
    public function index(Request $request)
    {
        $admin = $request->user();

        if (!$admin) {
            return response()->json([
                'status' => 401,
                'message' => 'Unauthenticated'
            ], 401);
        }

        // ✅ VERY IMPORTANT → only allow admin role
        if ($admin->role !== 'admin') {
            return response()->json([
                'status' => 403,
                'message' => 'Forbidden. Admin only.'
            ], 403);
        }

        // ✅ get only customers
        $users = User::select([
                'id',
                'name',
                'email',
                'mobile',
                'address',
                'area',
                'city',
                'district',
                'postal_code',
                'role',
                'created_at'
            ])
            ->where('role', 'customer')   // only customers
            ->orderBy('id', 'desc')
            ->paginate(5);               // ✅ 5 per page

        return response()->json([
            'status' => 200,
            'data' => $users->items(),
            'pagination' => [
                'current_page' => $users->currentPage(),
                'per_page'     => $users->perPage(),
                'total'        => $users->total(),
                'last_page'    => $users->lastPage(),
            ],
        ]);
    }

    // GET: /api/admin/users/{id}
    public function show(Request $request, $id)
    {
        $admin = $request->user();

        if (!$admin) {
            return response()->json([
                'status' => 401,
                'message' => 'Unauthenticated'
            ], 401);
        }

        if ($admin->role !== 'admin') {
            return response()->json([
                'status' => 403,
                'message' => 'Forbidden. Admin only.'
            ], 403);
        }

        $user = User::where('role', 'customer')
            ->where('id', $id)
            ->first();

        if (!$user) {
            return response()->json([
                'status' => 404,
                'message' => 'User not found'
            ], 404);
        }

        return response()->json([
            'status' => 200,
            'data' => $user
        ]);
    }
}
