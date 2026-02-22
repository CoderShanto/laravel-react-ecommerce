<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserSearchTerm;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\SearchTermStat;

class SearchInsightsController extends Controller
{
    /**
     * ✅ TRENDING SEARCHES (Public)
     * GET /api/search/trending?limit=12&days=30
     */
    public function trending(Request $request)
{
    $limit = max(1, min((int) $request->query('limit', 12), 50));
    $days  = max(1, min((int) $request->query('days', 30), 365));

    $from = now()->subDays($days);

    $rows = SearchTermStat::query()
        ->whereNotNull('term')
        ->where('term', '!=', '')
        ->where('last_searched_at', '>=', $from)
        ->orderByDesc('total_searches')
        ->limit($limit)
        ->get([
            'term',
            'total_searches',
            'last_searched_at',
        ]);

    return response()->json([
        'status' => 200,
        'data'   => $rows
    ]);
}

    /**
     * ✅ USER SEARCH HISTORY (Private)
     * GET /api/search/history?limit=20
     */
    public function history(Request $request)
    {
        $limit = max(1, min((int) $request->query('limit', 20), 100));

        $rows = UserSearchTerm::query()
            ->where('user_id', Auth::id())
            ->orderByDesc('last_searched_at')
            ->limit($limit)
            ->get([
                'id',
                'term',
                'searches_count',
                'last_searched_at',
                'results_found',
                'results_count',
            ]);

        return response()->json([
            'status' => 200,
            'data'   => $rows,
        ]);
    }

    /**
     * ✅ DELETE ONE HISTORY ITEM
     * DELETE /api/search/history/{id}
     */
    public function destroy($id)
    {
        $row = UserSearchTerm::query()
            ->where('id', $id)
            ->where('user_id', Auth::id())
            ->first();

        if (!$row) {
            return response()->json([
                'status'  => 404,
                'message' => 'Search history not found'
            ], 404);
        }

        $row->delete();

        return response()->json([
            'status'  => 200,
            'message' => 'Search history deleted successfully'
        ]);
    }

    /**
     * ✅ CLEAR ALL HISTORY
     * DELETE /api/search/history/clear
     */
    public function clear()
    {
        UserSearchTerm::where('user_id', Auth::id())->delete();

        return response()->json([
            'status'  => 200,
            'message' => 'All search history cleared successfully'
        ]);
    }
}
