import React, { useState, useEffect, useRef, useMemo } from "react";
import Layout from "../../common/Layout";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../../common/Sidebar";
import { useForm } from "react-hook-form";
import { adminToken, apiUrl } from "../../common/http";
import { toast } from "react-toastify";
import JoditEditor from "jodit-react";

const Create = ({ placeholder }) => {
  const editor = useRef(null);
  const navigate = useNavigate();

  const [content, setContent] = useState("");
  const [disable, setDisable] = useState(false);

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [loadingSizes, setLoadingSizes] = useState(false);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [imageUploading, setImageUploading] = useState(false);

  const config = useMemo(
    () => ({
      readonly: false,
      placeholder: placeholder || "",
    }),
    [placeholder],
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      sizes: [],
      discount_type: "",
      discount_value: "",
    },
  });

  const discountType = watch("discount_type");
  const priceWatch = watch("price");
  const discountValueWatch = watch("discount_value");

  const stripHtml = (html) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return (doc.body.textContent || "").trim();
  };

  // ✅ Safer label resolver for category/brand/size API response
  const getOptionLabel = (item) => {
    return (
      item?.name ||
      item?.title ||
      item?.label ||
      item?.size ||
      item?.value ||
      item?.slug ||
      `Item ${item?.id ?? ""}`
    );
  };

  // ✅ Safer value resolver
  const getOptionValue = (item) => {
    return item?.id ?? item?.value ?? "";
  };

  const handleFile = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const mapped = files.map((file) => ({
      key: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
      file,
      url: URL.createObjectURL(file),
      name: file.name,
    }));

    setPreviews((prev) => [...prev, ...mapped]);
    setSelectedFiles((prev) => [...prev, ...mapped.map((x) => x.file)]);

    e.target.value = "";
  };

  const removeImage = (key) => {
    setPreviews((prev) => {
      const item = prev.find((p) => p.key === key);
      if (item) URL.revokeObjectURL(item.url);

      const next = prev.filter((p) => p.key !== key);
      setSelectedFiles(next.map((x) => x.file));
      return next;
    });
  };

  const uploadTempImage = async (file) => {
    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(`${apiUrl}/temp-images`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${adminToken()}`,
      },
      body: formData,
    });

    const result = await res.json();

    if (!res.ok || result.status !== 200 || !result?.data?.id) {
      const msg =
        result?.errors?.image?.[0] ||
        result?.message ||
        `Upload failed (HTTP ${res.status})`;
      throw new Error(msg);
    }

    return result.data.id;
  };

  const saveProduct = async (data) => {
    setDisable(true);

    try {
      setImageUploading(true);

      const tempIds = [];
      for (const p of previews) {
        const id = await uploadTempImage(p.file);
        tempIds.push(id);
      }

      setImageUploading(false);

      const sizeIds = Array.isArray(data.sizes)
        ? data.sizes.map((x) => parseInt(x, 10)).filter(Boolean)
        : [];

      let discount_type = data.discount_type || null;
      let discount_value =
        data.discount_value !== "" ? Number(data.discount_value) : null;

      if (!discount_type) {
        discount_type = null;
        discount_value = null;
      } else {
        if (Number.isNaN(discount_value) || discount_value < 0) {
          toast.error("Discount value must be a valid number");
          setDisable(false);
          return;
        }

        if (discount_type === "percent" && discount_value > 100) {
          toast.error("Percent discount cannot be more than 100");
          setDisable(false);
          return;
        }

        const price = Number(data.price || 0);
        if (discount_type === "amount" && discount_value > price) {
          toast.error("Discount amount cannot be greater than price");
          setDisable(false);
          return;
        }
      }

      const productData = {
        ...data,
        description: stripHtml(content),
        gallery: tempIds,
        sizes: sizeIds,
        discount_type,
        discount_value,
      };

      const res = await fetch(`${apiUrl}/products`, {
        method: "POST",
        headers: {
          "Content-type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${adminToken()}`,
        },
        body: JSON.stringify(productData),
      });

      const result = await res.json();

      if (result.status === 200) {
        toast.success(result.message || "Product created");

        previews.forEach((p) => URL.revokeObjectURL(p.url));
        navigate("/admin/product");
      } else if (result.status === 400) {
        Object.keys(result.errors || {}).forEach((key) => {
          toast.error(result.errors[key][0]);
        });
      } else {
        toast.error(result.message || "Something went wrong");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Error creating product");
      setImageUploading(false);
    } finally {
      setDisable(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${apiUrl}/categories`, {
        method: "GET",
        headers: {
          "Content-type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${adminToken()}`,
        },
      });

      const result = await res.json();
      if (result.status === 200) {
        setCategories(Array.isArray(result.data) ? result.data : []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchBrands = async () => {
    try {
      const res = await fetch(`${apiUrl}/brands`, {
        method: "GET",
        headers: {
          "Content-type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${adminToken()}`,
        },
      });

      const result = await res.json();
      if (result.status === 200) {
        setBrands(Array.isArray(result.data) ? result.data : []);
      }
    } catch (error) {
      console.error("Error fetching brands:", error);
    }
  };

  const fetchSizes = async () => {
    try {
      setLoadingSizes(true);

      const res = await fetch(`${apiUrl}/sizes`, {
        method: "GET",
        headers: {
          "Content-type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${adminToken()}`,
        },
      });

      const result = await res.json();
      console.log("Sizes API response:", result);

      if (result.status === 200) {
        const sizeData = Array.isArray(result.data) ? result.data : [];
        setSizes(sizeData);

        if (sizeData.length === 0) {
          toast.warning("No sizes found from API");
        }
      } else {
        setSizes([]);
        toast.error(result.message || "Failed to load sizes");
      }
    } catch (error) {
      console.error("Error fetching sizes:", error);
      setSizes([]);
      toast.error("Error fetching sizes");
    } finally {
      setLoadingSizes(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchBrands();
    fetchSizes();

    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const computedFinalPrice = useMemo(() => {
    const price = Number(priceWatch || 0);
    const dv = Number(discountValueWatch || 0);

    if (!discountType) return price;

    if (discountType === "percent") {
      return Math.max(0, price - (price * dv) / 100);
    }

    if (discountType === "amount") {
      return Math.max(0, price - dv);
    }

    return price;
  }, [priceWatch, discountType, discountValueWatch]);

  return (
    <Layout>
      <div className="container-fluid px-4">
        <div className="row">
          <div className="d-flex justify-content-between mt-5 pb-3">
            <h4 className="h4 pb-0 mb-0">Products / Create</h4>
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
                  <div className="row">
                    {/* Title */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        Title <span className="text-danger">*</span>
                      </label>
                      <input
                        {...register("title", {
                          required: "The title field is required",
                        })}
                        type="text"
                        className={`form-control ${errors.title ? "is-invalid" : ""}`}
                        placeholder="Title"
                      />
                      {errors.title && (
                        <p className="invalid-feedback">
                          {errors.title?.message}
                        </p>
                      )}
                    </div>

                    {/* SKU */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        SKU <span className="text-danger">*</span>
                      </label>
                      <input
                        {...register("sku", {
                          required: "The SKU field is required",
                        })}
                        type="text"
                        className={`form-control ${errors.sku ? "is-invalid" : ""}`}
                        placeholder="SKU"
                      />
                      {errors.sku && (
                        <p className="invalid-feedback">
                          {errors.sku?.message}
                        </p>
                      )}
                    </div>

                    {/* Category */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        Category <span className="text-danger">*</span>
                      </label>
                      <select
                        {...register("category", {
                          required: "Please select a category",
                        })}
                        className={`form-control ${errors.category ? "is-invalid" : ""}`}
                      >
                        <option value="">Select a Category</option>
                        {categories.map((cat) => (
                          <option
                            key={getOptionValue(cat)}
                            value={getOptionValue(cat)}
                          >
                            {getOptionLabel(cat)}
                          </option>
                        ))}
                      </select>
                      {errors.category && (
                        <p className="invalid-feedback">
                          {errors.category?.message}
                        </p>
                      )}
                    </div>

                    {/* Brand */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Brand</label>
                      <select {...register("brand")} className="form-control">
                        <option value="">Select a Brand</option>
                        {brands.map((brand) => (
                          <option
                            key={getOptionValue(brand)}
                            value={getOptionValue(brand)}
                          >
                            {getOptionLabel(brand)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Sizes */}
                    <div className="col-md-12 mb-3">
                      <label className="form-label">Sizes</label>
                      <select
                        {...register("sizes")}
                        className="form-control"
                        multiple
                        size={6}
                        style={{ minHeight: "160px" }}
                      >
                        {loadingSizes ? (
                          <option disabled>Loading sizes...</option>
                        ) : sizes.length > 0 ? (
                          sizes.map((s, index) => (
                            <option
                              key={getOptionValue(s) || index}
                              value={String(getOptionValue(s))}
                            >
                              {getOptionLabel(s)}
                            </option>
                          ))
                        ) : (
                          <option disabled>No sizes available</option>
                        )}
                      </select>
                      <small className="text-muted d-block mt-1">
                        Hold Ctrl (Windows) / Cmd (Mac) to select multiple.
                      </small>
                    </div>

                    {/* Price */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        Price <span className="text-danger">*</span>
                      </label>
                      <input
                        {...register("price", {
                          required: "The price field is required",
                        })}
                        type="number"
                        step="0.01"
                        className={`form-control ${errors.price ? "is-invalid" : ""}`}
                        placeholder="Price"
                      />
                      {errors.price && (
                        <p className="invalid-feedback">
                          {errors.price?.message}
                        </p>
                      )}
                    </div>

                    {/* Compare Price */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Compare Price</label>
                      <input
                        {...register("compare_price")}
                        type="number"
                        step="0.01"
                        className="form-control"
                        placeholder="Compare Price"
                      />
                    </div>

                    {/* Discount Type */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Discount Type</label>
                      <select
                        {...register("discount_type")}
                        className="form-control"
                        onChange={(e) => {
                          setValue("discount_type", e.target.value);
                          if (!e.target.value) setValue("discount_value", "");
                        }}
                      >
                        <option value="">No Discount</option>
                        <option value="percent">Percent (%)</option>
                        <option value="amount">Fixed Amount (৳)</option>
                      </select>
                    </div>

                    {/* Discount Value */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        Discount Value{" "}
                        {discountType ? (
                          <span className="text-danger">*</span>
                        ) : null}
                      </label>
                      <input
                        {...register("discount_value")}
                        type="number"
                        step="0.01"
                        className="form-control"
                        placeholder={
                          discountType === "percent" ? "e.g. 10" : "e.g. 200"
                        }
                        disabled={!discountType}
                      />
                      <small className="text-muted">
                        Final Price Preview:{" "}
                        <b>
                          ৳{" "}
                          {Number.isNaN(computedFinalPrice)
                            ? 0
                            : computedFinalPrice}
                        </b>
                      </small>
                    </div>

                    {/* Quantity */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Quantity</label>
                      <input
                        {...register("qty")}
                        type="number"
                        className="form-control"
                        placeholder="Quantity"
                      />
                    </div>

                    {/* Barcode */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Barcode</label>
                      <input
                        {...register("barcode")}
                        type="text"
                        className="form-control"
                        placeholder="Barcode"
                      />
                    </div>

                    {/* Short Description */}
                    <div className="col-md-12 mb-3">
                      <label className="form-label">Short Description</label>
                      <textarea
                        {...register("short_description")}
                        className="form-control"
                        rows="3"
                        placeholder="Short Description"
                      />
                    </div>

                    {/* Description */}
                    <div className="col-md-12 mb-3">
                      <label className="form-label">Description</label>
                      <JoditEditor
                        ref={editor}
                        value={content}
                        config={config}
                        tabIndex={1}
                        onBlur={(newContent) => setContent(newContent)}
                      />
                    </div>

                    {/* Is Featured */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        Is Featured <span className="text-danger">*</span>
                      </label>
                      <select
                        {...register("is_featured", {
                          required: "Please select featured status",
                        })}
                        className={`form-control ${
                          errors.is_featured ? "is-invalid" : ""
                        }`}
                      >
                        <option value="">Select</option>
                        <option value="1">Yes</option>
                        <option value="0">No</option>
                      </select>
                      {errors.is_featured && (
                        <p className="invalid-feedback">
                          {errors.is_featured?.message}
                        </p>
                      )}
                    </div>

                    {/* Status */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        Status <span className="text-danger">*</span>
                      </label>
                      <select
                        {...register("status", {
                          required: "Please select a status",
                        })}
                        className={`form-control ${errors.status ? "is-invalid" : ""}`}
                      >
                        <option value="">Select a Status</option>
                        <option value="1">Active</option>
                        <option value="0">Block</option>
                      </select>
                      {errors.status && (
                        <p className="invalid-feedback">
                          {errors.status?.message}
                        </p>
                      )}
                    </div>

                    {/* Product Images */}
                    <div className="col-md-12 mb-3">
                      <label className="form-label">Product Images</label>
                      <input
                        type="file"
                        className="form-control"
                        accept="image/*"
                        multiple
                        onChange={handleFile}
                      />

                      {previews.length > 0 && (
                        <>
                          <div className="mt-2 text-muted">
                            ✅ First image here will be the <b>Main Image</b>
                          </div>

                          <div className="mt-3 d-flex flex-wrap gap-2">
                            {previews.map((p, idx) => (
                              <div
                                key={p.key}
                                style={{
                                  position: "relative",
                                  width: 120,
                                  height: 120,
                                  border:
                                    idx === 0
                                      ? "2px solid #0d6efd"
                                      : "1px solid #ddd",
                                  borderRadius: 8,
                                  overflow: "hidden",
                                }}
                                title={idx === 0 ? "Main Image" : ""}
                              >
                                <img
                                  src={p.url}
                                  alt={p.name}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                />
                                {idx === 0 && (
                                  <div
                                    style={{
                                      position: "absolute",
                                      bottom: 5,
                                      left: 5,
                                      background: "rgba(13,110,253,0.85)",
                                      color: "#fff",
                                      borderRadius: 6,
                                      padding: "2px 6px",
                                      fontSize: 12,
                                    }}
                                  >
                                    Main
                                  </div>
                                )}
                                <button
                                  type="button"
                                  onClick={() => removeImage(p.key)}
                                  style={{
                                    position: "absolute",
                                    top: 5,
                                    right: 5,
                                    background: "rgba(0,0,0,0.6)",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: 6,
                                    padding: "2px 6px",
                                    cursor: "pointer",
                                  }}
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={disable || imageUploading}
                className="btn btn-primary mt-3 mb-3"
              >
                {disable
                  ? "Creating..."
                  : imageUploading
                    ? "Uploading..."
                    : "Create Product"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Create;
