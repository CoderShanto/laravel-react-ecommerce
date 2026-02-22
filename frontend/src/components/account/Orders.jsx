import React, { useEffect, useMemo, useState } from "react";
import Layout from "../common/Layout";
import { apiUrl } from "../common/http";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import UserSidebar from "../common/UserSidebar";

const badge = (val, type) => {
  if (type === "payment") {
    if (val === "paid") return "badge bg-success";
    if (val === "pending") return "badge bg-danger";
    if (val === "failed") return "badge bg-secondary";
    return "badge bg-secondary";
  }
  if (val === "delivered") return "badge bg-success";
  if (val === "processing") return "badge bg-primary";
  if (val === "cancelled") return "badge bg-danger";
  if (val === "shipped") return "badge bg-info text-dark";
  return "badge bg-warning text-dark";
};

export default function AccountOrders() {
  const token = useMemo(
    () => JSON.parse(localStorage.getItem("userInfo"))?.token,
    []
  );

  const [rows, setRows] = useState([]);
  const [links, setLinks] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Added for pagination (10 per page)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchOrders = async (url = `${apiUrl}/account/orders`) => {
    setLoading(true);
    try {
      const res = await fetch(url, {
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
        setRows(data.orders?.data || []);
        setLinks(data.orders?.links || null);

        // ✅ reset page when new data loads
        setCurrentPage(1);
      } else {
        toast.error(data.message || "Failed to load orders");
      }
    } catch (e) {
      console.error(e);
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line
  }, []);

  // ✅ Pagination calculations
  const totalPages = Math.ceil(rows.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRows = rows.slice(startIndex, startIndex + itemsPerPage);

  // ✅ ALL styles inside this file (your original CSS unchanged)
  const css = `
    /* ===== Premium Account Orders UI (match Profile) ===== */
    .fx-orders-page{
      padding-bottom: 28px;
      animation: fxFadeUp .55s ease both;
    }
    @keyframes fxFadeUp{
      from{opacity:0;transform:translateY(10px)}
      to{opacity:1;transform:translateY(0)}
    }

    .fx-orders-header{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:16px;
      margin-top: 48px;
      margin-bottom: 18px;
    }
    .fx-orders-title{
      font-size: 28px;
      font-weight: 900;
      letter-spacing: -0.6px;
      color:#0f172a;
      margin:0;
    }
    .fx-orders-subtitle{
      margin:6px 0 0;
      color:#64748b;
      font-size:14px;
    }

    .fx-actions{
      display:flex;
      align-items:center;
      gap:10px;
      flex-wrap:wrap;
      justify-content:flex-end;
    }

    .fx-btn{
      border-radius: 14px !important;
      padding: 10px 14px !important;
      font-weight: 800 !important;
      transition: transform .15s ease, box-shadow .15s ease, filter .15s ease;
      display:inline-flex;
      align-items:center;
      gap:10px;
      position:relative;
      overflow:hidden;
    }
    .fx-btn:hover{ transform: translateY(-1px); filter: brightness(1.02); }
    .fx-btn:active{ transform: translateY(0); }
    .fx-btn:disabled{ transform:none; filter:none; opacity:.85; }

    .fx-btn-primary{
      box-shadow: 0 14px 34px rgba(37, 99, 235, .22);
    }
    .fx-btn-outline{
      box-shadow: 0 10px 22px rgba(15, 23, 42, .06);
      background: rgba(255,255,255,.9) !important;
      border: 1px solid rgba(37, 99, 235, .25) !important;
    }
    .fx-btn-outline:hover{
      box-shadow: 0 14px 30px rgba(15, 23, 42, .10);
    }

    .fx-sidebar-wrap{
      position: sticky;
      top: 90px;
    }

    .fx-card{
      border: 0 !important;
      border-radius: 18px !important;
      overflow: hidden;
      background: linear-gradient(180deg, rgba(255,255,255,.92), rgba(255,255,255,.86));
      box-shadow: 0 18px 60px rgba(15, 23, 42, .12);
      backdrop-filter: blur(6px);
      position:relative;
    }
    .fx-card::before{
      content:"";
      position:absolute;
      inset:-2px;
      background: radial-gradient(900px 240px at 20% -10%, rgba(37, 99, 235, .16), transparent 55%),
                  radial-gradient(900px 260px at 100% 0%, rgba(16, 185, 129, .12), transparent 55%),
                  radial-gradient(700px 240px at 40% 120%, rgba(244, 63, 94, .09), transparent 55%);
      pointer-events:none;
    }
    .fx-card-body{
      position:relative;
      padding: 22px !important;
    }

    .fx-toolbar{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:12px;
      margin-bottom: 14px;
      flex-wrap: wrap;
    }

    .fx-kpis{
      display:flex;
      gap:10px;
      flex-wrap:wrap;
    }
    .fx-chip{
      border-radius: 999px;
      padding: 8px 12px;
      background: rgba(148, 163, 184, 0.10);
      border: 1px solid rgba(148, 163, 184, 0.18);
      color:#334155;
      font-weight: 800;
      font-size: 12px;
      display:inline-flex;
      align-items:center;
      gap:8px;
      box-shadow: 0 10px 22px rgba(15, 23, 42, .05);
    }
    .fx-chip .dot{
      width:8px;height:8px;border-radius:999px;
      background: rgba(37, 99, 235, .75);
      display:inline-block;
    }

    .fx-table-wrap{
      border-radius: 16px;
      overflow: auto;
      border: 1px solid rgba(15, 23, 42, .08);
      box-shadow: 0 10px 22px rgba(15, 23, 42, .05);
      background: rgba(255,255,255,.9);
    }

    .fx-table{
      margin:0;
      min-width: 1080px; /* ensures action column exists + scrolls nicely */
    }
    .fx-table thead th{
      background: rgba(248, 250, 252, .9) !important;
      color: #0f172a;
      font-size: 12px;
      font-weight: 900;
      letter-spacing: .2px;
      border-bottom: 1px solid rgba(15, 23, 42, .08) !important;
      padding: 14px 14px !important;
      white-space: nowrap;
    }
    .fx-table tbody td{
      padding: 14px 14px !important;
      vertical-align: middle;
      border-top: 1px solid rgba(15, 23, 42, .06) !important;
      color:#0f172a;
      white-space: nowrap;
    }
    .fx-table tbody tr:hover{
      background: rgba(37, 99, 235, 0.04);
    }

    .fx-order-no{ font-weight: 900; letter-spacing: .2px; }
    .fx-muted{ color:#64748b !important; font-size: 13px; }
    .fx-ship{ min-width: 240px; white-space: normal; line-height: 1.25; }
    .fx-amount{ font-weight: 900; color:#0f172a; }

    .fx-badge-soft{
      border-radius: 999px;
      padding: 7px 10px;
      font-weight: 900;
      font-size: 12px;
      display:inline-flex;
      align-items:center;
      gap:8px;
      text-transform: capitalize;
    }
    .fx-badge-soft::before{
      content:"";
      width:8px;height:8px;border-radius:999px;
      background: currentColor;
      opacity:.7;
    }

    /* soft variants */
    .fx-badge-soft.badge.bg-success{ background: rgba(16,185,129,.12) !important; color:#059669 !important; border: 1px solid rgba(16,185,129,.25) !important; }
    .fx-badge-soft.badge.bg-primary{ background: rgba(37,99,235,.12) !important; color:#2563eb !important; border: 1px solid rgba(37,99,235,.25) !important; }
    .fx-badge-soft.badge.bg-danger{ background: rgba(239,68,68,.12) !important; color:#dc2626 !important; border: 1px solid rgba(239,68,68,.25) !important; }
    .fx-badge-soft.badge.bg-info{ background: rgba(6,182,212,.14) !important; color:#0891b2 !important; border: 1px solid rgba(6,182,212,.26) !important; }
    .fx-badge-soft.badge.bg-warning{ background: rgba(245,158,11,.14) !important; color:#b45309 !important; border: 1px solid rgba(245,158,11,.26) !important; }
    .fx-badge-soft.badge.bg-secondary{ background: rgba(100,116,139,.14) !important; color:#475569 !important; border: 1px solid rgba(100,116,139,.26) !important; }

    .fx-view-btn{
      border-radius: 12px !important;
      font-weight: 900 !important;
      padding: 8px 12px !important;
      transition: transform .15s ease, box-shadow .15s ease;
      box-shadow: 0 10px 22px rgba(15, 23, 42, .06);
      background: rgba(255,255,255,.9) !important;
      border: 1px solid rgba(37,99,235,.25) !important;
    }
    .fx-view-btn:hover{
      transform: translateY(-1px);
      box-shadow: 0 14px 30px rgba(15, 23, 42, .10);
    }

    /* Sticky action column so "View" is always visible */
    .fx-table th:last-child,
    .fx-table td:last-child{
      position: sticky;
      right: 0;
      background: rgba(255,255,255,.96);
      box-shadow: -12px 0 18px rgba(15, 23, 42, .06);
    }
    .fx-table thead th:last-child{
      background: rgba(248, 250, 252, .98) !important;
    }

    /* Pagination */
    .fx-pagination{
      display:flex;
      gap:8px;
      flex-wrap:wrap;
      margin-top: 14px;
      justify-content: flex-end;
    }
    .fx-page-btn{
      border-radius: 12px !important;
      font-weight: 900 !important;
      padding: 8px 12px !important;
      box-shadow: 0 10px 22px rgba(15, 23, 42, .06);
      background: rgba(255,255,255,.92) !important;
      border: 1px solid rgba(148, 163, 184, 0.30) !important;
      transition: transform .12s ease, box-shadow .12s ease;
    }
    .fx-page-btn:hover{
      transform: translateY(-1px);
      box-shadow: 0 14px 30px rgba(15, 23, 42, .10);
    }

    @media (max-width: 768px){
      .fx-orders-header{
        flex-direction: column;
        align-items:flex-start;
      }
      .fx-actions{
        width:100%;
        justify-content:flex-start;
      }
      .fx-card-body{
        padding: 16px !important;
      }
      .fx-table{
        min-width: 980px;
      }
      .fx-ship{
        min-width: 180px;
      }
      .fx-pagination{
        justify-content: flex-start;
      }
    }
  `;

  return (
    <Layout>
      <style>{css}</style>

      <div className="container-fluid px-4">
        <div className="row g-4">
          {/* Header */}
          <div className="fx-orders-header">
            <div>
              <h2 className="fx-orders-title">My Orders</h2>
              <p className="fx-orders-subtitle">
                Track your purchases, payments and delivery updates.
              </p>
            </div>

            <div className="fx-actions">
              <button
                type="button"
                className="btn btn-outline-primary fx-btn fx-btn-outline"
                onClick={() => fetchOrders()}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" />
                    Refreshing...
                  </>
                ) : (
                  "Refresh"
                )}
              </button>

              <Link to="/shop" className="btn btn-primary fx-btn fx-btn-primary">
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-md-3">
            <div className="fx-sidebar-wrap">
              <UserSidebar />
            </div>
          </div>

          {/* Content */}
          <div className="col-md-9">
            <div className="card fx-card">
              <div className="card-body fx-card-body">
                {/* KPIs */}
                <div className="fx-toolbar">
                  <div className="fx-kpis">
                    <div className="fx-chip">
                      <span className="dot" />
                      Total Orders: <strong>{rows.length}</strong>
                    </div>
                  </div>
                </div>

                {loading && (
                  <div className="alert alert-info mb-0">Loading...</div>
                )}

                {!loading && rows.length === 0 && (
                  <div className="alert alert-warning mb-0">
                    No orders found.
                  </div>
                )}

                {!loading && rows.length > 0 && (
                  <>
                    <div className="table-responsive fx-table-wrap">
                      <table className="table fx-table align-middle">
                        <thead>
                          <tr>
                            <th>Order #</th>
                            {/* <th>Customer</th> */}
                            {/* <th>Email</th>
                            <th>Mobile</th> */}
                            <th>Shipping</th>
                            <th className="text-end">Amount</th>
                            <th>Date</th>
                            <th>Payment</th>
                            <th>Status</th>
                            <th className="text-end">Action</th>
                          </tr>
                        </thead>

                        <tbody>
                          {paginatedRows.map((o) => (
                            <tr key={o.id}>
                              <td className="fx-order-no">{o.order_number}</td>

                              {/* <td>
                                <div className="fw-semibold">{o.name}</div>
                              </td> */}

                              {/* <td className="fx-muted">{o.email}</td>

                              <td className="fx-muted">{o.mobile}</td> */}

                              <td className="fx-muted fx-ship">
                                {o.area ? `${o.area}, ` : ""}
                                {o.city}
                                {o.postal_code ? ` (${o.postal_code})` : ""}
                                {o.country ? `, ${o.country}` : ""}
                              </td>

                              <td className="text-end fx-amount">
                                ৳ {Number(o.grand_total).toFixed(2)}
                              </td>

                              <td className="fx-muted">
                                {new Date(o.created_at).toLocaleDateString()}
                              </td>

                              <td>
                                <span
                                  className={`${badge(
                                    o.payment_status,
                                    "payment"
                                  )} fx-badge-soft`}
                                >
                                  {o.payment_status}
                                </span>
                                <div className="fx-muted mt-1">
                                  {o.payment_method?.toUpperCase()}
                                </div>
                              </td>

                              <td>
                                <span className={`${badge(o.status)} fx-badge-soft`}>
                                  {o.status}
                                </span>
                              </td>

                              <td className="text-end">
                                <Link
                                  className="btn btn-sm btn-outline-primary fx-view-btn"
                                  to={`/account/orders/${o.id}`}
                                >
                                  View
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* ✅ Client-side pagination (10 per page) */}
                    {totalPages > 1 && (
                      <div className="fx-pagination">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary fx-page-btn"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          Prev
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => (
                          <button
                            key={i}
                            type="button"
                            className={`btn btn-sm fx-page-btn ${
                              currentPage === i + 1
                                ? "btn-primary"
                                : "btn-outline-primary"
                            }`}
                            onClick={() => setCurrentPage(i + 1)}
                          >
                            {i + 1}
                          </button>
                        ))}

                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary fx-page-btn"
                          onClick={() =>
                            setCurrentPage((p) => Math.min(totalPages, p + 1))
                          }
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </button>
                      </div>
                    )}

                    {/* ✅ Your old backend links remain if you still want them (optional)
                        If you DON'T want backend pagination, remove this block:
                    */}
                    {links && false && (
                      <div className="fx-pagination">
                        {links.map((l, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className={`btn btn-sm fx-page-btn ${
                              l.active ? "btn-primary" : "btn-outline-primary"
                            }`}
                            disabled={!l.url}
                            onClick={() => l.url && fetchOrders(l.url)}
                            dangerouslySetInnerHTML={{ __html: l.label }}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="mb-5" />
          </div>
        </div>
      </div>
    </Layout>
  );
}