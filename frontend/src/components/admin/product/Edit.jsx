import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { adminToken, apiUrl } from "../../common/http";
import { toast } from "react-toastify";
import Layout from "../../common/Layout";
import Sidebar from "../../common/Sidebar";

const Edit = () => {
  const [disable, setDisable] = useState(false);
  const [product, setProduct] = useState(null);

  const [imagePreview, setImagePreview] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [sizes, setSizes] = useState([]);

  // ✅ always keep selected ids as numbers
  const [selectedSizeIds, setSelectedSizeIds] = useState([]);

  const navigate = useNavigate();
  const params = useParams();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      discount_type: "",
      discount_value: "",
    },
  });

  // ✅ Fetch product, categories, brands, sizes
  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = {
          "Content-type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${adminToken()}`,
        };

        const [categoriesRes, brandsRes, sizesRes, productRes] = await Promise.all([
          fetch(`${apiUrl}/categories`, { headers }),
          fetch(`${apiUrl}/brands`, { headers }),
          fetch(`${apiUrl}/sizes`, { headers }),
          // ✅ your product endpoint
          fetch(`${apiUrl}/get-product/${params.id}`, { method: "GET", headers }),
        ]);

        const categoriesData = await categoriesRes.json();
        const brandsData = await brandsRes.json();
        const sizesData = await sizesRes.json();
        const productData = await productRes.json();

        if (categoriesData.status === 200) setCategories(categoriesData.data || []);
        if (brandsData.status === 200) setBrands(brandsData.data || []);
        if (sizesData.status === 200) setSizes(sizesData.data || []);

        if (productData.status === 200) {
          const prod = productData.data;
          setProduct(prod);

          // main image preview
          if (prod?.image) {
            setImagePreview(`${apiUrl.replace("/api", "")}/uploads/products/small/${prod.image}`);
          } else if (prod?.image_url) {
            setImagePreview(prod.image_url);
          }

          // ✅ selected sizes
          const existingSizeIds = (prod.product_sizes || [])
            .map((ps) => Number(ps.size_id ?? ps.size?.id))
            .filter((id) => !Number.isNaN(id));

          setSelectedSizeIds(existingSizeIds);

          // ✅ reset form values (including discount)
          reset({
            title: prod.title || "",
            price: prod.price ?? "",
            compare_price: prod.compare_price ?? "",
            qty: prod.qty ?? "",
            sku: prod.sku || "",
            category: prod.category_id ?? "",
            brand: prod.brand_id ?? "",
            description: prod.description || "",
            short_description: prod.short_description || "",
            barcode: prod.barcode || "",
            is_featured: prod.is_featured ?? "no",
            status: prod.status !== undefined ? String(prod.status) : "1",

            // ✅ discount fields
            discount_type: prod.discount_type || "",
            discount_value: prod.discount_value ?? "",
          });
        } else {
          toast.error("Product not found");
          navigate("/admin/product");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load product data");
      }
    };

    fetchData();
  }, [params.id, reset, navigate]);

  // ✅ checkbox toggle (always numbers)
  const handleSizeToggle = (sizeId) => {
    const id = Number(sizeId);
    setSelectedSizeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // image select
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  // remove selected image
  const removeImage = () => {
    setSelectedImage(null);

    if (product?.image) {
      setImagePreview(`${apiUrl.replace("/api", "")}/uploads/products/small/${product.image}`);
    } else if (product?.image_url) {
      setImagePreview(product.image_url);
    } else {
      setImagePreview(null);
    }

    const fileInput = document.getElementById("imageInput");
    if (fileInput) fileInput.value = "";
  };

  const saveProduct = async (data) => {
    setDisable(true);

    // upload image first if chosen
    let tempImageId = null;
    if (selectedImage) {
      const formData = new FormData();
      formData.append("image", selectedImage);

      try {
        const imageRes = await fetch(`${apiUrl}/temp-images`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${adminToken()}`,
          },
          body: formData,
        });

        const imageResult = await imageRes.json();

        if (imageResult.status === 200) {
          tempImageId = imageResult.data?.id;
        } else {
          toast.error(imageResult.message || "Failed to upload image");
          setDisable(false);
          return;
        }
      } catch (error) {
        console.error("Image upload error:", error);
        toast.error("Failed to upload image");
        setDisable(false);
        return;
      }
    }

    // ✅ normalize discount
    const discountType = data.discount_type || null;
    const discountValue = discountType ? Number(data.discount_value || 0) : null;

    const productData = {
      title: data.title,
      price: parseFloat(data.price),
      compare_price: data.compare_price ? parseFloat(data.compare_price) : null,
      category: parseInt(data.category, 10),
      brand: data.brand ? parseInt(data.brand, 10) : null,
      sku: data.sku,
      qty: data.qty !== "" && data.qty !== null ? parseInt(data.qty, 10) : 0,
      description: data.description || "",
      short_description: data.short_description || "",
      barcode: data.barcode || "",
      is_featured: data.is_featured,
      status: parseInt(data.status, 10),

      // ✅ DISCOUNT
      discount_type: discountType,
      discount_value: discountValue,

      // ✅ send selected sizes
      sizes: selectedSizeIds.map((id) => Number(id)).filter((id) => !Number.isNaN(id)),
    };

    // add gallery only if new image uploaded
    if (tempImageId) {
      productData.gallery = [tempImageId];
    }

    try {
      const res = await fetch(`${apiUrl}/products/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${adminToken()}`,
        },
        body: JSON.stringify(productData),
      });

      const result = await res.json();
      setDisable(false);

      if (result.status === 200) {
        toast.success(result.message || "Updated");
        navigate("/admin/product");
      } else if (result.status === 400 && result.errors) {
        Object.keys(result.errors).forEach((key) => {
          const msg = Array.isArray(result.errors[key]) ? result.errors[key][0] : result.errors[key];
          toast.error(`${key}: ${msg}`);
        });
      } else {
        toast.error(result.message || "Failed to update product");
      }
    } catch (error) {
      setDisable(false);
      console.error("Update error:", error);
      toast.error("Failed to update product");
    }
  };

  return (
    <Layout>
      <div className="container-fluid px-4">
        <div className="row">
          <div className="d-flex justify-content-between mt-5 pb-3">
            <h4 className="h4 pb-0 mb-0">Products / Edit</h4>
            <Link to="/admin/product" className="btn btn-primary">
              Back
            </Link>
          </div>

          <div className="col-md-3">
            <Sidebar />
          </div>

          <div className="col-md-9">
            <form onSubmit={handleSubmit(saveProduct)}>
              <div className="card shadow">
                <div className="card-body p-4">
                  <div className="mb-3">
                    <label className="form-label">Title</label>
                    <input
                      {...register("title", { required: "The title field is required" })}
                      type="text"
                      className={`form-control ${errors.title ? "is-invalid" : ""}`}
                      placeholder="Title"
                    />
                    {errors.title && <p className="invalid-feedback">{errors.title.message}</p>}
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Price</label>
                        <input
                          {...register("price", { required: "The price field is required" })}
                          type="number"
                          step="0.01"
                          className={`form-control ${errors.price ? "is-invalid" : ""}`}
                          placeholder="Price"
                        />
                        {errors.price && <p className="invalid-feedback">{errors.price.message}</p>}
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Compare Price</label>
                        <input
                          {...register("compare_price")}
                          type="number"
                          step="0.01"
                          className="form-control"
                          placeholder="Compare Price"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ✅ DISCOUNT UI */}
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Discount Type</label>
                        <select {...register("discount_type")} className="form-control">
                          <option value="">No Discount</option>
                          <option value="percent">Percent (%)</option>
                          <option value="amount">Fixed Amount (৳)</option>
                        </select>
                        <small className="text-muted">
                          Leave empty if you don't want discount.
                        </small>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Discount Value</label>
                        <input
                          {...register("discount_value")}
                          type="number"
                          step="0.01"
                          className="form-control"
                          placeholder="e.g. 10 or 100"
                        />
                        <small className="text-muted">
                          Percent: 10 = 10% off. Amount: 100 = ৳100 off.
                        </small>
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Category</label>
                        <select
                          {...register("category", { required: "Please select a category" })}
                          className={`form-control ${errors.category ? "is-invalid" : ""}`}
                        >
                          <option value="">Select a Category</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        {errors.category && <p className="invalid-feedback">{errors.category.message}</p>}
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Brand</label>
                        <select {...register("brand")} className="form-control">
                          <option value="">Select a Brand</option>
                          {brands.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* ✅ SIZES */}
                  <div className="mb-3">
                    <label className="form-label">
                      Available Sizes
                      {selectedSizeIds.length > 0 && (
                        <span className="badge bg-primary ms-2">{selectedSizeIds.length} selected</span>
                      )}
                    </label>

                    <div className="border rounded p-3" style={{ backgroundColor: "#f8f9fa" }}>
                      {sizes.length > 0 ? (
                        <div className="row">
                          {sizes.map((size) => {
                            const isChecked = selectedSizeIds.includes(Number(size.id));
                            return (
                              <div key={size.id} className="col-md-3 col-sm-4 col-6 mb-2">
                                <div className="form-check">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`size-${size.id}`}
                                    checked={isChecked}
                                    onChange={() => handleSizeToggle(size.id)}
                                  />
                                  <label
                                    className="form-check-label"
                                    htmlFor={`size-${size.id}`}
                                    style={{
                                      fontWeight: isChecked ? "600" : "400",
                                      color: isChecked ? "#0d6efd" : "#212529",
                                    }}
                                  >
                                    {size.name}
                                  </label>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-muted mb-0">No sizes available. Please add sizes first.</p>
                      )}
                    </div>

                    <small className="text-muted d-block mt-1">
                      Select all sizes that apply to this product. Changes will be saved when you click Update.
                    </small>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Qty</label>
                        <input
                          {...register("qty", { required: "The qty field is required" })}
                          type="number"
                          className={`form-control ${errors.qty ? "is-invalid" : ""}`}
                          placeholder="QTY"
                        />
                        {errors.qty && <p className="invalid-feedback">{errors.qty.message}</p>}
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">SKU</label>
                        <input
                          {...register("sku", { required: "The sku field is required" })}
                          type="text"
                          className={`form-control ${errors.sku ? "is-invalid" : ""}`}
                          placeholder="SKU"
                        />
                        {errors.sku && <p className="invalid-feedback">{errors.sku.message}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Barcode</label>
                    <input {...register("barcode")} type="text" className="form-control" placeholder="Barcode" />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea {...register("description")} className="form-control" rows="4" placeholder="Description" />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Short Description</label>
                    <textarea
                      {...register("short_description")}
                      className="form-control"
                      rows="2"
                      placeholder="Short Description"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Product Image</label>
                    <input
                      id="imageInput"
                      type="file"
                      className="form-control"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    <small className="text-muted">Leave empty to keep current image</small>
                  </div>

                  {imagePreview && (
                    <div className="mb-3">
                      <label className="form-label">Image Preview</label>
                      <div className="position-relative d-inline-block">
                        <img
                          src={imagePreview}
                          alt="Product preview"
                          style={{
                            width: "150px",
                            height: "150px",
                            objectFit: "cover",
                            borderRadius: "8px",
                            border: "1px solid #ddd",
                          }}
                        />
                        {selectedImage && (
                          <button
                            type="button"
                            onClick={removeImage}
                            className="btn btn-danger btn-sm position-absolute"
                            style={{
                              top: "-10px",
                              right: "-10px",
                              borderRadius: "50%",
                              width: "30px",
                              height: "30px",
                              padding: "0",
                            }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Is Featured</label>
                        <select
                          {...register("is_featured", { required: "Please select featured status" })}
                          className={`form-control ${errors.is_featured ? "is-invalid" : ""}`}
                        >
                          <option value="">Select</option>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                        {errors.is_featured && <p className="invalid-feedback">{errors.is_featured.message}</p>}
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Status</label>
                        <select
                          {...register("status", { required: "Please select a status" })}
                          className={`form-control ${errors.status ? "is-invalid" : ""}`}
                        >
                          <option value="">Select a Status</option>
                          <option value="1">Active</option>
                          <option value="0">Block</option>
                        </select>
                        {errors.status && <p className="invalid-feedback">{errors.status.message}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button disabled={disable} className="btn btn-primary mt-3 mb-3">
                {disable ? "Updating..." : "Update"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Edit;
