<?php

namespace App\Http\Controllers\front;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    //
    public function latestProducts(){
        $products = Product::orderBy('created_at','DESC')
                    ->where('status',1)
                    ->limit(8)
                    ->get();

              return response()->json([
                'status' => 200,
                'data'   => $products
              ],200);       
    }

    public function featuredProducts(){
        $products = Product::orderBy('created_at','DESC')
                    ->where('status',1)
                    ->where('is_Featured','yes')
                    ->limit(8)
                    ->get();

              return response()->json([
                'status' => 200,
                'data'   => $products
              ],200);       
    }

    public function index(Request $request){
    $query = Product::orderBy('created_at','DESC')
                    ->where('status', 1);
    
    // Filter by categories (if provided)
    if ($request->has('categories') && !empty($request->categories)) {
        $categoryIds = explode(',', $request->categories);
        $query->whereIn('category_id', $categoryIds);
    }
    
    // Filter by brands (if provided)
    if ($request->has('brands') && !empty($request->brands)) {
        $brandIds = explode(',', $request->brands);
        $query->whereIn('brand_id', $brandIds);
    }

    // Filter by min/max price (if provided)
        if ($request->filled('min_price')) {
            $query->where('price', '>=', (float)$request->min_price);
        }

        if ($request->filled('max_price')) {
            $query->where('price', '<=', (float)$request->max_price);
        }

    
    $products = $query->get();
    
    return response()->json([
        'status' => 200,
        'data' => $products,
        'filters' => [
            'categories' => $request->categories,
            'brands' => $request->brands
        ]
    ], 200);
}

public function getCategories(){
    $categories = Category::orderBy('name','ASC')
        
        ->get();
    
    return response()->json([
        'status' => 200,
        'data' => $categories,
        'total' => $categories->count()
    ], 200); 
}

public function getBrands(){
    $brands = Brand::orderBy('name','ASC')
        
        ->get();
    
    return response()->json([
        'status' => 200,
        'data' => $brands,
        'total' => $brands->count()
    ], 200); 
}

public function getProduct($id)
{
    $product = Product::with('product_images','product_sizes.size')->find($id);
    
    if (!$product) {
        return response()->json([
            'status' => 404,
            'message' => 'Product not found'
        ], 404);
    }
    
    // ✅ Add full URL for main product image
    if ($product->image) {
        $product->image_url = asset('uploads/products/large/' . $product->image);
    }

    // ✅ Add full URLs for gallery images
    if ($product->product_images) {
        foreach ($product->product_images as $image) {
            $image->image_url = asset('uploads/products/large/' . $image->image);
        }
    }

    return response()->json([
        'status' => 200,
        'data' => $product
    ], 200);
}


}