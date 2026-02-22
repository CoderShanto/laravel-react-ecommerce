import React, { useEffect, useState } from "react";
import Layout from "../../common/Layout"; // ✅ adjust if your Layout path different
import { apiUrl } from "../../common/http";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import Sidebar from "../../common/Sidebar";

const pill = (text, type) => (
  <span className={`badge rounded-pill bg-${type} px-3 py-2`} style={{ fontSize: 12 }}>
    {text}
  </span>
);
export default function ShowOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const adminToken = JSON.parse(localStorage.getItem("adminInfo"))?.token;

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/admin/orders`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: adminToken ? `Bearer ${adminToken}` : "",
        },
      });

      const data = await res.json();

      // adjust based on your backend response
      // if your index returns {status:200, orders:[...]} => use data.orders
      // if it returns {status:200, orders:{data:[...]}} => use data.orders.data
      const list = Array.isArray(data.orders) ? data.orders : data.orders?.data;

      if (res.ok && data.status === 200 && Array.isArray(list)) {
        setOrders(list);
      } else {
        setOrders([]);
      }
    } catch (e) {
      console.log(e);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line
  }, []);

  const handleDelete = async (id) => {
    const ok = window.confirm("Are you sure you want to delete this order?");
    if (!ok) return;

    setDeletingId(id);

    try {
      const res = await fetch(`${apiUrl}/admin/orders/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: adminToken ? `Bearer ${adminToken}` : "",
        },
      });

      const data = await res.json();

      if (res.ok && data.status === 200) {
        toast.success("Order deleted");
        setOrders((prev) => prev.filter((o) => o.id !== id));
      } else {
        toast.error(data.message || "Delete failed");
      }
    } catch (e) {
      console.log(e);
      toast.error("Something went wrong");
    } finally {
      setDeletingId(null);
    }
  };

  return (
     <Layout>
    <div className='container-fluid px-4'>
          <div className='row'>
            <div className="d-flex justify-content-between mt-5 pb-3">
              <h4 className="h4 pb-0 mb-0">Customer Orders</h4>
              <Link to="" className="btn btn-primary">Button</Link>
            </div>
            <div className='col-md-3'>
               <Sidebar />
            </div>
            <div className='col-md-9'>
              <div className='card shadow'>
                <div className="card-body p-4">

                  <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3 className="mb-0">Orders</h3>
          <small className="text-muted">Manage all customer orders</small>
        </div>

        <button className="btn btn-outline-primary" onClick={fetchOrders} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <div className="p-3 border-bottom fw-semibold">All Orders</div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: 70 }}>ID</th>
                  <th style={{ minWidth: 180 }}>Order #</th>
                  <th style={{ minWidth: 180 }}>Customer</th>
                  <th style={{ minWidth: 220 }}>Email</th>
                  <th style={{ width: 120 }}>Amount</th>
                  <th style={{ width: 140 }}>Date</th>
                  <th style={{ width: 120 }}>Payment</th>
                  <th style={{ width: 120 }}>Status</th>
                  <th style={{ width: 170 }} className="text-end">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" className="p-4 text-center text-muted">
                      Loading orders...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="p-4 text-center text-muted">
                      No orders found.
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.id}>
                      <td className="fw-semibold">{o.id}</td>
                      <td>
                        <div className="fw-semibold">{o.order_number}</div>
                        <div className="text-muted" style={{ fontSize: 12 }}>
                          #{o.id}
                        </div>
                      </td>
                      <td className="fw-semibold">{o.name}</td>
                      <td className="text-muted">{o.email}</td>
                      <td className="fw-semibold">৳ {Number(o.grand_total)}</td>
                      <td className="text-muted">
                        {o.created_at ? new Date(o.created_at).toLocaleDateString() : "-"}
                      </td>
                      <td>
                        {pill(
                          o.payment_status || "pending",
                          o.payment_status === "paid" ? "success" : "danger"
                        )}
                      </td>
                      <td>{pill(o.status || "pending", "warning")}</td>

                      <td className="text-end">
                        <div className="btn-group">
                          <Link
                            to={`/admin/orders/${o.id}`}
                            className="btn btn-sm btn-outline-primary"
                          >
                            View
                          </Link>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(o.id)}
                            disabled={deletingId === o.id}
                          >
                            {deletingId === o.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

                </div>
              </div>
              
            </div>
          </div>
        </div>
    </Layout>
    
    
  );
}
