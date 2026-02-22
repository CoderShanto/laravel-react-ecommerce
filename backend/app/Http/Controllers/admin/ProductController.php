<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\TempImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use App\Models\ProductImage;
use App\Models\ProductSize;

class ProductController extends Controller
{
    // fetching products from db
    public function index(){
        $products = Product::orderBy('created_at','DESC')
        ->with('product_images')
        ->get();
         return response()->json([
                'status' => 200,
                'data' => $products
            ],200);


    }

     public function store(Request $request)
{
    // ✅ validate request
    $validator = Validator::make($request->all(), [
        'title' => 'required',
        'price' => 'required|numeric|min:0',
        'category' => 'required|integer',
        'sku' => 'required|unique:products,sku',
        'is_featured' => 'required',
        'status' => 'required',

        'compare_price' => 'nullable|numeric|min:0',

        // ✅ discount validation
        'discount_type' => 'nullable|in:percent,amount',
        'discount_value' => 'nullable|numeric|min:0',

        // ✅ sizes
        'sizes' => 'nullable|array',
        'sizes.*' => 'integer|exists:sizes,id',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'status' => 400,
            'errors' => $validator->errors()
        ], 400);
    }

    // ✅ extra safety: if type missing, force value null
    if (!$request->discount_type) {
        $request->merge(['discount_value' => null]);
    }

    // ✅ if type exists but value missing, set 0 (or you can return error)
    if ($request->discount_type && $request->discount_value === null) {
        $request->merge(['discount_value' => 0]);
    }

    // ✅ store product
    $product = new Product();
    $product->title = $request->title;
    $product->price = $request->price;
    $product->compare_price = $request->compare_price;

    // ✅ SAVE DISCOUNT
    $product->discount_type = $request->discount_type;   // percent | amount | null
    $product->discount_value = $request->discount_value; // number | null

    $product->category_id = $request->category;
    $product->brand_id = $request->brand;
    $product->sku = $request->sku;
    $product->qty = $request->qty;
    $product->description = $request->description;
    $product->short_description = $request->short_description;
    $product->status = $request->status;
    $product->is_featured = $request->is_featured;
    $product->barcode = $request->barcode;
    $product->save();

    // ✅ save sizes into product_sizes
    if (!empty($request->sizes)) {
        foreach ($request->sizes as $sizeId) {
            ProductSize::create([
                'product_id' => $product->id,
                'size_id' => $sizeId
            ]);
        }
    }

    // ✅ save product images
    if (!empty($request->gallery)) {
        foreach ($request->gallery as $key => $tempImageId) {
            $tempImage = TempImage::find($tempImageId);

            if (!$tempImage) continue;

            $extArray = explode('.', $tempImage->name);
            $ext = end($extArray);

            $imageName = $product->id . '-' . time() . '-' . $key . '.' . $ext;

            // large
            $manager = new ImageManager(Driver::class);
            $img = $manager->read(public_path('uploads/temp/' . $tempImage->name));
            $img->scaleDown(1200);
            $img->save(public_path('uploads/products/large/' . $imageName));

            // small
            $manager = new ImageManager(Driver::class);
            $img = $manager->read(public_path('uploads/temp/' . $tempImage->name));
            $img->coverDown(400, 460);
            $img->save(public_path('uploads/products/small/' . $imageName));

            $productImage = new ProductImage();
            $productImage->image = $imageName;
            $productImage->product_id = $product->id;
            $productImage->save();

            // first image as main
            if ($key == 0) {
                $product->image = $imageName;
                $product->save();
            }
        }
    }

