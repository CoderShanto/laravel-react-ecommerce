import React, { useEffect, useRef, useState } from "react";
import ProductImg from "../../assets/images/eleven.jpg";
import { Link, useNavigate } from "react-router-dom";
import { api, baseUrl } from "../common/http"; // ✅ adjust path if needed
import { Rating } from "react-simple-star-rating";

const FeaturedProducts = ({ limit = 8, title = "Featured Products" }) => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);



  // ✅ ratings cache
  const [ratingsMap, setRatingsMap] = useState({});
  const fetchingSetRef = useRef(new Set());

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

  // ✅ optional: interest tracking on click
  const scoreInterest = async (productId, action = "click") => {
    if (!productId) return;
    try {
      await api.post(`/products/${productId}/interest`, { action });
    } catch {
      // ignore guest error
    }
  };

  useEffect(() => {
    fetchFeaturedProducts();
    // eslint-disable-next-line
  }, [limit]);

  const fetchFeaturedProducts = async () => {
  try {
    setLoading(true);

    const res = await api.get(`/get-featured-products?limit=${limit}`);
    const result = res.data;

    if (result?.status === 200) {
      setProducts(result.data || []);
    } else {
      setProducts([]);
    }
  } catch (error) {
    console.error("Error fetching featured products:", error);
    setProducts([]);
  } finally {
    setLoading(false);
  }
};

  const getProductImage = (product) => {
    if (product?.image) return `${baseUrl}/uploads/products/small/${product.image}`;
    if (product?.image_url) return product.image_url;
    return ProductImg;
  };

  if (loading) return null;
  if (!products.length) return null;

  return (
    <section className="section-2 py-5">
      <div className="container">
        {/* Header */}
        <div className="d-flex align-items-end justify-content-between mb-3">
          <div>
            <h2 className="mb-1">{title}</h2>
            <div className="text-muted small">Hand-picked items for you</div>
          </div>

          {/* <Link to="/shop" className="btn btn-outline-dark btn-sm">
            View all
          </Link> */}
        </div>

        <div className="row">
          {products.map((product) => {
            // ✅ SAME discount logic as Shop.jsx
            let discountedPrice = product.price;
            let discountPercentLocal = 0;
            let hasDiscountLocal = false;

            if (product.discount_value && product.discount_value > 0) {
              hasDiscountLocal = true;

              if (product.discount_type === "percent") {
                discountPercentLocal = product.discount_value;
                discountedPrice =
                  product.price - product.price * (product.discount_value / 100);
              } else if (product.discount_type === "fixed") {
                discountedPrice = product.price - product.discount_value;
                discountPercentLocal = Math.round(
                  (product.discount_value / product.price) * 100
                );
              }
            }

            discountedPrice = Math.max(0, discountedPrice);

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
                  {hasDiscountLocal && discountPercentLocal >= 30 && (
                    <div className="hot-deal-badge">🔥 HOT DEAL</div>
                  )}

                  {/* Product Image */}
                  <div className="product-image-wrapper">
                    <Link
                      to={`/product/${product.id}`}
                      onClick={() => scoreInterest(product.id, "click")}
                      onMouseEnter={() => fetchRatingSummary(product.id)}
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

                    {/* Quick view (go to product page like Shop) */}
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

                  {/* Product Info */}
                  <div className="product-info">
                    <Link
                      to={`/product/${product.id}`}
                      onClick={() => scoreInterest(product.id, "click")}
                      onMouseEnter={() => fetchRatingSummary(product.id)}
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
                          ? `${product.short_description.slice(0, 50)}...`
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
                                ৳{Number(product.compare_price).toFixed(0)}
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
          })}
        </div>

        {/* ✅ SAME CARD CSS AS SHOP (home size) */}
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
            animation: pulse 2s infinite;
          }

          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
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
            0%, 100% { transform: rotate(0deg); }
            10% { transform: rotate(-3deg); }
            20% { transform: rotate(3deg); }
            30% { transform: rotate(-3deg); }
            40% { transform: rotate(3deg); }
            50% { transform: rotate(0deg); }
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
            font-weight: 700;
            color: #2d3748;
          }

          .original-price {
            font-size: 14px;
            color: #a0aec0;
            text-decoration: line-through;
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

export default FeaturedProducts;