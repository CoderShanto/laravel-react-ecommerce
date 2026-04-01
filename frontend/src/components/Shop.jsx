/* ===========================
   ✅ Shop.jsx (WITH RATINGS ON PRODUCT CARD)
   - Your existing filtering + analytics stays same
   - ✅ NEW: Fetch each product's avg_rating + total_reviews from:
       GET /api/products/{id}/reviews   (public)
   - ✅ Shows stars + review count on every product card
   =========================== */

import React, { useEffect, useMemo, useRef, useState } from "react";
import Layout from "./common/Layout";
import ProductImg from "../assets/images/eight.jpg";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import AutoCompleteSearch from "./common/AutoCompleteSearch";
import { api, baseUrl } from "./common/http";
import { Rating } from "react-simple-star-rating";

const Shop = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // ✅ read selected from URL
  const urlCategory = searchParams.get("category");
  const urlBrand = searchParams.get("brand");
  const urlMin = searchParams.get("min_price");
  const urlMax = searchParams.get("max_price");

  // (You can remove these if api/baseUrl already exists in your http.js)

  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);

  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  /* ===========================
     ✅ RATINGS CACHE MAP
     ratingsMap[productId] = { avg: number, total: number }
  =========================== */
  const [ratingsMap, setRatingsMap] = useState({});
  const fetchingSetRef = useRef(new Set()); // prevent duplicate requests

  const fetchRatingSummary = async (productId) => {
    if (!productId) return;
    if (ratingsMap[productId]) return; // cached
    if (fetchingSetRef.current.has(productId)) return;

    fetchingSetRef.current.add(productId);

    try {
      // public endpoint, token not required
      const res = await api.get(`/products/${productId}/reviews`);
      const data = res.data;

      if (data?.status === 200) {
        setRatingsMap((prev) => ({
          ...prev,
          [productId]: {
            avg: Number(data.avg_rating || 0),
            total: Number(data.total_reviews || 0),
          },
        }));
      } else {
        setRatingsMap((prev) => ({
          ...prev,
          [productId]: { avg: 0, total: 0 },
        }));
      }
    } catch (err) {
      setRatingsMap((prev) => ({
        ...prev,
        [productId]: { avg: 0, total: 0 },
      }));
    } finally {
      fetchingSetRef.current.delete(productId);
    }
  };

  /* ===========================
     ✅ 1) SAVE SEARCH TERM (DB)
     Table: user_search_terms
  =========================== */
  const trackSearch = async (term) => {
    const q = (term || "").trim();
    if (!q) return;

    try {
      await api.post("/search/track", { term: q });
    } catch (err) {
      // if guest/not logged in -> ignore
    }
  };

  /* ===========================
     ✅ 2) SAVE PRODUCT INTEREST (DB)
     Table: user_product_interest
  =========================== */
  const scoreInterest = async (productId, action = "click") => {
    if (!productId) return;
    try {
      await api.post(`/products/${productId}/interest`, { action });
    } catch (err) {
      // if guest/not logged in -> ignore
    }
  };

  /* ===========================
     ✅ 3) SAVE SHOP FILTER ANALYTICS (DB)
     Table: user_shop_filters
  =========================== */
  const trackFilters = async (payload) => {
    try {
      await api.post("/shop/track-filters", payload);
    } catch (err) {
      // if route is protected and user is guest -> ignore
    }
  };

  /* ===========================
     ✅ When user selects suggestion
  =========================== */
  const handleSelectSuggestion = async (item) => {
    if (!item?.id) return;

    setSearch(item.name || "");

    await trackSearch(item.name || "");
    await scoreInterest(item.id, "click");

    navigate(`/product/${item.id}`);
  };

  /* ===========================
     ✅ load categories + brands + products once
  =========================== */
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const [catRes, brandRes, prodRes] = await Promise.all([
          api.get("/get-categories"),
          api.get("/get-brands"),
          api.get("/get-products"),
        ]);

        setCategories(
          catRes.data?.status === 200 ? catRes.data.data || [] : [],
        );
        setBrands(
          brandRes.data?.status === 200 ? brandRes.data.data || [] : [],
        );
        setAllProducts(
          prodRes.data?.status === 200 ? prodRes.data.data || [] : [],
        );
      } catch (e) {
        console.error(e);
        setCategories([]);
        setBrands([]);
        setAllProducts([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  /* ===========================
     ✅ when URL changes set sidebar selection
  =========================== */
  useEffect(() => {
    if (urlCategory) {
      const id = Number(urlCategory);
      if (!Number.isNaN(id)) setSelectedCategories([id]);
    }

    if (urlBrand) {
      const id = Number(urlBrand);
      if (!Number.isNaN(id)) setSelectedBrands([id]);
    }

    if (urlMin !== null) setMinPrice(urlMin || "");
    if (urlMax !== null) setMaxPrice(urlMax || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlCategory, urlBrand, urlMin, urlMax]);

  /* ===========================
     ✅ keep URL synced with sidebar selections
  =========================== */
  useEffect(() => {
    const params = new URLSearchParams(searchParams);

    if (selectedCategories.length > 0)
      params.set("category", String(selectedCategories[0]));
    else params.delete("category");

    if (selectedBrands.length > 0)
      params.set("brand", String(selectedBrands[0]));
    else params.delete("brand");

    if (minPrice !== "") params.set("min_price", minPrice);
    else params.delete("min_price");

    if (maxPrice !== "") params.set("max_price", maxPrice);
    else params.delete("max_price");

    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategories, selectedBrands, minPrice, maxPrice]);

  const handleCategoryChange = (categoryId) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  };

  const handleBrandChange = (brandId) => {
    setSelectedBrands((prev) =>
      prev.includes(brandId)
        ? prev.filter((id) => id !== brandId)
        : [...prev, brandId],
    );
  };

  // const getProductImage = (product) => {
  //   if (product.image) return `${baseUrl}/uploads/products/small/${product.image}`;
  //   if (product.image_url) return product.image_url;
  //   return ProductImg;
  // };

  const getProductImage = (product) => {
    if (product?.image_url && product.image_url !== "") {
      return product.image_url;
    }

    if (product?.image?.startsWith("http")) {
      return product.image;
    }

    return ProductImg;
  };

  const fixPriceIfInvalid = () => {
    if (
      minPrice !== "" &&
      maxPrice !== "" &&
      Number(minPrice) > Number(maxPrice)
    ) {
      const tmp = minPrice;
      setMinPrice(maxPrice);
      setMaxPrice(tmp);
    }
  };

  const setPreset = (min, max) => {
    setMinPrice(min);
    setMaxPrice(max);
  };

  const clearAll = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setSearchParams({}, { replace: true });
  };

  /* ===========================
     ✅ FILTER HERE (frontend filtering)
  =========================== */
  const filteredProducts = useMemo(() => {
    let list = [...allProducts];

    if (selectedCategories.length > 0) {
      const setCat = new Set(selectedCategories.map(Number));
      list = list.filter((p) => setCat.has(Number(p.category_id)));
    }

    if (selectedBrands.length > 0) {
      const setBrand = new Set(selectedBrands.map(Number));
      list = list.filter((p) => setBrand.has(Number(p.brand_id)));
    }

    const min = minPrice === "" ? null : Number(minPrice);
    const max = maxPrice === "" ? null : Number(maxPrice);

    if (min !== null && !Number.isNaN(min))
      list = list.filter((p) => Number(p.price) >= min);
    if (max !== null && !Number.isNaN(max))
      list = list.filter((p) => Number(p.price) <= max);

    const q = search.trim().toLowerCase();
    if (q) list = list.filter((p) => (p.title || "").toLowerCase().includes(q));

    return list;
  }, [
    allProducts,
    selectedCategories,
    selectedBrands,
    minPrice,
    maxPrice,
    search,
  ]);

  /* ===========================
     ✅ TRACK FILTERS TO DB (debounced)
  =========================== */
  const lastPayloadRef = useRef("");

  useEffect(() => {
    const t = setTimeout(() => {
      const payload = {
        query: search.trim() || null,
        category_ids: selectedCategories.map(Number),
        brand_ids: selectedBrands.map(Number),
        min_price: minPrice === "" ? null : Number(minPrice),
        max_price: maxPrice === "" ? null : Number(maxPrice),
        results_found: filteredProducts.length > 0,
        results_count: filteredProducts.length,
      };

      const key = JSON.stringify(payload);
      if (lastPayloadRef.current === key) return;
      lastPayloadRef.current = key;

      trackFilters(payload);
    }, 500);

    return () => clearTimeout(t);
  }, [
    search,
    selectedCategories,
    selectedBrands,
    minPrice,
    maxPrice,
    filteredProducts.length,
  ]);

  /* ===========================
     ✅ FETCH RATINGS FOR VISIBLE PRODUCTS (debounced)
     - avoids too many requests
     - fetch only first 40 cards (you can change)
  =========================== */
  useEffect(() => {
    const t = setTimeout(() => {
      const visible = filteredProducts.slice(0, 40);
      visible.forEach((p) => fetchRatingSummary(p.id));
    }, 250);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredProducts]);

  return (
    <Layout>
      <div className="container-fluid px-4">
        <nav aria-label="breadcrumb" className="py-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link to="/">Home</Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              Shop
            </li>
          </ol>
        </nav>

        <div className="row">
          {/* Sidebar */}
          <div className="col-lg-2 col-md-3">
            {/* Categories */}
            <div className="card shadow border-0 mb-3">
              <div className="card-body p-4">
                <h5 className="mb-3">Categories</h5>
                {categories.length > 0 ? (
                  <ul
                    style={{
                      listStyle: "none",
                      paddingLeft: 0,
                      marginBottom: 0,
                    }}
                  >
                    {categories.map((category) => (
                      <li key={category.id} className="mb-2">
                        <input
                          type="checkbox"
                          id={`category-${category.id}`}
                          checked={selectedCategories.includes(category.id)}
                          onChange={() => handleCategoryChange(category.id)}
                        />
                        <label
                          htmlFor={`category-${category.id}`}
                          className="ps-2"
                          style={{ cursor: "pointer" }}
                        >
                          {category.name}
                        </label>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted mb-0">No categories available</p>
                )}
              </div>
            </div>

            {/* Brands */}
            <div className="card shadow border-0 mb-3">
              <div className="card-body p-4">
                <h5 className="mb-3">Brands</h5>
                {brands.length > 0 ? (
                  <ul
                    style={{
                      listStyle: "none",
                      paddingLeft: 0,
                      marginBottom: 0,
                    }}
                  >
                    {brands.map((brand) => (
                      <li key={brand.id} className="mb-2">
                        <input
                          type="checkbox"
                          id={`brand-${brand.id}`}
                          checked={selectedBrands.includes(brand.id)}
                          onChange={() => handleBrandChange(brand.id)}
                        />
                        <label
                          htmlFor={`brand-${brand.id}`}
                          className="ps-2"
                          style={{ cursor: "pointer" }}
                        >
                          {brand.name}
                        </label>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted mb-0">No brands available</p>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="card shadow border-0 mb-3">
              <div className="card-body p-4">
                <h5 className="mb-3">Price</h5>

                <div className="mb-2">
                  <label className="form-label small mb-1">Min</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    placeholder="0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    onBlur={fixPriceIfInvalid}
                    min="0"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small mb-1">Max</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    placeholder="1000"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    onBlur={fixPriceIfInvalid}
                    min="0"
                  />
                </div>

                <div className="d-flex flex-wrap gap-2 mb-3">
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    type="button"
                    onClick={() => setPreset("", "100")}
                  >
                    Under 100
                  </button>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    type="button"
                    onClick={() => setPreset("100", "500")}
                  >
                    100–500
                  </button>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    type="button"
                    onClick={() => setPreset("500", "1000")}
                  >
                    500–1000
                  </button>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    type="button"
                    onClick={() => setPreset("1000", "")}
                  >
                    1000+
                  </button>
                </div>

                <button
                  className="btn btn-light btn-sm w-100"
                  type="button"
                  onClick={() => setPreset("", "")}
                >
                  Clear Price
                </button>
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="col-lg-10 col-md-9">
            {/* Search + Clear */}
            <div className="d-flex gap-2 align-items-center mb-4">
              <div style={{ flex: 1 }}>
                <AutoCompleteSearch
                  value={search}
                  onChange={setSearch}
                  onSelect={handleSelectSuggestion}
                  onEnterSearch={trackSearch}
                  placeholder="Search product by title..."
                />
              </div>

              <button className="btn btn-outline-secondary" onClick={clearAll}>
                Clear
              </button>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <div className="row pb-5">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => {
                    // discount calc (keep your logic)
                    let discountedPrice = product.price;
                    let discountPercentLocal = 0;
                    let hasDiscountLocal = false;

                    if (product.discount_value && product.discount_value > 0) {
                      hasDiscountLocal = true;

                      if (product.discount_type === "percent") {
                        discountPercentLocal = product.discount_value;
                        discountedPrice =
                          product.price -
                          product.price * (product.discount_value / 100);
                      } else if (product.discount_type === "fixed") {
                        discountedPrice =
                          product.price - product.discount_value;
                        discountPercentLocal = Math.round(
                          (product.discount_value / product.price) * 100,
                        );
                      }
                    }

                    discountedPrice = Math.max(0, discountedPrice);

                    const r = ratingsMap[product.id] || { avg: 0, total: 0 };

                    return (
                      <div
                        key={product.id}
                        className="col-lg-3 col-md-4 col-6 mb-4"
                      >
                        <div className="product-card-modern">
                          {/* Discount Badge */}
                          {hasDiscountLocal && (
                            <div className="discount-badge">
                              <span className="discount-percent">
                                {discountPercentLocal}%
                              </span>
                              <span className="discount-text">OFF</span>
                            </div>
                          )}

                          {/* Hot Deal Badge */}
                          {hasDiscountLocal && discountPercentLocal >= 30 && (
                            <div className="hot-deal-badge">🔥 HOT DEAL</div>
                          )}

                          {/* Product Image */}
                          <div className="product-image-wrapper">
                            <Link
                              to={`/product/${product.id}`}
                              onClick={() => scoreInterest(product.id, "click")}
                            >
                              <img
                                src={getProductImage(product)}
                                alt={product.title}
                                className="product-image"
                                onError={(e) => {
                                  e.target.src = ProductImg;
                                }}
                              />
                            </Link>

                            {/* Quick Add to Cart Button */}
                            <div className="quick-add-overlay">
                              <button
                                className="btn-quick-add"
                                onClick={(e) => {
                                  e.preventDefault();
                                  navigate(`/product/${product.id}`);
                                }}
                              >
                                <svg
                                  width="20"
                                  height="20"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <circle cx="9" cy="21" r="1" />
                                  <circle cx="20" cy="21" r="1" />
                                  <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                                </svg>
                                <span>Add to Cart</span>
                              </button>
                            </div>
                          </div>

                          {/* Product Info */}
                          <div className="product-info">
                            <Link
                              to={`/product/${product.id}`}
                              onClick={() => scoreInterest(product.id, "click")}
                              className="product-title"
                            >
                              {product.title}
                            </Link>

                            {/* ✅ RATINGS ROW */}
                            <div className="ratings-row">
                              <Rating size={16} readonly initialValue={r.avg} />
                              <span className="ratings-text">
                                {r.avg.toFixed(1)} ({r.total})
                              </span>
                            </div>

                            {product.short_description && (
                              <p className="product-description">
                                {product.short_description.length > 50
                                  ? `${product.short_description}...`
                                  : product.short_description}
                              </p>
                            )}

                            {/* Price */}
                            <div className="product-price-section">
                              <div className="price-wrapper">
                                {hasDiscountLocal ? (
                                  <>
                                    <span className="current-price">
                                      ৳{Number(discountedPrice).toFixed(0)}
                                    </span>
                                    <span className="original-price">
                                      ৳{Number(product.price).toFixed(0)}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span className="current-price">
                                      ৳{Number(product.price).toFixed(0)}
                                    </span>
                                    {product.compare_price && (
                                      <span className="original-price">
                                        ৳
                                        {Number(product.compare_price).toFixed(
                                          0,
                                        )}
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-12 text-center py-5">
                    <p className="text-muted">
                      No products found. Try searching or adjusting filters.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <style jsx>{`
            .product-card-modern {
              position: relative;
              background: #fff;
              border-radius: 16px;
              overflow: hidden;
              transition: all 0.3s ease;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
              height: 100%;
              display: flex;
              flex-direction: column;
            }

            .product-card-modern:hover {
              transform: translateY(-8px);
              box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
            }

            .discount-badge {
              position: absolute;
              top: 12px;
              right: 12px;
              background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
              color: white;
              padding: 8px 12px;
              border-radius: 8px;
              z-index: 10;
              display: flex;
              flex-direction: column;
              align-items: center;
              box-shadow: 0 4px 12px rgba(238, 90, 111, 0.4);
              animation: pulse 2s infinite;
            }

            @keyframes pulse {
              0%,
              100% {
                transform: scale(1);
              }
              50% {
                transform: scale(1.05);
              }
            }

            .discount-percent {
              font-size: 18px;
              font-weight: 700;
              line-height: 1;
            }

            .discount-text {
              font-size: 10px;
              font-weight: 600;
              letter-spacing: 0.5px;
              margin-top: 2px;
            }

            .hot-deal-badge {
              position: absolute;
              top: 12px;
              left: 12px;
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
              color: white;
              padding: 6px 12px;
              border-radius: 20px;
              font-size: 11px;
              font-weight: 700;
              letter-spacing: 0.5px;
              z-index: 10;
              box-shadow: 0 4px 12px rgba(245, 87, 108, 0.4);
              animation: shake 3s infinite;
            }

            @keyframes shake {
              0%,
              100% {
                transform: rotate(0deg);
              }
              10% {
                transform: rotate(-3deg);
              }
              20% {
                transform: rotate(3deg);
              }
              30% {
                transform: rotate(-3deg);
              }
              40% {
                transform: rotate(3deg);
              }
              50% {
                transform: rotate(0deg);
              }
            }

            .product-image-wrapper {
              position: relative;
              overflow: hidden;
              background: #f8f9fa;
            }

            .product-image {
              width: 100%;
              height: 400px;
              object-fit: cover;
              transition: transform 0.4s ease;
            }

            .product-card-modern:hover .product-image {
              transform: scale(1.08);
            }

            .quick-add-overlay {
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
              padding: 16px;
              background: linear-gradient(
                to top,
                rgba(0, 0, 0, 0.8),
                transparent
              );
              transform: translateY(100%);
              transition: transform 0.3s ease;
            }

            .product-card-modern:hover .quick-add-overlay {
              transform: translateY(0);
            }

            .btn-quick-add {
              width: 100%;
              background: #fff;
              color: #333;
              border: none;
              padding: 12px 20px;
              border-radius: 8px;
              font-weight: 600;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              cursor: pointer;
              transition: all 0.2s ease;
            }

            .btn-quick-add:hover {
              background: #f8f9fa;
              transform: scale(1.02);
            }

            .product-info {
              padding: 16px;
              flex: 1;
              display: flex;
              flex-direction: column;
            }

            .product-title {
              font-size: 16px;
              font-weight: 600;
              color: #333;
              text-decoration: none;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
              margin-bottom: 6px;
              transition: color 0.2s ease;
            }

            .product-title:hover {
              color: #007bff;
            }

            /* ✅ rating row */
            .ratings-row {
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 10px;
            }

            .ratings-text {
              font-size: 12px;
              color: #6c757d;
              line-height: 1;
              white-space: nowrap;
            }

            .product-description {
              font-size: 13px;
              color: #6c757d;
              margin-bottom: 12px;
              flex: 1;
            }

            .product-price-section {
              margin-top: auto;
            }

            .price-wrapper {
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 6px;
            }

            .current-price {
              font-size: 22px;
              font-weight: 700;
              color: #2d3748;
            }

            .original-price {
              font-size: 16px;
              color: #a0aec0;
              text-decoration: line-through;
            }

            @media (max-width: 768px) {
              .product-image {
                height: 250px;
              }

              .current-price {
                font-size: 18px;
              }

              .quick-add-overlay {
                transform: translateY(0);
                background: linear-gradient(
                  to top,
                  rgba(0, 0, 0, 0.9),
                  transparent
                );
              }
            }

            @media (max-width: 576px) {
              .product-card-modern {
                border-radius: 12px;
              }

              .product-info {
                padding: 12px;
              }

              .product-title {
                font-size: 14px;
              }
            }
          `}</style>
        </div>
      </div>
    </Layout>
  );
};

export default Shop;
