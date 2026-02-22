import React, { useEffect, useState } from "react";
import Layout from "../common/Layout";
import { Link } from "react-router-dom";
import Sidebar from "../common/Sidebar";
import { adminApi } from "../common/http"; // ✅ IMPORTANT (admin token)

const Users = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 5,
    total: 0,
    last_page: 1,
  });
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  const loadUsers = async (page = 1) => {
    setLoading(true);
    setErrMsg("");

    try {
      const res = await adminApi.get(`/admin/users?page=${page}`);

      if (res.data?.status === 200) {
        setUsers(res.data.data || []);
        setPagination(res.data.pagination || pagination);
      } else {
        setUsers([]);
        setErrMsg("Failed to load users.");
      }
    } catch (err) {
      if (err?.response?.status === 401) setErrMsg("Unauthenticated. Please login as admin.");
      else if (err?.response?.status === 403) setErrMsg("Forbidden. Admin only.");
      else setErrMsg("Something went wrong while loading users.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(1);
    // eslint-disable-next-line
  }, []);

  const prevPage = () => {
    if (pagination.current_page > 1) loadUsers(pagination.current_page - 1);
  };

  const nextPage = () => {
    if (pagination.current_page < pagination.last_page) loadUsers(pagination.current_page + 1);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString();
  };

  return (
    <Layout>
      <div className="container-fluid px-4">
        <div className="row">
          <div className="d-flex justify-content-between mt-5 pb-3">
            <h4 className="h4 pb-0 mb-0">Users</h4>

            <span className="btn btn-info text-white">
              Total: {pagination.total || 0}
            </span>
          </div>

          <div className="col-md-3">
            <Sidebar />
          </div>

          <div className="col-md-9">
            <div className="card shadow">
              <div className="card-body p-4">
                {/* error msg */}
                {errMsg && (
                  <div className="alert alert-danger mb-3">
                    {errMsg}
                  </div>
                )}

                {/* loading */}
                {loading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border" role="status" />
                  </div>
                ) : (
                  <>
                    <div className="table-responsive">
                      <table className="table table-bordered align-middle">
                        <thead>
                          <tr>
                            <th style={{ width: 80 }}>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th style={{ width: 140 }}>Mobile</th>
                            <th style={{ width: 120 }}>City</th>
                            <th style={{ width: 120 }}>Area</th>
                            <th style={{ width: 100 }}>Postal</th>
                            <th style={{ width: 120 }}>Joined</th>
                          </tr>
                        </thead>

                        <tbody>
                          {users.length > 0 ? (
                            users.map((u) => (
                              <tr key={u.id}>
                                <td>{u.id}</td>
                                <td>{u.name || "-"}</td>
                                <td>{u.email || "-"}</td>
                                <td>{u.mobile || "-"}</td>
                                <td>{u.city || "-"}</td>
                                <td>{u.area || "-"}</td>
                                <td>{u.postal_code || "-"}</td>
                                <td>{formatDate(u.created_at)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="8" className="text-center text-muted py-4">
                                No customers found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* pagination footer */}
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="text-muted">
                        Page {pagination.current_page} of {pagination.last_page}
                      </div>

                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={prevPage}
                          disabled={pagination.current_page <= 1}
                        >
                          Prev
                        </button>

                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={nextPage}
                          disabled={pagination.current_page >= pagination.last_page}
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

export default Users;
