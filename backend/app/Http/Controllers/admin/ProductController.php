<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\TempImage;
use App\Models\ProductImage;
use App\Models\ProductSize;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Cloudinary\Cloudinary;

class ProductController extends Controller
{
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

    private function cloudinaryClient()
    {
        return new Cloudinary([
            'cloud' => [
                'cloud_name' => env('Ecommerce'),
                'api_key'    => env('841858334478494'),
                'api_secret' => env('2UFkrTyRAcM6W4WUv-K-xYux3Qw'),
            ],
            'url' => [
                'secure' => true,
            ],
        ]);
    }

    private function uploadImageToCloudinary($imagePath)
    {
        $cloudinary = $this->cloudinaryClient();

        $uploaded = $cloudinary->uploadApi()->upload($imagePath, [
            'folder' => 'products'
        ]);

        if (!$uploaded || empty($uploaded['secure_url'])) {
            throw new \Exception('Cloudinary secure_url missing');
        }

        return $uploaded['secure_url'];
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
        $product->image = '';
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
                    $imageUrl = $this->uploadImageToCloudinary($imagePath);

                    $productImage = new ProductImage();
                    $productImage->image = $imageUrl;
                    $productImage->product_id = $product->id;
                    $productImage->save();

                    if ($key == 0) {
                        $product->image = $imageUrl;
                        $product->save();
                    }
                } catch (\Throwable $e) {
                    return response()->json([
                        'status' => 500,
                        'message' => 'Cloudinary upload failed',
                        'error' => $e->getMessage(),
                        'file' => $e->getFile(),
                        'line' => $e->getLine(),
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

                $imagePath = public_path('uploads/temp/' . $tempImage->name);

                if (!file_exists($imagePath)) {
                    return response()->json([
                        'status' => 500,
                        'message' => 'Temp image file not found',
                        'error' => $imagePath
                    ], 500);
                }

                try {
                    $imageUrl = $this->uploadImageToCloudinary($imagePath);

                    $productImage = new ProductImage();
                    $productImage->image = $imageUrl;
                    $productImage->product_id = $product->id;
                    $productImage->save();

                    if ($key == 0) {
                        $product->image = $imageUrl;
                        $product->save();
                    }
                } catch (\Throwable $e) {
                    return response()->json([
                        'status' => 500,
                        'message' => 'Cloudinary upload failed',
                        'error' => $e->getMessage(),
                        'file' => $e->getFile(),
                        'line' => $e->getLine(),
                    ], 500);
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
            $product->product_images()->delete();
        }

        ProductSize::where('product_id', $product->id)->delete();
        $product->delete();

        return response()->json([
            'status' => 200,
            'message' => 'Product has been deleted successfully'
        ], 200);
    }
}