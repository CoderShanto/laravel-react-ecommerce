import React, { useEffect, useMemo, useState, useContext } from "react";
import Layout from "./common/Layout";
import { CartContext } from "./context/Cart";
import { apiUrl } from "./common/http";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Checkout = () => {
  const navigate = useNavigate();

  // cart context values
  const { cartData, subTotal, clearCart } = useContext(CartContext);

  // ✅ token from localStorage (user login)
  const token = useMemo(
    () => JSON.parse(localStorage.getItem("userInfo") || "{}")?.token,
    []
  );

  // ✅ billing fields
  const [billing, setBilling] = useState({
    name: "",
    email: "",
    mobile: "",
    address: "",
    area: "",
    city: "",
    district: "",
    postal_code: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ loading states
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingShipping, setLoadingShipping] = useState(true);

  // ✅ Shipping from DB (admin controlled)
  const [shippingCharge, setShippingCharge] = useState(0);

  // ✅ money helper (no decimals)
  const money = (n) => Math.round(Number(n || 0));

  // -------------------------------------------------------
  // Helper: backend expects relative path sometimes
  // -------------------------------------------------------
  const toRelativePath = (url) => {
    if (!url) return null;
    if (!url.startsWith("http")) return url;

    try {
      const u = new URL(url);
      return u.pathname.replace(/^\/+/, "");
    } catch {
      return url;
    }
  };

  // -------------------------------------------------------
  // ✅ Cart payload that backend expects
  // IMPORTANT: send FINAL payable price
  // -------------------------------------------------------
  const cartPayload = useMemo(() => {
    return (cartData || []).map((item) => {
      const unit = money(item.unit_price ?? item.price ?? 0);          // original
      const final = money(item.final_price ?? item.price ?? unit);     // discounted/payable
      const qty = Number(item.qty ?? 1);

      return {
        product_id: Number(item.product_id ?? item.id),
        product_name: item.product_name ?? item.title ?? "",
        product_sku: item.product_sku ?? item.sku ?? null,
        image_url: toRelativePath(item.image_url),
        size: item.size ?? null,

        // ✅ backend should charge this value
        unit_price: final,

        qty,

        // ✅ OPTIONAL (good for order history / invoice)
        original_price: unit,
        discount_type: item.discount_type ?? null,
        discount_value: item.discount_value ?? null,
      };
    });
  }, [cartData]);

  // -------------------------------------------------------
  // ✅ 0) Fetch active shipping from DB
  // GET /api/shipping -> { status:200, shipping: 60 }
  // -------------------------------------------------------
  useEffect(() => {
    const fetchShipping = async () => {
      setLoadingShipping(true);

      try {
        const res = await fetch(`${apiUrl}/shipping`, {
          headers: { Accept: "application/json" },
        });

        const text = await res.text();
        let data;

        try {
          data = JSON.parse(text);
        } catch {
          console.error("Non-JSON shipping response:", text);
          setShippingCharge(0);
          return;
        }

        if (res.ok && data.status === 200) {
          setShippingCharge(money(data.shipping ?? 0));
        } else {
          setShippingCharge(0);
        }
      } catch (err) {
        console.error(err);
        setShippingCharge(0);
      } finally {
        setLoadingShipping(false);
      }
    };

    fetchShipping();
  }, []);

  // -------------------------------------------------------
  // ✅ 1) Auto fill billing from profile
  // GET /api/account/profile
  // -------------------------------------------------------
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        toast.error("Please login first");
        navigate("/login");
        return;
      }

      setLoadingProfile(true);

      try {
        const res = await fetch(`${apiUrl}/account/profile`, {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const text = await res.text();
        let data;

        try {
          data = JSON.parse(text);
        } catch {
          console.error("Non-JSON profile response:", text);
          toast.error("Profile API error. Check laravel.log");
          return;
        }

        if (res.ok && data.status === 200) {
          const u = data.profile;

          setBilling({
            name: u?.name || "",
            email: u?.email || "",
            mobile: u?.mobile || "",
            address: u?.address || "",
            area: u?.area || "",
            city: u?.city || "",
            district: u?.district || "",
            postal_code: u?.postal_code || "",
          });
        } else {
          toast.error(data.message || "Failed to load profile");
        }
      } catch (err) {
        console.error(err);
        toast.error("Network error (profile)");
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
    // eslint-disable-next-line
  }, []);

  // -------------------------------------------------------
  // ✅ Billing input changes
  // -------------------------------------------------------
  const handleBillingChange = (e) => {
    const { name, value } = e.target;
    setBilling((prev) => ({ ...prev, [name]: value }));
  };

  // -------------------------------------------------------
  // ✅ Validation
  // -------------------------------------------------------
  const validateForm = () => {
    if (!billing.name.trim()) return "Name is required";
    if (!billing.email.trim()) return "Email is required";
    if (!billing.mobile.trim()) return "Mobile is required";
    if (!billing.address.trim()) return "Address is required";
    if (!billing.city.trim()) return "City is required";
    if (!paymentMethod) return "Payment method is required";
    if (!cartPayload.length) return "Your cart is empty";

    const bad = cartPayload.find((x) => !x.product_id || Number.isNaN(x.product_id));
    if (bad) return "Cart has invalid product id. Please re-add product.";

    return null;
  };

  // -------------------------------------------------------
  // ✅ totals shown in UI (uses discounted subtotal)
  // -------------------------------------------------------
  const subtotalValue = useMemo(() => money(subTotal()), [subTotal, cartData]);

  const grandTotalValue = useMemo(
    () => money(subtotalValue + money(shippingCharge || 0)),
    [subtotalValue, shippingCharge]
  );

  // -------------------------------------------------------
  // ✅ Place Order
  // -------------------------------------------------------
  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    const err = validateForm();
    if (err) {
      toast.error(err);
      return;
    }

    if (!token) {
      toast.error("Please login first.");
      navigate("/login");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        billing,
        payment_method: paymentMethod,
        cart: cartPayload,
      };

      const res = await fetch(`${apiUrl}/save-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let result;

      try {
        result = JSON.parse(text);
      } catch {
        console.error("Non-JSON order response:", text);
        toast.error("Server error (not JSON). Check backend logs.");
        return;
      }

      if (res.ok && result?.status === 200) {
        toast.success(`Order placed! ${result.order_number}`);
        clearCart();
        navigate(`/order-success?order=${result.order_number}`);
      } else {
        toast.error(result?.message || "Order failed");
        console.log("Order error:", result);
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container py-5">
        <div className="row g-4">
          {/* LEFT: Billing */}
          <div className="col-md-7">
            <h4 className="mb-3">Billing Details</h4>

            {loadingProfile ? (
              <div className="alert alert-info">Loading profile...</div>
            ) : (
              <form onSubmit={handlePlaceOrder}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <input
                      className="form-control"
                      name="name"
                      placeholder="Name"
                      value={billing.name}
                      onChange={handleBillingChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <input
                      className="form-control"
                      name="email"
                      placeholder="Email"
                      value={billing.email}
                      onChange={handleBillingChange}
                    />
                  </div>

                  <div className="col-md-12">
                    <input
                      className="form-control"
                      name="mobile"
                      placeholder="Mobile"
                      value={billing.mobile}
                      onChange={handleBillingChange}
                    />
                  </div>

                  <div className="col-md-12">
                    <textarea
                      className="form-control"
                      name="address"
                      placeholder="Address"
                      rows={3}
                      value={billing.address}
                      onChange={handleBillingChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <input
                      className="form-control"
                      name="area"
                      placeholder="Area (optional)"
                      value={billing.area}
                      onChange={handleBillingChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <input
                      className="form-control"
                      name="district"
                      placeholder="District (optional)"
                      value={billing.district}
                      onChange={handleBillingChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <input
                      className="form-control"
                      name="city"
                      placeholder="City"
                      value={billing.city}
                      onChange={handleBillingChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <input
                      className="form-control"
                      name="postal_code"
                      placeholder="Postal Code (optional)"
                      value={billing.postal_code}
                      onChange={handleBillingChange}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 mt-4 d-md-none"
                  disabled={isSubmitting || loadingShipping}
                >
                  {isSubmitting ? "Placing Order..." : "Place Order"}
                </button>
              </form>
            )}
          </div>

          {/* RIGHT: Items + totals */}
          <div className="col-md-5">
            <h4 className="mb-3">Items</h4>

            <div className="border rounded p-3">
              {(cartData || []).map((item, idx) => {
                const unit = money(item.unit_price ?? item.price ?? 0);
                const final = money(item.final_price ?? item.price ?? unit);
                const qty = Number(item.qty ?? 1);

                const hasDiscount = final < unit;
                const lineTotal = money(final * qty);

                return (
                  <div
                    key={item.cart_id ?? item.id ?? idx}
                    className="d-flex align-items-center justify-content-between border-bottom py-2"
                  >
                    <div className="d-flex align-items-center gap-3">
                      <img
                        src={item.image_url ?? item.image}
                        alt={item.title ?? item.product_name}
                        width="60"
                        height="60"
                        style={{ objectFit: "cover", borderRadius: 8 }}
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                      <div>
                        <div className="fw-semibold">{item.title ?? item.product_name}</div>

                        <div className="small text-muted">
                          {hasDiscount ? (
                            <>
                              ৳ {final}{" "}
                              <span className="text-decoration-line-through ms-2">
                                ৳ {unit}
                              </span>
                            </>
                          ) : (
                            <>৳ {unit}</>
                          )}
                          {item.size ? ` • ${item.size}` : ""} • x {qty}
                        </div>

                        {hasDiscount && (
                          <div className="small text-success fw-semibold">
                            Save ৳ {money((unit - final) * qty)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="fw-semibold">৳ {lineTotal}</div>
                  </div>
                );
              })}

              <div className="pt-3">
                <div className="d-flex justify-content-between">
                  <span>Subtotal</span>
                  <span>৳ {subtotalValue}</span>
                </div>

                <div className="d-flex justify-content-between">
                  <span>Shipping</span>
                  <span>{loadingShipping ? "Loading..." : `৳ ${money(shippingCharge)}`}</span>
                </div>

                <div className="d-flex justify-content-between fw-bold border-top pt-2 mt-2">
                  <span>Grand Total</span>
                  <span>{loadingShipping ? "Loading..." : `৳ ${grandTotalValue}`}</span>
                </div>
              </div>

              <div className="pt-4">
                <h5 className="mb-2">Payment Method</h5>

                <div className="d-flex gap-3">
                  {["bkash", "nagad", "cod"].map((m) => (
                    <label key={m} className="d-flex align-items-center gap-2">
                      <input
                        type="radio"
                        name="payment_method"
                        value={m}
                        checked={paymentMethod === m}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      {m.toUpperCase()}
                    </label>
                  ))}
                </div>

                <button
                  onClick={handlePlaceOrder}
                  className="btn btn-primary w-100 mt-4 d-none d-md-block"
                  disabled={isSubmitting || loadingProfile || loadingShipping}
                >
                  {isSubmitting ? "Placing Order..." : "Place Order"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;
