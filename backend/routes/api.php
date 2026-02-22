<?php

use App\Http\Controllers\admin\AdminDashboardController;
use App\Http\Controllers\admin\AdminReturnRequestController;
use App\Http\Controllers\admin\AdminShippingController;
use App\Http\Controllers\admin\AuthController;
use App\Http\Controllers\admin\BrandController;
use App\Http\Controllers\admin\CategoryController;
use App\Http\Controllers\admin\ProductController;
use App\Http\Controllers\admin\SizeController;
use App\Http\Controllers\admin\TempImageController;
use App\Http\Controllers\front\AccountController;
use App\Http\Controllers\front\OrderController;
use App\Http\Controllers\front\ProductController as FrontProductController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\admin\OrderController as AdminOrderController;
use App\Http\Controllers\admin\StoreSettingController;
use App\Http\Controllers\admin\UserController;
use App\Http\Controllers\Api\ProductInterestController;
use App\Http\Controllers\Api\ProductReviewController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\ShippingController;
use App\Http\Controllers\Api\ShippingPublicController;
use App\Http\Controllers\Api\ShopFilterController;
use App\Http\Controllers\Api\SearchInsightsController;
use App\Http\Controllers\Api\PopularProductController;
use App\Http\Controllers\Api\RecommendationController;
use App\Http\Controllers\front\ReturnRequestController;


Route::post('/admin/login',[AuthController::class,'authentication']);

//For Guests
Route::get('get-latest-products',[FrontProductController::class,'latestProducts']);
Route::get('get-featured-products',[FrontProductController::class,'featuredProducts']);
Route::get('get-products', [FrontProductController::class, 'index']);
Route::get('get-categories',[FrontProductController::class,'getCategories']);
Route::get('get-brands',[FrontProductController::class,'getBrands']);
Route::get('get-product/{id}',[FrontProductController::class,'getProduct']);
Route::post('register',[AccountController::class,'register']);
Route::post('login',[AccountController::class,'authenticate']);
Route::get('/products/popular', [PopularProductController::class, 'index']);
 Route::post('/products/{product}/interest', [ProductInterestController::class, 'store']);


Route::get('/shipping', [ShippingPublicController::class, 'active']);
Route::get('/products/{id}/reviews', [ProductReviewController::class, 'index']);
// ✅ Trending searches (public)
Route::get('/search/trending', [SearchInsightsController::class, 'trending']);

// ✅ User search history (auth)
Route::middleware('auth:sanctum')->get('/search/history', [SearchInsightsController::class, 'history']);



Route::middleware('auth:sanctum')->post('save-order', [OrderController::class, 'saveOrder']);
Route::middleware('auth:sanctum')->get('/order/{order_number}', [OrderController::class, 'showByOrderNumber']);
Route::middleware('auth:sanctum')->get('/recommendations', [RecommendationController::class, 'index']);
Route::middleware('auth:sanctum')->post('/account/change-password', [AccountController::class, 'changePassword']);

Route::get('/search/suggestions', [SearchController::class, 'suggestions']);
 

  Route::middleware('auth:sanctum')->group(function () {
    Route::get('/account/orders', [OrderController::class, 'index']);
    Route::get('/account/orders/{id}', [OrderController::class, 'show']);
    Route::put('account/orders/{id}', [OrderController::class, 'update']);

   Route::get('/account/profile', [AccountController::class, 'profile']);

    Route::put('/account/profile', [AccountController::class, 'updateProfile']);
    // search tracking + suggestions
   
     Route::post('/search/track', [SearchController::class, 'track']);
   

    // interest scoring
   
    Route::post('/shop/track-filters', [ShopFilterController::class, 'store']);

    //reviews
    Route::post('/products/{id}/reviews', [ProductReviewController::class, 'store']);
    Route::middleware('auth:sanctum')->get('/products/{id}/reviews/can-review', [ProductReviewController::class, 'canReview']);
    //user history
    Route::get('/search/history', [SearchInsightsController::class, 'history']);
    
     Route::delete('/search/history/clear', [SearchInsightsController::class, 'clear']);

    Route::delete('/search/history/{id}', [SearchInsightsController::class, 'destroy']);
    
    //return product
    
     Route::post('/returns', [ReturnRequestController::class, 'store']);
    Route::get('/returns', [ReturnRequestController::class, 'index']);
   

});                  
//     return $request->user();
// })->middleware('auth:sanctum');


//admin api's here
Route::group(['middleware' => 'auth:sanctum'],function(){
    // Route::get('/categories',[CategoryController::class,'index']);
    // Route::get('/categories/{id}',[CategoryController::class,'show']);
    // Route::put('/categories/{id}',[CategoryController::class,'update']);
    // Route::delete('/categories/{id}',[CategoryController::class,'destroy']);
    // Route::post('/categories',[CategoryController::class,'store']);
    
    Route::resource('categories',CategoryController::class);
    Route::resource('brands',BrandController::class);
    Route::get('sizes',[SizeController::class,'index']);
    Route::resource('products',ProductController::class);
    Route::post('temp-images',[TempImageController::class,'store']);

    Route::get('admin/orders', [AdminOrderController::class, 'index']);
Route::get('admin/orders/{id}', [AdminOrderController::class, 'show']);
Route::put('admin/orders/{id}', [AdminOrderController::class, 'update']);
Route::delete('admin/orders/{id}', [AdminOrderController::class, 'destroy']);


    
Route::get('/admin/users', [UserController::class, 'index']);
Route::get('/admin/users/{id}', [UserController::class, 'show']); 

    Route::get('/admin/shipping', [AdminShippingController::class, 'show']);
    Route::put('/admin/shipping', [AdminShippingController::class, 'update']);

    // Returns (Admin)
    Route::get('/admin/returns', [AdminReturnRequestController::class, 'index']);
    Route::post('/admin/returns/{returnRequest}/approve', [AdminReturnRequestController::class, 'approve']);
    Route::post('/admin/returns/{returnRequest}/reject', [AdminReturnRequestController::class, 'reject']);
    Route::post('/admin/returns/{returnRequest}/mark-received', [AdminReturnRequestController::class, 'markReceived']);
    Route::post('/admin/returns/{returnRequest}/refund', [AdminReturnRequestController::class, 'refund']);
    Route::post('/admin/change-password', [AuthController::class, 'changePassword']);

   
    // Admin Dashboard
Route::get('/admin/dashboard', [AdminDashboardController::class, 'index']);

});