<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\UserSearchTerm;
use App\Models\SearchTermStat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SearchController extends Controller
{
    // POST /api/search/track
  public function track(Request $request)
{
    $request->validate([
        'term' => 'required|string|max:150',
        'results_found' => 'nullable|boolean',
        'results_count' => 'nullable|integer|min:0',
    ]);

    // ✅ keep your rule: only logged-in users can track history
    $user = $request->user();
    if (!$user) {
        return response()->json(['message' => 'Unauthenticated'], 401);
    }

    $term = trim(mb_strtolower($request->term));
    if ($term === '') {
        return response()->json(['message' => 'Invalid term'], 422);
    }

    // ✅ backend calculates results (recommended)
    $resultsCount = Product::where('title', 'like', "%{$term}%")->count();
    $resultsFound = $resultsCount > 0;

    /**
     * ✅ 1) USER HISTORY (deletable)
     */
    $row = UserSearchTerm::firstOrNew([
        'user_id' => $user->id,
        'term' => $term,
    ]);

    // initialize if new
    if (!$row->exists) {
        $row->searches_count = 0;
    }

    // ✅ increment ONCE
    $row->searches_count = (int) $row->searches_count + 1;
    $row->last_searched_at = now();
    $row->results_found = $resultsFound;
    $row->results_count = $resultsCount;
    $row->save();

    /**
     * ✅ 2) GLOBAL STATS (NOT deletable by user, used for trending/admin analytics)
     */
    $stat = SearchTermStat::firstOrNew(['term' => $term]);

    if (!$stat->exists) {
        $stat->total_searches = 0;
        $stat->results_found_count = 0;
        $stat->no_results_count = 0;
    }

    $stat->total_searches = (int) $stat->total_searches + 1;
    $stat->last_searched_at = now();

    if ($resultsFound) {
        $stat->results_found_count = (int) $stat->results_found_count + 1;
    } else {
        $stat->no_results_count = (int) $stat->no_results_count + 1;
    }

    $stat->save();

    return response()->json([
        'message' => 'tracked',
        'term' => $term,
        'searches_count' => $row->searches_count,
        'results_found' => $resultsFound ? 'yes' : 'no',
        'results_count' => $resultsCount,
    ]);
}


    // GET /api/search/suggestions?q=iphone
   public function suggestions(Request $request)
{
    $q = trim($request->query('q', ''));

    if ($q === '') {
        return response()->json([
            'mode' => 'normal',
            'suggestions' => [],
        ]);
    }

    $fallback = Product::query()
        ->where('title', 'like', "%{$q}%")
        ->orderBy('title')
        ->limit(10)
        ->get(['id', 'title'])
        ->map(fn($p) => ['id' => $p->id, 'name' => $p->title]);

    return response()->json([
        'mode' => 'normal',
        'suggestions' => $fallback,
    ]);
}

}
