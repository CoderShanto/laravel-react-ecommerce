import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Layout from "../common/Layout";

import { apiUrl } from "../common/http";
import { toast } from "react-toastify";
import UserSidebar from "../common/UserSidebar";

const badge = (val, type) => {
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

const formatDate = (d) => (d ? new Date(d).toLocaleString() : "-");

export default function AccountOrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const token = useMemo(
    () => JSON.parse(localStorage.getItem("userInfo"))?.token,
    []
  );

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ✅ user editable field only
  const [orderNote, setOrderNote] = useState("");

  // ✅ Return modal state
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [returnQty, setReturnQty] = useState(1);
  const [returnReason, setReturnReason] = useState("");
  const [returnSubmitting, setReturnSubmitting] = useState(false);

  const orderDelivered = order?.status === "delivered";

  const getReturnAvailableQty = (it) => {
    const qty = Number(it?.qty || 0);
    const returned = Number(it?.returned_qty || 0);
    return Math.max(0, qty - returned);
  };

  const openReturnModal = (item) => {
    const available = getReturnAvailableQty(item);

    if (!orderDelivered) {
      toast.error("Return is allowed only after the order is delivered.");
      return;
    }
    if (available <= 0) {
      toast.error("This item is already fully returned.");
      return;
    }

    setSelectedItem(item);
    setReturnQty(1);
    setReturnReason("");
    setShowReturnModal(true);
  };

  const closeReturnModal = () => {
    setShowReturnModal(false);
    setSelectedItem(null);
    setReturnQty(1);
    setReturnReason("");
  };

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/account/orders/${id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Non-JSON:", text);
        toast.error("Server error. Check laravel.log");
        return;
      }

      if (res.ok && data.status === 200) {
        setOrder(data.order);
        setOrderNote(data.order.order_note || "");
      } else {
        toast.error(data.message || "Order not found");
        setOrder(null);
      }
    } catch (e) {
      console.error(e);
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line
  }, [id]);

  const canEditNote =
    order && !["shipped", "delivered", "cancelled"].includes(order.status);

  const onSaveNote = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/account/orders/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ order_note: orderNote }),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Non-JSON:", text);
        toast.error("Server error. Check laravel.log");
        return;
      }

      if (res.ok && data.status === 200) {
        toast.success("Note updated");
        await fetchOrder();
      } else {
        toast.error(data.message || "Update failed");
      }
    } catch (e) {
      console.error(e);
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const submitReturnRequest = async () => {
    if (!selectedItem) return;

    const available = getReturnAvailableQty(selectedItem);

    if (!orderDelivered) {
      toast.error("Return is allowed only after delivery.");
      return;
    }

    if (Number(returnQty) < 1) {
      toast.error("Quantity must be at least 1.");
      return;
    }

    if (Number(returnQty) > available) {
      toast.error(`You can return maximum ${available} qty.`);
      return;
    }

    setReturnSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/returns`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          order_item_id: selectedItem.id,
          qty: Number(returnQty),
          reason: returnReason,
        }),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Non-JSON:", text);
        toast.error("Server error. Check laravel.log");
        return;
      }

      if (res.ok) {
        toast.success(data.message || "Return request submitted!");
        closeReturnModal();
        await fetchOrder(); // refresh to reflect returned_qty later
      } else {
        toast.error(data.message || "Return request failed");
      }
    } catch (e) {
      console.error(e);
      toast.error("Network error");
    } finally {
      setReturnSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container py-5">
        <div className="row g-4">
          <div className="col-md-3">
            <UserSidebar />
          </div>

          <div className="col-md-9">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h4 className="mb-0">Order Details</h4>
                <div className="text-muted small">
                  View your order information
                </div>
              </div>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => navigate("/account/orders")}
                >
                  ← Back
                </button>
                <button
                  className="btn btn-outline-primary"
                  onClick={fetchOrder}
                  disabled={loading}
                >
                  Refresh
                </button>
              </div>
            </div>

            {loading && <div className="alert alert-info mb-0">Loading...</div>}

            {!loading && !order && (
              <div className="alert alert-danger mb-0">Order not found.</div>
            )}

            {!loading && order && (
              <div className="row g-3">
                {/* Left */}
                <div className="col-lg-8">
                  <div className="card shadow-sm mb-3">
                    <div className="card-body">
                      <div className="d-flex justify-content-between">
                        <div>
                          <div className="fw-semibold fs-5">
                            {order.order_number}
                          </div>
                          <div className="text-muted small">
                            Placed: {formatDate(order.created_at)}
                          </div>
                        </div>
                        <div className="text-end">
                          <span className={badge(order.payment_status, "payment")}>
                            {order.payment_status}
                          </span>
                          <div className="mt-2">
                            <span className={badge(order.status)}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <hr />

                      <div className="row small">
                        <div className="col-md-6">
                          <div className="fw-semibold mb-1">Customer</div>
                          <div>{order.name}</div>
                          <div className="text-muted">{order.email}</div>
                          <div className="text-muted">{order.mobile}</div>
                        </div>
                        <div className="col-md-6">
                          <div className="fw-semibold mb-1">Shipping Address</div>
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
                      <div className="d-flex justify-content-between mb-2">
                        <h5 className="mb-0">Items</h5>
                        <span className="text-muted small">
                          {order.items?.length || 0} item(s)
                        </span>
                      </div>

                      {!orderDelivered && (
                        <div className="alert alert-warning">
                          Return is available only after order is{" "}
                          <b>delivered</b>.
                        </div>
                      )}

                      <div className="table-responsive">
                        <table className="table align-middle">
                          <thead className="table-light">
                            <tr>
                              <th>Product</th>
                              <th>Size</th>
                              <th className="text-end">Unit</th>
                              <th className="text-end">Qty</th>
                              <th className="text-end">Returned</th>
                              <th className="text-end">Available</th>
                              <th className="text-end">Total</th>
                              <th className="text-end">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(order.items || []).map((it) => {
                              const returned = Number(it.returned_qty || 0);
                              const available = getReturnAvailableQty(it);
                              const canReturn = orderDelivered && available > 0;

                              return (
                                <tr key={it.id}>
                                  <td>
                                    <div className="d-flex gap-2 align-items-center">
                                      {it.image_url ? (
                                        <img
                                          src={
                                            it.image_url.startsWith("http")
                                              ? it.image_url
                                              : `${apiUrl.replace("/api", "")}/${it.image_url}`
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
                                            background: "#eee",
                                            borderRadius: 8,
                                          }}
                                        />
                                      )}
                                      <div>
                                        <div className="fw-semibold">
                                          {it.product_name}
                                        </div>
                                        <div className="text-muted small">
                                          SKU: {it.product_sku || "-"}
                                        </div>
                                      </div>
                                    </div>
                                  </td>

                                  <td>{it.size || "-"}</td>

                                  <td className="text-end">
                                    ৳ {Number(it.unit_price).toFixed(2)}
                                  </td>

                                  <td className="text-end">{it.qty}</td>

                                  <td className="text-end">{returned}</td>

                                  <td className="text-end">{available}</td>

                                  <td className="text-end">
                                    ৳ {Number(it.line_total).toFixed(2)}
                                  </td>

                                  <td className="text-end">
                                    <button
                                      className="btn btn-sm btn-outline-danger"
                                      disabled={!canReturn}
                                      onClick={() => openReturnModal(it)}
                                      title={
                                        !orderDelivered
                                          ? "Order not delivered"
                                          : available <= 0
                                          ? "No qty available"
                                          : "Request return"
                                      }
                                    >
                                      Return
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div className="d-flex justify-content-end">
                        <div style={{ width: 320 }}>
                          <div className="d-flex justify-content-between">
                            <span className="text-muted">Subtotal</span>
                            <span>৳ {Number(order.subtotal).toFixed(2)}</span>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span className="text-muted">Shipping</span>
                            <span>৳ {Number(order.shipping).toFixed(2)}</span>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span className="text-muted">Discount</span>
                            <span>৳ {Number(order.discount).toFixed(2)}</span>
                          </div>
                          <hr />
                          <div className="d-flex justify-content-between fw-bold">
                            <span>Grand Total</span>
                            <span>
                              ৳ {Number(order.grand_total).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 d-flex justify-content-end">
                        <Link to="/account/return" className="btn btn-outline-primary">
                          View Return Requests
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right */}
                <div className="col-lg-4">
                  <div className="card shadow-sm">
                    <div className="card-body">
                      <h5 className="mb-3">Delivery & Notes</h5>

                      <div className="mb-2 small text-muted">Payment Method</div>
                      <div className="fw-semibold mb-3">
                        {order.payment_method?.toUpperCase()}
                      </div>

                      <hr />

                      <div className="mb-2 small text-muted">Courier</div>
                      <div className="fw-semibold mb-3">
                        {order.courier_name || "-"}
                      </div>

                      <div className="mb-2 small text-muted">Tracking</div>
                      <div className="fw-semibold mb-3">
                        {order.tracking_number || "-"}
                      </div>

                      <div className="mb-2 small text-muted">Delivered At</div>
                      <div className="fw-semibold mb-3">
                        {order.delivered_at ? formatDate(order.delivered_at) : "-"}
                      </div>

                      <hr />

                      {/* ✅ USER EDITABLE NOTE */}
                      <div className="mb-2 small text-muted">Your Note</div>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={orderNote}
                        onChange={(e) => setOrderNote(e.target.value)}
                        disabled={!canEditNote}
                        placeholder="Write your note for this order..."
                      />
                      <div className="text-muted small mt-1">
                        {canEditNote
                          ? "You can edit before shipped/delivered."
                          : "Note editing is disabled for shipped/delivered/cancelled orders."}
                      </div>

                      <button
                        className="btn btn-primary w-100 mt-3"
                        onClick={onSaveNote}
                        disabled={saving || !canEditNote}
                      >
                        {saving ? "Saving..." : "Save Note"}
                      </button>

                      <hr />

                      <div className="mb-2 small text-muted">Admin Note</div>
                      <div className="form-control" style={{ background: "#f8f9fa" }}>
                        {order.admin_note || "-"}
                      </div>

                      <Link to="/" className="btn btn-info w-100 mt-3 text-white">
                        Continue Shopping
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✅ Return Modal (Bootstrap) */}
      {showReturnModal && (
        <div
          className="modal d-block"
          tabIndex="-1"
          role="dialog"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={closeReturnModal}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            role="document"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Request Return</h5>
                <button type="button" className="btn-close" onClick={closeReturnModal} />
              </div>

              <div className="modal-body">
                {!selectedItem ? (
                  <div className="alert alert-danger mb-0">No item selected</div>
                ) : (
                  <>
                    <div className="mb-2">
                      <div className="fw-semibold">{selectedItem.product_name}</div>
                      <div className="text-muted small">
                        Size: {selectedItem.size || "-"} • Purchased: {selectedItem.qty} • Returned:{" "}
                        {selectedItem.returned_qty || 0} • Available:{" "}
                        {getReturnAvailableQty(selectedItem)}
                      </div>
                    </div>

                    <div className="row g-3 mt-1">
                      <div className="col-md-4">
                        <label className="form-label">Qty</label>
                        <input
                          type="number"
                          className="form-control"
                          min={1}
                          max={getReturnAvailableQty(selectedItem)}
                          value={returnQty}
                          onChange={(e) => setReturnQty(e.target.value)}
                        />
                        <div className="text-muted small mt-1">
                          Max: {getReturnAvailableQty(selectedItem)}
                        </div>
                      </div>

                      <div className="col-md-8">
                        <label className="form-label">Reason</label>
                        <input
                          type="text"
                          className="form-control"
                          value={returnReason}
                          onChange={(e) => setReturnReason(e.target.value)}
                          placeholder="Example: Size problem / Damaged / Wrong item"
                        />
                      </div>
                    </div>

                    <div className="alert alert-info mt-3 mb-0">
                      After you submit, admin will review your request.
                    </div>
                  </>
                )}
              </div>

              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={closeReturnModal}>
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  disabled={returnSubmitting || !selectedItem}
                  onClick={submitReturnRequest}
                >
                  {returnSubmitting ? "Submitting..." : "Submit Return"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}