    return response()->json([
        'status' => 200,
        'message' => 'Product has been created successfully'
    ], 200);
}



       //we can find any-one products
      public function show($id){

       $product = Product::with('product_images')
       ->find($id);

      if($product == null){
        return response()->json([
                'status' => 404,
                'message' => 'Product not found'
            ],404);
      }

      return response()->json([
                'status' => 200,
                'data' => $product
            ],200);


        
    }

 public function update($id, Request $request)
{
    $product = Product::find($id);

    if ($product == null) {
        return response()->json([
            'status' => 404,
            'message' => 'Product not found'
        ], 404);
    }

    $validator = Validator::make($request->all(), [
        'title' => 'required',
        'price' => 'required|numeric|min:0',
        'category' => 'required|integer',
        'sku' => 'required|unique:products,sku,' . $id . ',id',
        'is_featured' => 'required',
        'status' => 'required',

        // ✅ discount validations
        'discount_type' => 'nullable|in:percent,amount',
        'discount_value' => 'nullable|numeric|min:0',

        // sizes
        'sizes' => 'nullable|array',
        'sizes.*' => 'integer|exists:sizes,id',

        // optional
        'qty' => 'nullable|integer',
        'compare_price' => 'nullable|numeric|min:0',
        'brand' => 'nullable|integer',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'status' => 400,
            'errors' => $validator->errors()
        ], 400);
    }

    // ✅ normalize discount (if type empty -> value null)
    $discountType = $request->discount_type ?: null;
    $discountValue = $discountType ? ($request->discount_value ?? 0) : null;

    // ✅ update product fields
    $product->title = $request->title;
    $product->price = $request->price;
    $product->compare_price = $request->compare_price;

    // ✅ SAVE DISCOUNT
    $product->discount_type = $discountType;
    $product->discount_value = $discountValue;

    $product->category_id = $request->category;
    $product->brand_id = $request->brand;
    $product->sku = $request->sku;
    $product->qty = $request->qty;
    $product->description = $request->description;
    $product->short_description = $request->short_description;
    $product->status = $request->status;
    $product->is_featured = $request->is_featured;
    $product->barcode = $request->barcode;
    $product->save();

    // ✅ Update sizes (replace old)
    if ($request->has('sizes')) {
        \App\Models\ProductSize::where('product_id', $product->id)->delete();

        foreach (($request->sizes ?? []) as $sizeId) {
            \App\Models\ProductSize::create([
                'product_id' => $product->id,
                'size_id' => $sizeId
            ]);
        }
    }

    // ✅ save product images (if new uploaded)
    if (!empty($request->gallery)) {
        foreach ($request->gallery as $key => $tempImageId) {
            $tempImage = TempImage::find($tempImageId);

            if ($tempImage) {
                $extArray = explode('.', $tempImage->name);
                $ext = end($extArray);

                $imageName = $product->id . '-' . time() . '-' . $key . '.' . $ext;
                $manager = new ImageManager(Driver::class);

                $img = $manager->read(public_path('uploads/temp/' . $tempImage->name));
                $img->scaleDown(1200);
                $img->save(public_path('uploads/products/large/' . $imageName));

                $img = $manager->read(public_path('uploads/temp/' . $tempImage->name));
                $img->coverDown(400, 460);
                $img->save(public_path('uploads/products/small/' . $imageName));

                if ($key == 0) {
                    $product->image = $imageName;
                    $product->save();
                }
            }
        }
    }

    return response()->json([
        'status' => 200,
        'message' => 'Product has been updated successfully'
    ], 200);
}



      public function destroy($id)
{
    $product = Product::with('product_images')->find($id);

    if ($product == null) {
        return response()->json([
            'status' => 404,
            'message' => 'Product not found'
        ], 404);
    }

    // 1) Delete image files + DB rows
    if ($product->product_images && $product->product_images->count() > 0) {
        foreach ($product->product_images as $pimg) {

            // delete files (large + small) if exist
            $largePath = public_path('uploads/products/large/' . $pimg->image);
            $smallPath = public_path('uploads/products/small/' . $pimg->image);

            if (file_exists($largePath)) {
                @unlink($largePath);
            }
            if (file_exists($smallPath)) {
                @unlink($smallPath);
            }
        }
      

        // delete rows from product_images table
        $product->product_images()->delete();
    }

    // 2) Delete main image files if you store it separately in products.image
    if (!empty($product->image)) {
        $largeMain = public_path('uploads/products/large/' . $product->image);
        $smallMain = public_path('uploads/products/small/' . $product->image);

        if (file_exists($largeMain)) {
            @unlink($largeMain);
        }
        if (file_exists($smallMain)) {
            @unlink($smallMain);
        }
    }

    // 3) Delete product row
    $product->delete();

    return response()->json([
        'status' => 200,
        'message' => 'Product has been deleted successfully'
    ], 200);
}

   

      
}
