<?php

namespace App\Http\Controllers\admin;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;
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
    public function index()
    {
        $products = Product::orderBy('created_at', 'DESC')
            ->with('product_images')
            ->get();

        return response()->json([
            'status' => 200,
            'data' => $products
        ], 200);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'category' => 'required|integer',
            'sku' => 'required|string|max:255|unique:products,sku',
            'is_featured' => 'required',
            'status' => 'required',

            'compare_price' => 'nullable|numeric|min:0',
            'brand' => 'nullable|integer',
            'qty' => 'nullable|integer|min:0',
            'barcode' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'short_description' => 'nullable|string',

            'discount_type' => 'nullable|in:percent,amount',
            'discount_value' => 'nullable|numeric|min:0',

            'sizes' => 'nullable|array',
            'sizes.*' => 'integer|exists:sizes,id',

            'gallery' => 'nullable|array',
            'gallery.*' => 'integer|exists:temp_images,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 400,
                'errors' => $validator->errors()
            ], 400);
        }

        if (!$request->discount_type) {
            $request->merge(['discount_value' => null]);
        }

        if ($request->discount_type && $request->discount_value === null) {
            $request->merge(['discount_value' => 0]);
        }

        if ($request->discount_type === 'percent' && $request->discount_value > 100) {
            return response()->json([
                'status' => 400,
                'errors' => [
                    'discount_value' => ['Percent discount cannot be more than 100']
                ]
            ], 400);
        }

        if ($request->discount_type === 'amount' && $request->discount_value > $request->price) {
            return response()->json([
                'status' => 400,
                'errors' => [
                    'discount_value' => ['Discount amount cannot be greater than price']
                ]
            ], 400);
        }

        $product = new Product();
        $product->title = $request->title;
        $product->price = $request->price;
        $product->compare_price = $request->compare_price;
        $product->discount_type = $request->discount_type;
        $product->discount_value = $request->discount_value;
        $product->category_id = $request->category;
        $product->brand_id = $request->brand;
        $product->sku = $request->sku;
        $product->qty = $request->qty ?? 0;
        $product->description = $request->description;
        $product->short_description = $request->short_description;
        $product->status = $request->status;
        $product->is_featured = $request->is_featured == 1 ? 'yes' : 'no';
        $product->barcode = $request->barcode;

        // FIX: avoid null image on first insert
        $product->image = 'default.png';

        $product->save();

        if (!empty($request->sizes)) {
            foreach ($request->sizes as $sizeId) {
                ProductSize::create([
                    'product_id' => $product->id,
                    'size_id' => $sizeId
                ]);
            }
        }

       if (!empty($request->gallery)) {
    foreach ($request->gallery as $key => $tempImageId) {
        $tempImage = TempImage::find($tempImageId);

        if (!$tempImage) {
            continue;
        }

        $imagePath = public_path('uploads/temp/' . $tempImage->name);

        if (!file_exists($imagePath)) {
            return response()->json([
                'status' => 500,
                'message' => 'Temp image file not found',
                'error' => $imagePath
            ], 500);
        }

        try {
            $uploaded = \CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary::upload(
                $imagePath,
                ['folder' => 'products']
            );

            if (!$uploaded) {
                return response()->json([
                    'status' => 500,
                    'message' => 'Cloudinary upload returned null',
                ], 500);
            }

            $imageUrl = $uploaded->getSecurePath();

            if (!$imageUrl) {
                return response()->json([
                    'status' => 500,
                    'message' => 'Cloudinary secure URL not found',
                ], 500);
            }

            $productImage = new ProductImage();
            $productImage->image = $imageUrl;
            $productImage->product_id = $product->id;
            $productImage->save();

            if ($key == 0) {
                $product->image = $imageUrl;
                $product->save();
            }
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Cloudinary upload failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}




        return response()->json([
            'status' => 200,
            'message' => 'Product has been created successfully'
        ], 200);
    }

    public function show($id)
    {
        $product = Product::with('product_images')->find($id);

        if ($product == null) {
            return response()->json([
                'status' => 404,
                'message' => 'Product not found'
            ], 404);
        }

        return response()->json([
            'status' => 200,
            'data' => $product
        ], 200);
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
            'title' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'category' => 'required|integer',
            'sku' => 'required|unique:products,sku,' . $id . ',id',
            'is_featured' => 'required',
            'status' => 'required',

            'discount_type' => 'nullable|in:percent,amount',
            'discount_value' => 'nullable|numeric|min:0',

            'sizes' => 'nullable|array',
            'sizes.*' => 'integer|exists:sizes,id',

            'qty' => 'nullable|integer|min:0',
            'compare_price' => 'nullable|numeric|min:0',
            'brand' => 'nullable|integer',
            'barcode' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'short_description' => 'nullable|string',

            'gallery' => 'nullable|array',
            'gallery.*' => 'integer|exists:temp_images,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 400,
                'errors' => $validator->errors()
            ], 400);
        }

        $discountType = $request->discount_type ?: null;
        $discountValue = $discountType ? ($request->discount_value ?? 0) : null;

        if ($discountType === 'percent' && $discountValue > 100) {
            return response()->json([
                'status' => 400,
                'errors' => [
                    'discount_value' => ['Percent discount cannot be more than 100']
                ]
            ], 400);
        }

        if ($discountType === 'amount' && $discountValue > $request->price) {
            return response()->json([
                'status' => 400,
                'errors' => [
                    'discount_value' => ['Discount amount cannot be greater than price']
                ]
            ], 400);
        }

        $product->title = $request->title;
        $product->price = $request->price;
        $product->compare_price = $request->compare_price;
        $product->discount_type = $discountType;
        $product->discount_value = $discountValue;
        $product->category_id = $request->category;
        $product->brand_id = $request->brand;
        $product->sku = $request->sku;
        $product->qty = $request->qty ?? 0;
        $product->description = $request->description;
        $product->short_description = $request->short_description;
        $product->status = $request->status;
        $product->is_featured = $request->is_featured == 1 ? 'yes' : 'no';
        $product->barcode = $request->barcode;
        $product->save();

        if ($request->has('sizes')) {
            ProductSize::where('product_id', $product->id)->delete();

            foreach (($request->sizes ?? []) as $sizeId) {
                ProductSize::create([
                    'product_id' => $product->id,
                    'size_id' => $sizeId
                ]);
            }
        }

        if (!empty($request->gallery)) {
            foreach ($request->gallery as $key => $tempImageId) {
                $tempImage = TempImage::find($tempImageId);

                if (!$tempImage) {
                    continue;
                }

                $extArray = explode('.', $tempImage->name);
                $ext = end($extArray);

                $imageName = $product->id . '-' . time() . '-' . $key . '.' . $ext;
                $manager = new ImageManager(new Driver());

                $img = $manager->read(public_path('uploads/temp/' . $tempImage->name));
                $img->scaleDown(1200);
                $img->save(public_path('uploads/products/large/' . $imageName));

                $img = $manager->read(public_path('uploads/temp/' . $tempImage->name));
                $img->coverDown(400, 460);
                $img->save(public_path('uploads/products/small/' . $imageName));

                $productImage = new ProductImage();
                $productImage->image = $imageName;
                $productImage->product_id = $product->id;
                $productImage->save();

                if ($key == 0) {
                    $product->image = $imageName;
                    $product->save();
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

        if ($product->product_images && $product->product_images->count() > 0) {
            foreach ($product->product_images as $pimg) {
                $largePath = public_path('uploads/products/large/' . $pimg->image);
                $smallPath = public_path('uploads/products/small/' . $pimg->image);

                if (file_exists($largePath)) {
                    @unlink($largePath);
                }
                if (file_exists($smallPath)) {
                    @unlink($smallPath);
                }
            }

            $product->product_images()->delete();
        }

        if (!empty($product->image) && $product->image !== 'default.png') {
            $largeMain = public_path('uploads/products/large/' . $product->image);
            $smallMain = public_path('uploads/products/small/' . $product->image);

            if (file_exists($largeMain)) {
                @unlink($largeMain);
            }
            if (file_exists($smallMain)) {
                @unlink($smallMain);
            }
        }

        ProductSize::where('product_id', $product->id)->delete();
        $product->delete();

        return response()->json([
            'status' => 200,
            'message' => 'Product has been deleted successfully'
        ], 200);
    }
}