import React, { useContext, useEffect, useMemo, useState } from "react";
import Layout from "./common/Layout";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Thumbs, FreeMode, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";
import "swiper/css/thumbs";
import { Rating } from "react-simple-star-rating";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import { apiUrl, api, userToken } from "./common/http"; // ✅ use your http.js helpers + axios instance
import { CartContext } from "./context/Cart";
import { toast } from "react-toastify";
import HomeRecommendations from "./common/HomeRecommendations";

const Product = () => {
  const [thumbsSwiper, setThumbsSwiper] = useState(null);

  const [product, setProduct] = useState({});
  const [allImages, setAllImages] = useState([]);
  const [productSizes, setProductSizes] = useState([]);
  const [sizeSelected, setSizeSelected] = useState(null);

  // ✅ Reviews (public)
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  // ✅ Can review (auth-only)
  const [canReview, setCanReview] = useState(false);
  const [reviewMeta, setReviewMeta] = useState({
    hasBought: false,
    alreadyReviewed: false,
  });

  // ✅ Review form
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const params = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);

  // ✅ token is stored in localStorage userInfo.token (from your http.js)
  const token = userToken();
  const isLoggedIn = !!token;

  // ✅ Draft key per product
  const draftKey = useMemo(() => `review_draft_${params.id}`, [params.id]);

  // ✅ money formatter (NO floating garbage)
  const money = (n) => Math.round(Number(n || 0));

  // ✅ calculate final price from discount fields
  const getFinalPrice = (p) => {
    const price = Number(p?.price || 0);

    if (!p?.discount_type || p?.discount_value == null) return money(price);

    if (p.discount_type === "percent") {
      const percent = Number(p.discount_value || 0);
      const final = price - (price * percent) / 100;
      return money(Math.max(0, final));
    }

    if (p.discount_type === "amount") {
      const amount = Number(p.discount_value || 0);
      const final = price - amount;
      return money(Math.max(0, final));
    }

    return money(price);
  };

  // ✅ calculate discount percent (for badge)
  const getDiscountPercent = (p) => {
    const price = Number(p?.price || 0);
    const finalPrice = getFinalPrice(p);
    if (price <= 0) return 0;

    const pct = Math.round(((price - finalPrice) / price) * 100);
    return pct < 0 ? 0 : pct;
  };

  const finalPrice = useMemo(() => getFinalPrice(product), [product]);
  const originalPrice = useMemo(() => money(product?.price), [product]);
  const discountPercent = useMemo(() => getDiscountPercent(product), [product]);

  // ✅ only show discount UI if real discount exists
  const hasDiscount = useMemo(() => {
    return (
      product?.discount_type &&
      product?.discount_value != null &&
      finalPrice < originalPrice &&
      discountPercent > 0
    );
  }, [product, finalPrice, originalPrice, discountPercent]);

  const saving = useMemo(() => money(originalPrice - finalPrice), [originalPrice, finalPrice]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`${apiUrl}/get-product/${params.id}`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      const result = await res.json();

      if (result.status === 200) {
        const data = result.data;
        setProduct(data);

        // sizes
        setProductSizes(data.product_sizes || []);

        // images
        const images = [];
        if (data.image_url) images.push({ id: "main", image_url: data.image_url, is_main: true });
        if (data.product_images?.length) images.push(...data.product_images);
        setAllImages(images);
      } else {
        toast.error("Product not found");
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error("Failed to load product");
    }
  };

  // ✅ Public reviews
  const fetchReviews = async () => {
    try {
      const res = await fetch(`${apiUrl}/products/${params.id}/reviews`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      const data = await res.json();

      if (data.status === 200) {
        setReviews(data.reviews || []);
        setAvgRating(Number(data.avg_rating || 0));
        setTotalReviews(Number(data.total_reviews || 0));
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  // ✅ Auth-only: can-review (uses axios instance with interceptor)
  const fetchCanReview = async () => {
    if (!isLoggedIn) {
      setCanReview(false);
      setReviewMeta({ hasBought: false, alreadyReviewed: false });
      return;
    }

    try {
      const res = await api.get(`/products/${params.id}/reviews/can-review`);
      const data = res.data;

      if (data.status === 200) {
        setCanReview(!!data.can_review);
        setReviewMeta({
          hasBought: !!data.has_bought,
          alreadyReviewed: !!data.already_reviewed,
        });
      } else {
        setCanReview(false);
        setReviewMeta({ hasBought: false, alreadyReviewed: false });
      }
    } catch (error) {
      console.error("Error fetching can-review:", error);
      setCanReview(false);
      setReviewMeta({ hasBought: false, alreadyReviewed: false });
    }
  };

  // ✅ Draft load
  useEffect(() => {
    try {
      const draft = localStorage.getItem(draftKey);
      if (draft) {
        const d = JSON.parse(draft);
        setMyRating(d.rating || 0);
        setMyComment(d.comment || "");
      }
    } catch (e) {
      // ignore
    }
  }, [draftKey]);

  const saveDraft = () => {
    localStorage.setItem(draftKey, JSON.stringify({ rating: myRating, comment: myComment }));
    toast.success("Draft saved!");
  };

  const clearDraft = () => {
    localStorage.removeItem(draftKey);
    toast.info("Draft cleared!");
    setMyRating(0);
    setMyComment("");
  };

  // ✅ Submit review (uses axios instance with interceptor)
  const handleSubmitReview = async () => {
    if (!isLoggedIn) {
      toast.error("Please login to submit a review");
      return;
    }

    if (!canReview) {
      if (reviewMeta.alreadyReviewed) toast.error("You already reviewed this product.");
      else if (!reviewMeta.hasBought) toast.error("Only verified buyers can review this product.");
      else toast.error("You can’t review this product right now.");
      return;
    }

    if (!myRating) {
      toast.error("Please select a rating");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/products/${params.id}/reviews`, {
        rating: myRating,
        comment: myComment,
      });

      if (res.status === 201) {
        toast.success(res.data?.message || "Review submitted successfully");
        localStorage.removeItem(draftKey);
        setMyRating(0);
        setMyComment("");

        await fetchReviews();
        await fetchCanReview(); // after submit it will become false (already reviewed)
      } else {
        toast.error(res.data?.message || "Failed to submit review");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddToCart = () => {
    if (productSizes.length > 0) {
      if (sizeSelected == null) {
        toast.error("Please select a size");
        return;
      }
      addToCart(product, sizeSelected);
    } else {
      addToCart(product, null);
    }

    toast.success("Product successfully added to cart");
    navigate("/cart");
  };

  useEffect(() => {
    fetchProduct();
    fetchReviews();
    fetchCanReview();
    // eslint-disable-next-line
  }, []);

  return (
    <Layout>
      <div className="container product-detail">
        <div className="row">
          <div className="col-md-12">
            <nav aria-label="breadcrumb" className="py-4">
              <ol className="breadcrumb">
                <li className="breadcrumb-item">
                  <Link to="/">Home</Link>
                </li>
                <li className="breadcrumb-item" aria-current="page">
                  <Link to="/shop">Shop</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  {product.title || "Product"}
                </li>
              </ol>
            </nav>
          </div>
        </div>

        <div className="row mb-5">
          {/* LEFT: images */}
          <div className="col-md-5">
            <div className="row">
              <div className="col-2">
                <Swiper
                  style={{ "--swiper-navigation-color": "#000", "--swiper-pagination-color": "#000" }}
                  onSwiper={setThumbsSwiper}
                  direction={"vertical"}
                  spaceBetween={10}
                  slidesPerView={6}
                  freeMode={true}
                  watchSlidesProgress={true}
                  modules={[FreeMode, Navigation, Thumbs]}
                  className="mySwiper mt-2"
                >
                  {allImages?.map((image, index) => (
                    <SwiperSlide key={image.id || index}>
                      <div className="content">
                        <img
                          src={image.image_url}
                          alt={`Product ${index + 1}`}
                          height={100}
                          className="w-100"
                        />
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>

              <div className="col-10">
                <Swiper
                  style={{ "--swiper-navigation-color": "#000", "--swiper-pagination-color": "#000" }}
                  loop={allImages.length > 1}
                  spaceBetween={0}
                  navigation={true}
                  thumbs={{
                    swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null,
                  }}
                  modules={[FreeMode, Navigation, Thumbs]}
                  className="mySwiper2"
                >
                  {allImages?.map((image, index) => (
                    <SwiperSlide key={image.id || index}>
                      <div className="content">
                        <img src={image.image_url} alt={`Product ${index + 1}`} className="w-100" />
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            </div>
          </div>

          {/* RIGHT: info */}
          <div className="col-md-7">
            <h2 className="mb-2">{product.title}</h2>

            <div className="d-flex align-items-center mb-2">
              <Rating size={20} readonly initialValue={avgRating} />
              <span className="pt-1 ps-2">{totalReviews} Reviews</span>
            </div>

            {/* PRICE + DISCOUNT */}
            <div className="py-3">
              <div className="d-flex align-items-center gap-3">
                <div className="price h3 mb-0">৳{finalPrice}</div>

                {hasDiscount && (
                  <span className="badge" style={{ background: "#ff4d4f", color: "#fff" }}>
                    -{discountPercent}%
                  </span>
                )}
              </div>

              {hasDiscount && (
                <div className="mt-2">
                  <span className="text-muted text-decoration-line-through me-2">৳{originalPrice}</span>
                  <span className="text-success fw-semibold">Save ৳{saving}</span>
                </div>
              )}
            </div>

            <div>{product.short_description}</div>

            {/* Sizes */}
            <div className="pt-3">
              <strong>Select Size </strong>
              <div className="sizes pt-2">
                {productSizes?.map((ps) => {
                  const sizeName = ps?.size?.name;
                  if (!sizeName) return null;

                  return (
                    <button
                      key={ps.id ?? ps.size_id}
                      onClick={() => setSizeSelected(sizeName)}
                      className={`btn btn-size me-2 ${sizeSelected === sizeName ? "active" : ""}`}
                      type="button"
                    >
                      {sizeName}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="add-to-card my-4">
              <button onClick={handleAddToCart} className="btn btn-primary text-uppercase" type="button">
                Add To Cart
              </button>
            </div>

            <hr />

            <div>
              <strong>SKU: </strong>
              {product.sku}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="row pb-5">
          <div className="col-md-12">
            <Tabs defaultActiveKey="description" id="uncontrolled-tab-example" className="mb-3">
              <Tab eventKey="description" title="Description">
                {product.description}
              </Tab>

              <Tab eventKey="reviews" title={`Reviews (${totalReviews})`}>
                <div className="mb-4">
                  <h5 className="mb-2">Customer Reviews</h5>
                  <div className="d-flex align-items-center">
                    <Rating size={22} readonly initialValue={avgRating} />
                    <span className="ms-2">
                      {avgRating} out of 5 ({totalReviews} reviews)
                    </span>
                  </div>
                </div>

                {/* Review form */}
                {isLoggedIn ? (
                  canReview ? (
                    <div className="card p-3 mb-4">
                      <h6 className="mb-2">Write a Review (Verified Buyer)</h6>

                      <div className="mb-2">
                        <Rating size={24} initialValue={myRating} onClick={(rate) => setMyRating(rate)} />
                      </div>

                      <textarea
                        className="form-control mb-3"
                        rows="3"
                        placeholder="Write your review..."
                        value={myComment}
                        onChange={(e) => setMyComment(e.target.value)}
                      />

                      <div className="d-flex gap-2">
                        <button className="btn btn-secondary" type="button" onClick={saveDraft}>
                          Save Draft
                        </button>
                        <button className="btn btn-outline-secondary" type="button" onClick={clearDraft}>
                          Clear
                        </button>
                        <button
                          className="btn btn-primary"
                          type="button"
                          onClick={handleSubmitReview}
                          disabled={submitting}
                        >
                          {submitting ? "Submitting..." : "Submit Review"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="alert alert-warning">
                      {reviewMeta.alreadyReviewed
                        ? "You already reviewed this product."
                        : reviewMeta.hasBought
                        ? "You can’t review right now."
                        : "Only verified buyers (who purchased this product) can write a review."}
                    </div>
                  )
                ) : (
                  <div className="alert alert-info">Please login to write a review.</div>
                )}

                {/* Reviews list */}
                {reviews.length === 0 ? (
                  <p>No reviews yet.</p>
                ) : (
                  reviews.map((r) => (
                    <div key={r.id} className="border-bottom pb-3 mb-3">
                      <div className="d-flex justify-content-between">
                        <strong>{r.user?.name || "User"}</strong>
                        <Rating size={18} readonly initialValue={r.rating} />
                      </div>
                      {r.comment ? (
                        <p className="mb-0 mt-2">{r.comment}</p>
                      ) : (
                        <p className="mb-0 mt-2 text-muted">No comment</p>
                      )}
                    </div>
                  ))
                )}
                
              </Tab>
            </Tabs>
            <HomeRecommendations />
          </div>
        </div>
      </div>
      
    </Layout>
  );
};

export default Product;
