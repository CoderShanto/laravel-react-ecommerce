import React, { useEffect, useRef, useState } from "react";
import ProductImg from "../../assets/images/eight.jpg";
import { Link, useNavigate } from "react-router-dom";
import { api, apiUrl } from "../common/http"; // ✅ use your http.js helpers
import { Rating } from "react-simple-star-rating";

const HomeRecommendations = ({ limit = 8, title = "Recommended for you" }) => {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ ratings cache: ratingsMap[productId] = { avg, total }
  const [ratingsMap, setRatingsMap] = useState({});
  const fetchingSetRef = useRef(new Set());

  // ✅ derive base url from apiUrl (http://localhost:8000/api -> http://localhost:8000)
  const baseUrl = (apiUrl || "http://localhost:8000/api").replace(/\/api\/?$/, "");

  const fetchRatingSummary = async (productId) => {
    if (!productId) return;
    if (ratingsMap[productId]) return;
    if (fetchingSetRef.current.has(productId)) return;

    fetchingSetRef.current.add(productId);
    try {
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
        setRatingsMap((prev) => ({ ...prev, [productId]: { avg: 0, total: 0 } }));
      }
    } catch {
      setRatingsMap((prev) => ({ ...prev, [productId]: { avg: 0, total: 0 } }));
    } finally {
      fetchingSetRef.current.delete(productId);
    }
  };

  // ✅ optional: interest tracking on click (your endpoint)
  const scoreInterest = async (productId, action = "click") => {
    if (!productId) return;
    try {
      await api.post(`/products/${productId}/interest`, { action });
    } catch {
      // ignore (guest/no endpoint)
    }
  };

  useEffect(() => {
    fetchRecommendations();
    // eslint-disable-next-line
  }, [limit]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);

      // ✅ AUTH: axios instance should include token
      const res = await api.get(`/recommendations?limit=${limit}`);
      const result = res.data;

      if (result?.status === 200) setItems(result.data || []);
      else setItems([]);
    } catch (e) {
      console.error("Recommendations fetch error:", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ IMAGE FIX: handle different formats + missing port
  const getImage = (p) => {
    if (!p) return ProductImg;

    // 1) if api provides image_url
    if (p.image_url) {
      // fix: http://localhost/uploads/... -> http://localhost:8000/uploads/...
      if (p.image_url.startsWith("http://localhost/uploads")) {
        return p.image_url.replace("http://localhost", baseUrl);
      }
      // normalize accidental double slashes
      return p.image_url.replace(/([^:]\/)\/+/g, "$1");
    }

    // 2) if api provides only filename in `image`
    if (p.image) {
      return `${baseUrl}/uploads/products/small/${p.image}`;
    }

    // 3) fallback
    return ProductImg;
  };

  // ✅ SAME discount logic as your section
  const computeDiscount = (product) => {
    const price = Number(product?.price || 0);
    let discountedPrice = price;
    let discountPercentLocal = 0;
    let hasDiscountLocal = false;

    const dv = Number(product?.discount_value || 0);

    if (dv > 0 && product?.discount_type) {
      hasDiscountLocal = true;

      if (product.discount_type === "percent") {
        discountPercentLocal = dv;
        discountedPrice = price - price * (dv / 100);
      } else if (product.discount_type === "fixed" || product.discount_type === "amount") {
        discountedPrice = price - dv;
        discountPercentLocal = price > 0 ? Math.round((dv / price) * 100) : 0;
      }
    }

    discountedPrice = Math.max(0, discountedPrice);

    return { hasDiscountLocal, discountPercentLocal, discountedPrice };
  };

  if (loading) return null;
  if (!items.length) return null;

  return (
    <section className="section-2 py-5">
      <div className="container">
        {/* Header */}
        <div className="d-flex align-items-end justify-content-between mb-3">
          <div>
            <h2 className="mb-1">{title}</h2>
            <div className="text-muted small">Based on your activity</div>
          </div>

          <div className="d-flex gap-2">
            {/* <button className="btn btn-outline-secondary btn-sm" type="button" onClick={fetchRecommendations}>
              Refresh
            </button> */}
            {/* optional */}
            {/* <Link to="/shop" className="btn btn-outline-dark btn-sm">View all</Link> */}
          </div>
        </div>

        <div className="row">
          {items.map((product) => {
            if (!product?.id) return null;

            const { hasDiscountLocal, discountPercentLocal, discountedPrice } = computeDiscount(product);
            const r = ratingsMap[product.id] || { avg: 0, total: 0 };

            return (
              <div key={product.id} className="col-lg-3 col-md-4 col-6 mb-4">
                <div className="product-card-modern">
                  {/* Discount Badge */}
                  {hasDiscountLocal && (
                    <div className="discount-badge">
                      <span className="discount-percent">{discountPercentLocal}%</span>
                      <span className="discount-text">OFF</span>
                    </div>
                  )}

                  {/* Hot Deal Badge */}
                  {hasDiscountLocal && discountPercentLocal >= 30 && <div className="hot-deal-badge">🔥 HOT DEAL</div>}

                  {/* Product Image */}
                  <div className="product-image-wrapper">
                    <Link
                      to={`/product/${product.id}`}
                      onClick={() => scoreInterest(product.id, "click")}
                      onMouseEnter={() => fetchRatingSummary(product.id)}
                    >
                      <img
                        src={getImage(product)}
                        alt={product.title}
                        className="product-image"
                        onError={(e) => {
                          e.currentTarget.src = ProductImg;
                        }}
                      />
                    </Link>

                    {/* Quick Button */}
                    <div className="quick-add-overlay">
                      <button
                        className="btn-quick-add"
                        type="button"
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
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                        <span>View Product</span>
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="product-info">
                    <Link
                      to={`/product/${product.id}`}
                      onClick={() => scoreInterest(product.id, "click")}
                      onMouseEnter={() => fetchRatingSummary(product.id)}
                      className="product-title"
                    >
                      {product.title}
                    </Link>

                    {/* Ratings */}
                    <div className="ratings-row">
                      <Rating size={16} readonly initialValue={r.avg} />
                      <span className="ratings-text">
                        {r.avg.toFixed(1)} ({r.total})
                      </span>
                    </div>

                    {product.short_description && (
                      <p className="product-description">
                        {product.short_description.length > 50
                          ? `${product.short_description.slice(0, 50)}...`
                          : product.short_description}
                      </p>
                    )}

                    {/* Price */}
                    <div className="product-price-section">
                      <div className="price-wrapper">
                        {hasDiscountLocal ? (
                          <>
                            <span className="current-price">৳{Number(discountedPrice).toFixed(0)}</span>
                            <span className="original-price">৳{Number(product.price).toFixed(0)}</span>
                          </>
                        ) : (
                          <>
                            <span className="current-price">৳{Number(product.price).toFixed(0)}</span>
                            {product.compare_price && (
                              <span className="original-price">৳{Number(product.compare_price).toFixed(0)}</span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ✅ SAME CARD CSS AS YOUR PopularProducts */}
        <style>{`
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
          }

          .product-image-wrapper {
            position: relative;
            overflow: hidden;
            background: #f8f9fa;
          }

          .product-image {
            width: 100%;
            height: 320px;
            object-fit: cover;
            transition: transform 0.4s ease;
            display:block;
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
            background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
            transform: translateY(100%);
            transition: transform 0.3s ease;
          }

          .product-card-modern:hover .quick-add-overlay {
            transform: translateY(0);
          }

          .btn-quick-add {
            width: 100%;
            background: #fff;
            color: #111;
            border: none;
            padding: 12px 20px;
            border-radius: 10px;
            font-weight: 700;
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
            font-weight: 700;
            color: #333;
            text-decoration: none;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            margin-bottom: 6px;
          }

          .product-title:hover {
            text-decoration: underline;
          }

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
            font-size: 20px;
            font-weight: 800;
            color: #2d3748;
          }

          .original-price {
            font-size: 14px;
            color: #a0aec0;
            text-decoration: line-through;
            font-weight: 600;
          }

          @media (max-width: 768px) {
            .product-image { height: 220px; }
            .current-price { font-size: 18px; }
            .quick-add-overlay { transform: translateY(0); }
          }
        `}</style>
      </div>
    </section>
  );
};

export default HomeRecommendations;