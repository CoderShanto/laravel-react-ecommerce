import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Layout from "../../common/Layout";
import { apiUrl } from "../../common/http";
import { toast } from "react-toastify";
import Sidebar from "../../common/Sidebar";

const badgeClass = (val, type) => {
  if (type === "payment") {
    if (val === "paid") return "badge bg-success";
    if (val === "pending") return "badge bg-danger";
    return "badge bg-secondary";
  }
  if (val === "delivered") return "badge bg-success";
  if (val === "processing") return "badge bg-primary";
  if (val === "cancelled") return "badge bg-danger";
  return "badge bg-warning text-dark";
};

const formatDate = (d) => {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleString();
  } catch {
    return d;
  }
};

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const token = useMemo(() => {
    return (
      JSON.parse(localStorage.getItem("adminInfo"))?.token ||
      JSON.parse(localStorage.getItem("userInfo"))?.token ||
      null
    );
  }, []);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    status: "pending",
    payment_status: "pending",
    courier_name: "",
    tracking_number: "",
    admin_note: "",
    delivered_at: "",
  });

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/admin/orders/${id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      const data = await res.json();

      if (res.ok && data.status === 200) {
        setOrder(data.order);

        setForm({
          status: data.order.status || "pending",
          payment_status: data.order.payment_status || "pending",
          courier_name: data.order.courier_name || "",
          tracking_number: data.order.tracking_number || "",
          admin_note: data.order.admin_note || "",
          delivered_at: data.order.delivered_at
            ? new Date(data.order.delivered_at).toISOString().slice(0, 16)
            : "",
        });
      } else {
        setOrder(null);
        toast.error(data.message || "Order not found");
      }
    } catch (e) {
      console.error(e);
      setOrder(null);
      toast.error("Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  // ✅ FIXED SAVE FUNCTION
  const onSave = async () => {
    if (!form.status) return toast.error("Status is required");
    if (!form.payment_status) return toast.error("Payment status is required");

    setSaving(true);

    try {
      const payload = {
        ...form,
        delivered_at: form.delivered_at
          ? new Date(form.delivered_at).toISOString()
          : null,
      };

      const res = await fetch(`${apiUrl}/admin/orders/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(payload),
      });

      // ✅ safe parsing
      const text = await res.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Non-JSON response:", text);
        toast.error("Server error. Check laravel.log");
        return;
      }

      if (res.ok && data.status === 200) {
        toast.success("Order updated");
        await fetchOrder(); // refresh
      } else {
        toast.error(data.message || "Update failed");
        if (data.errors) console.log(data.errors);
      }
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const totals = useMemo(() => {
    if (!order) return { subtotal: 0, shipping: 0, discount: 0, grand: 0 };
    return {
      subtotal: order.subtotal ?? 0,
      shipping: order.shipping ?? 0,
      discount: order.discount ?? 0,
      grand: order.grand_total ?? 0,
    };
  }, [order]);
  

  return (
    <Layout>
      <div className="container-fluid px-4">
        <div className="row">
          <div className="d-flex justify-content-between mt-5 pb-3">
            <h4 className="h4 pb-0 mb-0">Order Details</h4>
            <Link to="/admin/orders" className="btn btn-primary">
              Back
            </Link>
          </div>

          <div className="col-md-3">
            <Sidebar />
          </div>

          <div className="col-md-9">
            <div className="card shadow">
              <div className="card-body p-4">
                {loading && <p className="mb-0">Loading...</p>}

                {!loading && !order && (
                  <div className="alert alert-danger">Order not found.</div>
                )}

                {!loading && order && (
                  <div className="row g-3">
                    {/* Left */}
                    <div className="col-lg-8">
                      <div className="card shadow-sm mb-3">
                        <div className="card-body">
                          <div className="d-flex align-items-start justify-content-between">
                            <div>
                              <div className="fw-semibold fs-5">
                                {order.order_number}
                              </div>
                              <div className="text-muted small">
                                Created: {formatDate(order.created_at)}
                              </div>
                            </div>

                            <div className="text-end">
                              <div
                                className={badgeClass(
                                  order.payment_status,
                                  "payment"
                                )}
                                style={{ fontSize: 12 }}
                              >
                                {order.payment_status}
                              </div>
                              <div className="mt-2">
                                <span
                                  className={badgeClass(order.status)}
                                  style={{ fontSize: 12 }}
                                >
                                  {order.status}
                                </span>
                              </div>
                            </div>
                          </div>

                          <hr />

                          <div className="row g-2 small">
                            <div className="col-md-6">
                              <div className="fw-semibold mb-1">Customer</div>
                              <div>{order.name}</div>
                              <div className="text-muted">{order.email}</div>
                              <div className="text-muted">{order.mobile}</div>
                            </div>

                            <div className="col-md-6">
                              <div className="fw-semibold mb-1">
                                Shipping Address
                              </div>
                              <div>{order.address}</div>
                              <div className="text-muted">
                                {order.area ? `${order.area}, ` : ""}
                                {order.city}
                                {order.district ? `, ${order.district}` : ""}
                              </div>
                              <div className="text-muted">
                                {order.postal_code
                                  ? `Postal: ${order.postal_code} • `
                                  : ""}
                                {order.country}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="card shadow-sm">
                        <div className="card-body">
                          <div className="d-flex align-items-center justify-content-between mb-2">
                            <h5 className="mb-0">Items</h5>
                            <span className="text-muted small">
                              {order.items?.length || 0} item(s)
                            </span>
                          </div>

                          <div className="table-responsive">
                            <table className="table align-middle">
                              <thead className="table-light">
                                <tr>
                                  <th style={{ width: 60 }}>#</th>
                                  <th>Product</th>
                                  <th>SKU</th>
                                  <th>Size</th>
                                  <th className="text-end">Unit</th>
                                  <th className="text-end">Qty</th>
                                  <th className="text-end">Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(order.items || []).map((it, idx) => (
                                  <tr key={it.id}>
                                    <td>{idx + 1}</td>
                                    <td>
                                      <div className="d-flex align-items-center gap-2">
                                        {it.image_url ? (
                                          <img
                                            src={
                                              it.image_url.startsWith("http")
                                                ? it.image_url
                                                : `${apiUrl.replace(
                                                    "/api",
                                                    ""
                                                  )}/${it.image_url}`
                                            }
                                            alt={it.product_name}
                                            width="44"
                                            height="44"
                                            style={{
                                              objectFit: "cover",
                                              borderRadius: 8,
                                            }}
                                          />
                                        ) : (
                                          <div
                                            style={{
                                              width: 44,
                                              height: 44,
                                              borderRadius: 8,
                                              background: "#eee",
                                            }}
                                          />
                                        )}
                                        <div>
                                          <div className="fw-semibold">
                                            {it.product_name}
                                          </div>
                                          <div className="text-muted small">
                                            ID: {it.product_id}
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="text-muted">
                                      {it.product_sku || "-"}
                                    </td>
                                    <td>{it.size || "-"}</td>
                                    <td className="text-end">
                                      ৳ {Number(it.unit_price).toFixed(2)}
                                    </td>
                                    <td className="text-end">{it.qty}</td>
                                    <td className="text-end">
                                      ৳ {Number(it.line_total).toFixed(2)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          <div className="d-flex justify-content-end">
                            <div style={{ width: 320 }} className="mt-2">
                              <div className="d-flex justify-content-between">
                                <span className="text-muted">Subtotal</span>
                                <span>
                                  ৳ {Number(totals.subtotal).toFixed(2)}
                                </span>
                              </div>
                              <div className="d-flex justify-content-between">
                                <span className="text-muted">Shipping</span>
                                <span>
                                  ৳ {Number(totals.shipping).toFixed(2)}
                                </span>
                              </div>
                              <div className="d-flex justify-content-between">
                                <span className="text-muted">Discount</span>
                                <span>
                                  ৳ {Number(totals.discount).toFixed(2)}
                                </span>
                              </div>
                              <hr />
                              <div className="d-flex justify-content-between fw-bold">
                                <span>Grand Total</span>
                                <span>৳ {Number(totals.grand).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right */}
                    <div className="col-lg-4">
                      <div className="card shadow-sm">
                        <div className="card-body">
                          <h5 className="mb-3">Update Order</h5>

                          <div className="mb-3">
                            <label className="form-label">Status</label>
                            <select
                              className="form-select"
                              name="status"
                              value={form.status}
                              onChange={onChange}
                            >
                              <option value="pending">pending</option>
                              <option value="processing">processing</option>
                              <option value="shipped">shipped</option>
                              <option value="delivered">delivered</option>
                              <option value="cancelled">cancelled</option>
                            </select>
                          </div>

                          <div className="mb-3">
                            <label className="form-label">Payment Status</label>
                            <select
                              className="form-select"
                              name="payment_status"
                              value={form.payment_status}
                              onChange={onChange}
                            >
                              <option value="pending">pending</option>
                              <option value="paid">paid</option>
                              <option value="failed">failed</option>
                              <option value="refunded">refunded</option>
                            </select>
                          </div>

                          <div className="mb-3">
                            <label className="form-label">Courier Name</label>
                            <input
                              className="form-control"
                              name="courier_name"
                              value={form.courier_name}
                              onChange={onChange}
                            />
                          </div>

                          <div className="mb-3">
                            <label className="form-label">Tracking Number</label>
                            <input
                              className="form-control"
                              name="tracking_number"
                              value={form.tracking_number}
                              onChange={onChange}
                            />
                          </div>

                          <div className="mb-3">
                            <label className="form-label">Delivered At</label>
                            <input
                              type="datetime-local"
                              className="form-control"
                              name="delivered_at"
                              value={form.delivered_at}
                              onChange={onChange}
                            />
                          </div>

                          <div className="mb-3">
                            <label className="form-label">Customer Note</label>
                            <div className="form-control" style={{ minHeight: 70, background: "#f8f9fa" }}>
                              {order.order_note ? order.order_note : <span className="text-muted">No note</span>}
                            </div>
                          </div>


                          <div className="mb-3">
                            <label className="form-label">Admin Note</label>
                            <textarea
                              className="form-control"
                              rows={3}
                              name="admin_note"
                              value={form.admin_note}
                              onChange={onChange}
                            />
                          </div>

                          <button
                            className="btn btn-primary w-100"
                            onClick={onSave}
                            disabled={saving}
                          >
                            {saving ? "Saving..." : "Save Changes"}
                          </button>

                          <button
                            className="btn btn-outline-secondary w-100 mt-2"
                            onClick={() => navigate("/admin/orders")}
                          >
                            Back to Orders
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OrderDetails;
