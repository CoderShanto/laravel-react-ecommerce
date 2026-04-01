<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AdminDashboardController extends Controller
{
    public function index(Request $request)
    {
        // range: 7 / 30 / 90
        $days = (int)($request->get('days', 30));
        if (!in_array($days, [7, 30, 90])) {
            $days = 30;
        }

        $from = Carbon::now()->subDays($days - 1)->startOfDay();
        $to   = Carbon::now()->endOfDay();

        // =========================
        // KPI Cards
        // =========================
        $ordersBase = DB::table('orders')->whereBetween('created_at', [$from, $to]);

        $totalOrders = (clone $ordersBase)->count();
        $revenue     = (clone $ordersBase)->sum('grand_total'); // gross revenue
        $discount    = (clone $ordersBase)->sum('discount');
        $shipping    = (clone $ordersBase)->sum('shipping');

        $paidOrders           = (clone $ordersBase)->where('payment_status', 'paid')->count();
        $pendingPaymentOrders = (clone $ordersBase)->where('payment_status', 'pending')->count();

        $deliveredOrders  = (clone $ordersBase)->where('status', 'delivered')->count();
        $processingOrders = (clone $ordersBase)->where('status', 'processing')->count();
        $cancelledOrders  = (clone $ordersBase)->where('status', 'cancelled')->count();

        // your users.role is "customer" (NOT "user")
        $totalCustomers = DB::table('users')->where('role', 'customer')->count();
        $newCustomers = DB::table('users')
            ->where('role', 'customer')
            ->whereBetween('created_at', [$from, $to])
            ->count();

        $totalProducts      = DB::table('products')->count();
        $lowStockProducts   = DB::table('products')->where('qty', '<=', 5)->count();
        $outOfStockProducts = DB::table('products')->where('qty', '<=', 0)->count();

        // Net sales = revenue - discount
        $netSales = $revenue - $discount;

        // =========================
        // Sales Over Time (Line Chart)
        // =========================
        $salesOverTime = DB::table('orders')
            ->selectRaw('DATE(created_at) as day, COUNT(*) as orders_count, SUM(grand_total) as revenue_sum')
            ->whereBetween('created_at', [$from, $to])
            ->groupBy('day')
            ->orderBy('day')
            ->get();

        // =========================
        // Orders by Status
        // =========================
        $ordersByStatus = DB::table('orders')
            ->selectRaw('status, COUNT(*) as total')
            ->whereBetween('created_at', [$from, $to])
            ->groupBy('status')
            ->get();

        // =========================
        // Top Selling Products
        // =========================
        $topProducts = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->selectRaw('order_items.product_id, order_items.product_name, SUM(order_items.qty) as total_qty, SUM(order_items.line_total) as total_revenue')
            ->whereBetween('orders.created_at', [$from, $to])
            ->groupBy('order_items.product_id', 'order_items.product_name')
            ->orderByDesc('total_qty')
            ->limit(8)
            ->get();

        // =========================
        // Category Revenue
        // =========================
        $categoryRevenue = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->join('categories', 'categories.id', '=', 'products.category_id')
            ->selectRaw('categories.name as category, SUM(order_items.line_total) as revenue')
            ->whereBetween('orders.created_at', [$from, $to])
            ->groupBy('categories.name')
            ->orderByDesc('revenue')
            ->limit(8)
            ->get();

        // =========================
        // Brand Revenue
        // =========================
        $brandRevenue = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->join('brands', 'brands.id', '=', 'products.brand_id')
            ->selectRaw('brands.name as brand, SUM(order_items.line_total) as revenue')
            ->whereBetween('orders.created_at', [$from, $to])
            ->groupBy('brands.name')
            ->orderByDesc('revenue')
            ->limit(8)
            ->get();

        // =========================
        // Trending Searches (global)
        // =========================
        $trendingSearches = DB::table('search_term_stats')
            ->select('term', 'total_searches', 'no_results_count', 'last_searched_at')
            ->orderByDesc('total_searches')
            ->limit(8)
            ->get();

        // =========================
        // Top Interest Products (global score)
        // =========================
        $topInterestProducts = DB::table('product_interest_stats')
            ->join('products', 'products.id', '=', 'product_interest_stats.product_id')
            ->select(
                'product_interest_stats.product_id',
                'products.title as product_name',
                'product_interest_stats.total_cart',
                'product_interest_stats.total_purchase',
                'product_interest_stats.total_score'
            )
            ->orderByDesc('product_interest_stats.total_score')
            ->limit(8)
            ->get();

        // =========================
        // Returns
        // =========================
        $returnCount = DB::table('return_requests')
            ->whereBetween('created_at', [$from, $to])
            ->count();

        $returnsByStatus = DB::table('return_requests')
            ->selectRaw('status, COUNT(*) as total')
            ->whereBetween('created_at', [$from, $to])
            ->groupBy('status')
            ->get();

        $refundLossEstimate = DB::table('return_requests')
            ->join('order_items', 'order_items.id', '=', 'return_requests.order_item_id')
            ->where('return_requests.status', 'refunded')
            ->whereBetween('return_requests.updated_at', [$from, $to])
            ->selectRaw('COALESCE(SUM(return_requests.qty * order_items.unit_price),0) as refund_loss')
            ->value('refund_loss');

        // =========================
        // Customer behavior analytics (user_product_interest)
        // =========================
        $topUserInterestProducts = DB::table('user_product_interest')
            ->join('products', 'products.id', '=', 'user_product_interest.product_id')
            ->selectRaw('user_product_interest.product_id, products.title as product_name, SUM(user_product_interest.score) as total_score, SUM(user_product_interest.click_count) as clicks, SUM(user_product_interest.cart_count) as carts, SUM(user_product_interest.purchase_count) as purchases')
            ->whereBetween('user_product_interest.updated_at', [$from, $to])
            ->groupBy('user_product_interest.product_id', 'products.title')
            ->orderByDesc('total_score')
            ->limit(8)
            ->get();

        // =========================
        // Top searched terms by users (user_search_terms)
        // =========================
        $topUserSearchTerms = DB::table('user_search_terms')
            ->selectRaw('term, SUM(searches_count) as total_searches, SUM(CASE WHEN results_found = true THEN 1 ELSE 0 END) as total_found, MAX(last_searched_at) as last_searched_at')
            ->whereBetween('updated_at', [$from, $to])
            ->groupBy('term')
            ->orderByDesc('total_searches')
            ->limit(8)
            ->get();

        // =========================
        // Most used filters / price ranges (user_shop_filters)
        // =========================
        $filterInsights = DB::table('user_shop_filters')
            ->selectRaw('
                COUNT(*) as total_filter_used,
                SUM(CASE WHEN query IS NOT NULL AND query <> "" THEN 1 ELSE 0 END) as used_query,
                SUM(CASE WHEN min_price IS NOT NULL THEN 1 ELSE 0 END) as used_min_price,
                SUM(CASE WHEN max_price IS NOT NULL THEN 1 ELSE 0 END) as used_max_price,
                AVG(CASE WHEN min_price IS NOT NULL THEN min_price ELSE NULL END) as avg_min_price,
                AVG(CASE WHEN max_price IS NOT NULL THEN max_price ELSE NULL END) as avg_max_price
            ')
            ->whereBetween('created_at', [$from, $to])
            ->first();

        // =========================
        // Customers by City (top)
        // =========================
        $customersByCity = DB::table('users')
            ->selectRaw('city, COUNT(*) as total')
            ->where('role', 'customer')
            ->whereNotNull('city')
            ->where('city', '<>', '')
            ->groupBy('city')
            ->orderByDesc('total')
            ->limit(8)
            ->get();

        // =========================
        // Low stock list
        // =========================
        $lowStockList = DB::table('products')
            ->select('id', 'title', 'qty', 'price', 'status')
            ->orderBy('qty')
            ->limit(8)
            ->get();

        return response()->json([
            'range_days' => $days,
            'kpis' => [
                'total_orders' => (int) $totalOrders,
                'revenue' => (float) $revenue,
                'net_sales' => (float) $netSales,
                'discount' => (float) $discount,
                'shipping' => (float) $shipping,
                'paid_orders' => (int) $paidOrders,
                'pending_payment_orders' => (int) $pendingPaymentOrders,
                'delivered_orders' => (int) $deliveredOrders,
                'processing_orders' => (int) $processingOrders,
                'cancelled_orders' => (int) $cancelledOrders,
                'total_customers' => (int) $totalCustomers,
                'new_customers' => (int) $newCustomers,
                'total_products' => (int) $totalProducts,
                'low_stock_products' => (int) $lowStockProducts,
                'out_of_stock_products' => (int) $outOfStockProducts,
                'returns_count' => (int) $returnCount,
                'refund_loss_estimate' => (float) $refundLossEstimate,
            ],
            'charts' => [
                'sales_over_time' => $salesOverTime,
                'orders_by_status' => $ordersByStatus,
                'top_products' => $topProducts,
                'category_revenue' => $categoryRevenue,
                'brand_revenue' => $brandRevenue,
                'trending_searches' => $trendingSearches,
                'top_interest_products' => $topInterestProducts,
                'returns_by_status' => $returnsByStatus,
                'customers_by_city' => $customersByCity,
                'top_user_interest_products' => $topUserInterestProducts,
                'top_user_search_terms' => $topUserSearchTerms,
            ],
            'insights' => [
                'filters' => $filterInsights,
            ],
            'tables' => [
                'low_stock_list' => $lowStockList,
            ],
        ], 200);
    }
}