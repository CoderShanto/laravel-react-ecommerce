import React, { useEffect, useState } from "react";
import Layout from "../common/Layout";
import { Link, useNavigate } from "react-router-dom";
import UserSidebar from "../common/UserSidebar";
import { api } from "../common/http";
import { toast } from "react-toastify";

const PER_PAGE = 10;

const UserHistory = () => {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get("/search/history?limit=100");
      setItems(res.data?.data || []);
    } catch {
      toast.error("Failed to load history");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const totalPages = Math.ceil(items.length / PER_PAGE);
  const startIndex = (currentPage - 1) * PER_PAGE;
  const paginatedItems = items.slice(startIndex, startIndex + PER_PAGE);

  const deleteOne = async (id) => {
    try {
      setDeletingId(id);
      await api.delete(`/search/history/${id}`);
      const updated = items.filter((x) => x.id !== id);
      setItems(updated);
      toast.success("Deleted");

      if (updated.length / PER_PAGE < currentPage && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const clearAll = async () => {
    try {
      setClearing(true);
      await api.delete("/search/history/clear");
      setItems([]);
      toast.success("History cleared");
      setCurrentPage(1);
    } catch {
      toast.error("Clear failed");
    } finally {
      setClearing(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleString();
  };

  const css = `
    .fx-history-page{
      padding-bottom: 30px;
      animation: fadeUp .4s ease both;
    }
    @keyframes fadeUp{
      from{opacity:0;transform:translateY(10px)}
      to{opacity:1;transform:translateY(0)}
    }

    .fx-header{
      display:flex;
      justify-content:space-between;
      align-items:center;
      margin-top:48px;
      margin-bottom:20px;
      flex-wrap:wrap;
      gap:12px;
    }

    .fx-title{
      font-size:28px;
      font-weight:900;
      color:#0f172a;
    }

    .fx-card{
      border:0;
      border-radius:18px;
      background:rgba(255,255,255,.92);
      box-shadow:0 18px 60px rgba(15,23,42,.12);
    }

    .fx-table thead th{
      font-size:12px;
      font-weight:900;
      background:#f8fafc;
      padding:14px;
    }

    .fx-table tbody td{
      padding:14px;
      vertical-align:middle;
    }

    .fx-table tbody tr:hover{
      background:rgba(37,99,235,.05);
    }

    .fx-badge-soft{
      border-radius:999px;
      padding:6px 10px;
      font-size:12px;
      font-weight:800;
      background:rgba(148,163,184,.15);
      border:1px solid rgba(148,163,184,.3);
    }

    .fx-delete-btn{
      border-radius:10px;
      font-weight:800;
      padding:6px 10px;
    }

    .fx-pagination .page-link{
      border-radius:10px !important;
      font-weight:800;
    }

    .fx-empty{
      padding:50px 0;
      border-radius:16px;
      border:1px dashed rgba(148,163,184,.4);
      background:#f8fafc;
    }
  `;

  return (
    <Layout>
      <style>{css}</style>

      <div className="container-fluid px-4 fx-page">
        <div className="row">

          <div className="fx-header">
            <div className="fx-title">Search History</div>

            {items.length > 0 ? (
              <button
                className="btn btn-outline-danger"
                onClick={clearAll}
                disabled={clearing}
              >
                {clearing ? "Clearing..." : "Clear All"}
              </button>
            ) : (
              <Link to="/shop" className="btn btn-primary">
                Shop Now
              </Link>
            )}
          </div>

          <div className="col-md-3">
            <UserSidebar />
          </div>

          <div className="col-md-9">
            <div className="card fx-card">
              <div className="card-body p-4">

                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" />
                  </div>
                ) : items.length === 0 ? (
                  <div className="text-center fx-empty">
                    <h6 className="fw-bold">No search history found</h6>
                    <p className="text-muted mb-0">
                      Your search activity will appear here.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="table-responsive">
                      <table className="table fx-table align-middle">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Term</th>
                            <th>Count</th>
                            <th>Results</th>
                            <th>Last Searched</th>
                            <th className="text-end">Action</th>
                          </tr>
                        </thead>

                        <tbody>
                          {paginatedItems.map((item, index) => (
                            <tr key={item.id}>
                              <td>{startIndex + index + 1}</td>

                              <td className="fw-bold">
                                {item.term}
                              </td>

                              <td>
                                <span className="fx-badge-soft">
                                  {item.searches_count}
                                </span>
                              </td>

                              <td>
                                {item.results_found ? (
                                  <span className="text-success fw-semibold">
                                    Found ({item.results_count})
                                  </span>
                                ) : (
                                  <span className="text-danger fw-semibold">
                                    Not Found
                                  </span>
                                )}
                              </td>

                              <td className="text-muted small">
                                {formatDate(item.last_searched_at)}
                              </td>

                              <td className="text-end">
                                <button
                                  className="btn btn-sm btn-outline-danger fx-delete-btn"
                                  onClick={() => deleteOne(item.id)}
                                  disabled={deletingId === item.id}
                                >
                                  {deletingId === item.id ? "..." : "✕"}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {totalPages > 1 && (
                      <nav className="mt-4">
                        <ul className="pagination justify-content-end fx-pagination mb-0">
                          <li className={`page-item ${currentPage === 1 && "disabled"}`}>
                            <button
                              className="page-link"
                              onClick={() => setCurrentPage(currentPage - 1)}
                            >
                              Previous
                            </button>
                          </li>

                          {[...Array(totalPages)].map((_, i) => (
                            <li
                              key={i}
                              className={`page-item ${currentPage === i + 1 ? "active" : ""}`}
                            >
                              <button
                                className="page-link"
                                onClick={() => setCurrentPage(i + 1)}
                              >
                                {i + 1}
                              </button>
                            </li>
                          ))}

                          <li className={`page-item ${currentPage === totalPages && "disabled"}`}>
                            <button
                              className="page-link"
                              onClick={() => setCurrentPage(currentPage + 1)}
                            >
                              Next
                            </button>
                          </li>
                        </ul>
                      </nav>
                    )}

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

export default UserHistory;