import React, { useEffect, useState } from "react";
import Layout from "../common/Layout";
import { Link } from "react-router-dom";
import UserSidebar from "../common/UserSidebar";
import { api } from "../common/http";

const Return = () => {
  const [returns, setReturns] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReturns = async (page = 1) => {
    setLoading(true);
    setError("");

    try {
      const res = await api.get(`/returns?page=${page}`);
      const data = res.data;

      setReturns(data?.data || []);
      setMeta({
        current_page: data?.current_page || 1,
        last_page: data?.last_page || 1,
      });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load return requests.";

      setError(msg);
      setReturns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns(1);
  }, []);

  const badgeClass = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "requested") return "badge bg-warning text-dark";
    if (s === "approved") return "badge bg-primary";
    if (s === "received") return "badge bg-info text-dark";
    if (s === "refunded") return "badge bg-success";
    if (s === "rejected") return "badge bg-danger";
    return "badge bg-secondary";
  };

  const formatDate = (d) => {
    if (!d) return "-";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "-";
    return dt.toLocaleString();
  };

  // ✅ same premium design system as your Profile / Orders pages (ALL CSS in this file)
  const css = `
    .fx-returns-page{
      padding-bottom: 28px;
      animation: fxFadeUp .55s ease both;
    }
    @keyframes fxFadeUp{
      from{opacity:0;transform:translateY(10px)}
      to{opacity:1;transform:translateY(0)}
    }

    .fx-returns-header{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:16px;
      margin-top: 48px;
      margin-bottom: 18px;
    }
    .fx-returns-title{
      font-size: 28px;
      font-weight: 900;
      letter-spacing: -0.6px;
      color:#0f172a;
      margin:0;
    }
    .fx-returns-subtitle{
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

    .fx-table-wrap{
      border-radius: 16px;
      overflow: auto;
      border: 1px solid rgba(15, 23, 42, .08);
      box-shadow: 0 10px 22px rgba(15, 23, 42, .05);
      background: rgba(255,255,255,.9);
    }

    .fx-table{
      margin:0;
      min-width: 980px;
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
    }
    .fx-table tbody tr:hover{
      background: rgba(37, 99, 235, 0.04);
    }

    .fx-muted{ color:#64748b !important; font-size: 13px; }
    .fx-product{
      font-weight: 900;
      letter-spacing: .1px;
    }
    .fx-reason{
      max-width: 260px;
    }

    /* Soft badge style (same as orders) */
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
    .fx-badge-soft.badge.bg-success{ background: rgba(16,185,129,.12) !important; color:#059669 !important; border: 1px solid rgba(16,185,129,.25) !important; }
    .fx-badge-soft.badge.bg-primary{ background: rgba(37,99,235,.12) !important; color:#2563eb !important; border: 1px solid rgba(37,99,235,.25) !important; }
    .fx-badge-soft.badge.bg-danger{ background: rgba(239,68,68,.12) !important; color:#dc2626 !important; border: 1px solid rgba(239,68,68,.25) !important; }
    .fx-badge-soft.badge.bg-info{ background: rgba(6,182,212,.14) !important; color:#0891b2 !important; border: 1px solid rgba(6,182,212,.26) !important; }
    .fx-badge-soft.badge.bg-warning{ background: rgba(245,158,11,.14) !important; color:#b45309 !important; border: 1px solid rgba(245,158,11,.26) !important; }
    .fx-badge-soft.badge.bg-secondary{ background: rgba(100,116,139,.14) !important; color:#475569 !important; border: 1px solid rgba(100,116,139,.26) !important; }

    .fx-alert{
      border-radius: 14px;
      border: 1px solid rgba(15, 23, 42, .08);
      box-shadow: 0 10px 22px rgba(15, 23, 42, .05);
    }

    .fx-empty{
      border-radius: 16px;
      padding: 40px 16px;
      border: 1px dashed rgba(148, 163, 184, 0.55);
      background: rgba(248, 250, 252, 0.7);
    }

    /* Pagination */
    .fx-pagination{
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:12px;
      flex-wrap:wrap;
      margin-top: 14px;
    }
    .fx-page-actions{
      display:flex;
      gap:10px;
      flex-wrap:wrap;
      justify-content:flex-end;
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

    /* Tips card (same system) */
    .fx-tips-card{
      border: 0 !important;
      border-radius: 18px !important;
      overflow: hidden;
      background: rgba(255,255,255,.92);
      box-shadow: 0 14px 40px rgba(15, 23, 42, .10);
    }

    @media (max-width: 768px){
      .fx-returns-header{
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
        min-width: 860px;
      }
      .fx-pagination{
        justify-content:flex-start;
      }
      .fx-page-actions{
        justify-content:flex-start;
      }
    }
  `;

  return (
    <Layout>
      <style>{css}</style>

      <div className="container-fluid px-4">
        <div className="row g-4">
          {/* Header */}
          <div className="fx-returns-header">
            <div>
              <h2 className="fx-returns-title">Returns</h2>
              <div className="fx-returns-subtitle">
                Track your return requests, approvals, and refunds.
              </div>
            </div>

            <div className="fx-actions">
              <Link
                to="/account/orders"
                className="btn btn-primary fx-btn fx-btn-primary"
              >
                Go to Orders
              </Link>
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-md-3">
            <div className="fx-sidebar-wrap">
              <UserSidebar />
            </div>
          </div>

          {/* Main Content */}
          <div className="col-md-9">
            <div className="card fx-card">
              <div className="card-body fx-card-body">
                {/* Loading */}
                {loading && (
                  <div className="d-flex align-items-center gap-2">
                    <div className="spinner-border text-primary" role="status" aria-hidden="true"></div>
                    <div className="fw-semibold">Loading returns...</div>
                  </div>
                )}

                {/* Error */}
                {!loading && error && (
                  <div className="alert alert-danger mb-0 fx-alert">
                    <div className="fw-semibold">Error</div>
                    <div>{error}</div>
                  </div>
                )}

                {/* Empty */}
                {!loading && !error && returns.length === 0 && (
                  <div className="text-center fx-empty">
                    <h5 className="mb-2 fw-bold">No returns yet</h5>
                    <p className="text-muted mb-3">
                      When you request a return, it will appear here.
                    </p>
                    <Link
                      to="/account/orders"
                      className="btn btn-outline-primary fx-btn fx-btn-outline"
                    >
                      View Orders
                    </Link>
                  </div>
                )}

                {/* Table */}
                {!loading && !error && returns.length > 0 && (
                  <>
                    <div className="table-responsive fx-table-wrap">
                      <table className="table fx-table align-middle">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Order Item</th>
                            <th>Qty</th>
                            <th>Reason</th>
                            <th>Status</th>
                            <th>Requested</th>
                            <th>Updated</th>
                          </tr>
                        </thead>

                        <tbody>
                          {returns.map((r) => (
                            <tr key={r.id}>
                              <td className="fw-bold">{r.id}</td>

                              <td>
                                <div className="fx-product">
                                  {r?.order_item?.product_name || "Item"}
                                </div>
                                <div className="fx-muted">
                                  Order ID: {r.order_id} • Item ID: {r.order_item_id}
                                  {r?.order_item?.size ? ` • Size: ${r.order_item.size}` : ""}
                                </div>
                              </td>

                              <td className="fw-semibold">{r.qty}</td>

                              <td className="fx-reason">
                                <div className="text-truncate" title={r.reason || ""}>
                                  {r.reason || "-"}
                                </div>
                              </td>

                              <td>
                                <span className={`${badgeClass(r.status)} fx-badge-soft`}>
                                  {r.status}
                                </span>

                                {r.admin_note ? (
                                  <div className="fx-muted mt-1" title={r.admin_note}>
                                    Admin: {r.admin_note}
                                  </div>
                                ) : null}
                              </td>

                              <td className="fx-muted">{formatDate(r.created_at)}</td>
                              <td className="fx-muted">{formatDate(r.updated_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="fx-pagination">
                      <div className="text-muted">
                        Page <b>{meta.current_page}</b> of <b>{meta.last_page}</b>
                      </div>

                      <div className="fx-page-actions">
                        <button
                          type="button"
                          className="btn btn-outline-primary fx-page-btn"
                          onClick={() => fetchReturns(meta.current_page - 1)}
                          disabled={meta.current_page <= 1}
                        >
                          Prev
                        </button>

                        <button
                          type="button"
                          className="btn btn-outline-primary fx-page-btn"
                          onClick={() => fetchReturns(meta.current_page + 1)}
                          disabled={meta.current_page >= meta.last_page}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Tips Card */}
            <div className="card fx-tips-card mt-4">
              <div className="card-body">
                <div className="fw-bold mb-2">Return tips</div>
                <ul className="mb-0 text-muted">
                  <li>Returns are available only after the order is marked as delivered.</li>
                  <li>Partial returns are allowed until purchased quantity is fully returned.</li>
                  <li>Refund is processed after admin approval.</li>
                </ul>
              </div>
            </div>

            <div className="mb-5" />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Return;