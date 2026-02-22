import React, { useEffect, useState } from "react";
import Layout from "../common/Layout";
import { Link } from "react-router-dom";
import Sidebar from "../common/Sidebar";
import { adminApi } from "../common/http";
import { toast } from "react-toastify";

const Return = () => {
  const [returns, setReturns] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const fetchReturns = async (page = 1, status = statusFilter) => {
    setLoading(true);
    try {
      const res = await adminApi.get(
        `/admin/returns?page=${page}${status ? `&status=${status}` : ""}`
      );

      const data = res.data;

      setReturns(data?.data || []);
      setMeta({
        current_page: data?.current_page || 1,
        last_page: data?.last_page || 1,
      });
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to load return requests"
      );
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

  const handleAction = async (id, action, body = {}) => {
    setActionLoading(id + action);

    try {
      await adminApi.post(`/admin/returns/${id}/${action}`, body);
      toast.success(`Return ${action} successful`);
      fetchReturns(meta.current_page);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || `Failed to ${action}`
      );
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <Layout>
      <div className="container-fluid px-4">
        <div className="row">
          <div className="d-flex justify-content-between mt-5 pb-3 align-items-center">
            <h4 className="h4 pb-0 mb-0">Return Management</h4>

            <select
              className="form-select w-auto"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                fetchReturns(1, e.target.value);
              }}
            >
              <option value="">All Status</option>
              <option value="requested">Requested</option>
              <option value="approved">Approved</option>
              <option value="received">Received</option>
              <option value="refunded">Refunded</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="col-md-3">
            <Sidebar />
          </div>

          <div className="col-md-9">
            <div className="card shadow">
              <div className="card-body p-4">

                {loading && <div className="alert alert-info">Loading...</div>}

                {!loading && returns.length === 0 && (
                  <div className="alert alert-warning">
                    No return requests found.
                  </div>
                )}

                {!loading && returns.length > 0 && (
                  <>
                    <div className="table-responsive">
                      <table className="table table-hover align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>#</th>
                            <th>Customer</th>
                            <th>Product</th>
                            <th>Reason</th>
                            <th>Qty</th>
                            <th>Status</th>
                            <th>Requested</th>
                            <th>Actions</th>
                          </tr>
                        </thead>

                        <tbody>
                          {returns.map((r) => (
                            <tr key={r.id}>
                              <td>{r.id}</td>

                              <td>
                                <div className="fw-semibold">
                                  {r?.user?.name}
                                </div>
                                <div className="small text-muted">
                                  {r?.user?.email}
                                </div>
                              </td>

                              <td>
                                {r?.order_item?.product_name}
                                <div className="small text-muted">
                                  Order #{r.order_id}
                                </div>
                              </td>

                               <td style={{ maxWidth: 260 }}>
                                <div className="text-truncate" title={r.reason || ""}>
                                  {r.reason || "-"}
                                </div>
                              </td>

                              <td>{r.qty}</td>

                              <td>
                                <span className={badgeClass(r.status)}>
                                  {r.status}
                                </span>
                              </td>

                              <td>{formatDate(r.created_at)}</td>

                              <td>
                                <div className="d-flex flex-wrap gap-2">

                                  {r.status === "requested" && (
                                    <>
                                      <button
                                        className="btn btn-sm btn-success"
                                        disabled={actionLoading === r.id + "approve"}
                                        onClick={() =>
                                          handleAction(r.id, "approve", {
                                            admin_note: "Approved by admin",
                                          })
                                        }
                                      >
                                        Approve
                                      </button>

                                      <button
                                        className="btn btn-sm btn-danger"
                                        disabled={actionLoading === r.id + "reject"}
                                        onClick={() =>
                                          handleAction(r.id, "reject", {
                                            admin_note: "Rejected by admin",
                                          })
                                        }
                                      >
                                        Reject
                                      </button>
                                    </>
                                  )}

                                  {r.status === "approved" && (
                                    <button
                                      className="btn btn-sm btn-info"
                                      disabled={actionLoading === r.id + "mark-received"}
                                      onClick={() =>
                                        handleAction(r.id, "mark-received")
                                      }
                                    >
                                      Mark Received
                                    </button>
                                  )}

                                  {(r.status === "approved" ||
                                    r.status === "received") && (
                                    <button
                                      className="btn btn-sm btn-primary"
                                      disabled={actionLoading === r.id + "refund"}
                                      onClick={() =>
                                        handleAction(r.id, "refund")
                                      }
                                    >
                                      Refund
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <div>
                        Page {meta.current_page} of {meta.last_page}
                      </div>

                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-outline-secondary"
                          disabled={meta.current_page <= 1}
                          onClick={() =>
                            fetchReturns(meta.current_page - 1)
                          }
                        >
                          Prev
                        </button>

                        <button
                          className="btn btn-outline-secondary"
                          disabled={meta.current_page >= meta.last_page}
                          onClick={() =>
                            fetchReturns(meta.current_page + 1)
                          }
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Return;