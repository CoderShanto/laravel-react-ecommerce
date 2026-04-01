import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "./common/Layout";
import { api, apiUrl } from "./common/http";

const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );
  const orderNumber = queryParams.get("order");

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("userInfo") || "{}")?.token || null;
    } catch {
      return null;
    }
  }, []);

  // money helper
  const money = (n) => Math.round(Number(n || 0));

  // safe totals
  const totals = useMemo(() => {
    if (!order) {
      return {
        subtotal: 0,
        shipping: 0,
        discount: 0,
        grandTotal: 0,
      };
    }

    const subtotal = money(order.subtotal);
    const shipping = money(
      order.shipping ??
        order.shipping_amount ??
        order.shipping_charge ??
        order.delivery_charge
    );
    const discount = money(order.discount);
    const grandTotal = money(order.grand_total);

    if (!grandTotal) {
      return {
        subtotal,
        shipping,
        discount,
        grandTotal: money(subtotal + shipping - discount),
      };
    }

    return { subtotal, shipping, discount, grandTotal };
  }, [order]);

  // load order
  useEffect(() => {
    if (!orderNumber) {
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      setLoading(true);

      try {
        const headers = {
          Accept: "application/json",
          "Content-Type": "application/json",
        };

        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(`${apiUrl}/order/${orderNumber}`, { headers });

        const text = await res.text();
        let data;

        try {
          data = JSON.parse(text);
        } catch {
          console.log("Non-JSON order response:", text);
          setOrder(null);
          return;
        }

        if (res.ok && data.status === 200) {
          setOrder(data.order);
          console.log("ORDER SUCCESS ORDER:", data.order);
        } else {
          setOrder(null);
        }
      } catch (e) {
        console.log(e);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderNumber, token]);

  // track purchase once per order
  useEffect(() => {
    if (!orderNumber) return;
    if (!order) return;

    const key = `tracked_purchase_order_${orderNumber}`;
    if (localStorage.getItem(key) === "1") return;

    const items = Array.isArray(order.items) ? order.items : [];
    if (items.length === 0) return;

    const trackPurchase = async () => {
      try {
        const reqs = items
          .map((it) => {
            const productId = it.product_id || it.productId || it.product?.id;
            if (!productId) return null;

            return api.post(`/products/${productId}/interest`, {
              action: "purchase",
            });
          })
          .filter(Boolean);

        await Promise.allSettled(reqs);
        localStorage.setItem(key, "1");
      } catch (e) {
        console.log("purchase tracking failed", e?.response?.data || e);
      }
    };

    trackPurchase();
  }, [order, orderNumber]);

  return (
    <Layout>
      <div className="container py-5">
        <div className="card p-4 shadow-sm">
          <h2 className="text-success mb-2">✅ Thank You!</h2>
          <p className="text-muted">Your order has been successfully placed.</p>

          {!orderNumber && (
            <div className="alert alert-warning">
              Order number missing in URL.
            </div>
          )}

          {loading && <p>Loading order details...</p>}

          {!loading && orderNumber && !order && (
            <div className="alert alert-danger">
              Could not load order details.
            </div>
          )}

          {!loading && order && (
            <>
              <div className="border rounded p-3 mb-4">
                <div className="row">
                  <div className="col-md-6">
                    <p className="mb-1">
                      <strong>Order Number:</strong> {order.order_number}
                    </p>
                    <p className="mb-1">
                      <strong>Date:</strong>{" "}
                      {order.created_at
                        ? new Date(order.created_at).toLocaleDateString()
                        : "-"}
                    </p>
                    <p className="mb-1">
                      <strong>Status:</strong>{" "}
                      <span className="badge bg-warning text-dark">
                        {order.status || "pending"}
                      </span>
                    </p>
                    <p className="mb-0">
                      <strong>Payment:</strong>{" "}
                      {(order.payment_method || "cod").toUpperCase()}
                    </p>
                  </div>

                  <div className="col-md-6">
                    <p className="mb-1">
                      <strong>Customer:</strong> {order.name || "-"}
                    </p>
                    <p className="mb-1">
                      <strong>Contact:</strong> {order.mobile || "-"}
                    </p>
                    <p className="mb-0">
                      <strong>Address:</strong> {order.address || ""}
                      {order.area ? `, ${order.area}` : ""}
                      {order.city ? `, ${order.city}` : ""}
                    </p>
                  </div>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-bordered align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Item</th>
                      <th style={{ width: 90 }}>Size</th>
                      <th style={{ width: 130 }}>Unit Price</th>
                      <th style={{ width: 70 }}>Qty</th>
                      <th style={{ width: 130 }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(order.items || []).map((it) => {
                      const unit = money(it.unit_price);
                      const qty = Number(it.qty || 1);
                      const line =
                        it.line_total != null
                          ? money(it.line_total)
                          : money(unit * qty);

                      return (
                        <tr key={it.id}>
                          <td>{it.product_name || "-"}</td>
                          <td>{it.size || "-"}</td>
                          <td>৳ {unit}</td>
                          <td>{qty}</td>
                          <td>৳ {line}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="d-flex justify-content-end">
                <div style={{ width: 320 }}>
                  <div className="d-flex justify-content-between">
                    <span>Subtotal</span>
                    <span>৳ {totals.subtotal}</span>
                  </div>

                  <div className="d-flex justify-content-between">
                    <span>Shipping</span>
                    <span>৳ {totals.shipping}</span>
                  </div>

                  {totals.discount > 0 && (
                    <div className="d-flex justify-content-between text-success">
                      <span>Discount</span>
                      <span>- ৳ {totals.discount}</span>
                    </div>
                  )}

                  <hr />
                  <div className="d-flex justify-content-between fw-bold">
                    <span>Grand Total</span>
                    <span>৳ {totals.grandTotal}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="mt-4">
            <button
              className="btn btn-primary me-2"
              onClick={() => navigate("/")}
            >
              Continue Shopping
            </button>
            <button
              className="btn btn-outline-secondary"
              onClick={() => navigate("/account")}
            >
              View Profile
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OrderSuccess;