import React, { useEffect, useMemo, useState } from "react";
import Layout from "../common/Layout";
import Sidebar from "../common/Sidebar";
import { adminApi } from "../common/http";
import { toast } from "react-toastify";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const money = (n) => `৳ ${Number(n || 0).toFixed(2)}`;

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);

  const colors = useMemo(
    () => ["#0d6efd", "#198754", "#ffc107", "#dc3545", "#6f42c1", "#20c997", "#fd7e14"],
    []
  );

  const fetchDashboard = async (range = days) => {
    setLoading(true);
    try {
      const res = await adminApi.get(`/admin/dashboard?days=${range}`);
      setData(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load dashboard");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard(days);
    // eslint-disable-next-line
  }, []);

  const k = data?.kpis || {};
  const c = data?.charts || {};
  const t = data?.tables || {};

  const salesOverTime = (c.sales_over_time || []).map((x) => ({
    day: x.day,
    revenue: Number(x.revenue_sum || 0),
    orders: Number(x.orders_count || 0),
  }));

  const ordersByStatus = (c.orders_by_status || []).map((x) => ({
    name: x.status || "unknown",
    value: Number(x.total || 0),
  }));

  const returnsByStatus = (c.returns_by_status || []).map((x) => ({
    name: x.status || "unknown",
    value: Number(x.total || 0),
  }));

  const topProducts = (c.top_products || []).map((x) => ({
    name: x.product_name || `#${x.product_id}`,
    qty: Number(x.total_qty || 0),
    revenue: Number(x.total_revenue || 0),
  }));

  const categoryRevenue = (c.category_revenue || []).map((x) => ({
    name: x.category,
    revenue: Number(x.revenue || 0),
  }));

  const brandRevenue = (c.brand_revenue || []).map((x) => ({
    name: x.brand,
    revenue: Number(x.revenue || 0),
  }));

  const trendingSearches = (c.trending_searches || []).map((x) => ({
    term: x.term,
    searches: Number(x.total_searches || 0),
    noResults: Number(x.no_results_count || 0),
  }));

  const interestProducts = (c.top_interest_products || []).map((x) => ({
    name: x.product_name,
    score: Number(x.total_score || 0),
    cart: Number(x.total_cart || 0),
    purchase: Number(x.total_purchase || 0),
  }));

  const lowStockList = t.low_stock_list || [];

  const onChangeRange = (val) => {
    setDays(val);
    fetchDashboard(val);
  };

  return (
    <Layout>
      <div className="container-fluid px-4">
        <div className="row">
          <div className="d-flex justify-content-between align-items-center mt-5 pb-3">
            <div>
              <h4 className="h4 mb-0">Admin Dashboard</h4>
              <div className="text-muted small">
                Analytics overview for last <b>{days}</b> days
              </div>
            </div>

            <div className="d-flex gap-2 align-items-center">
              <select
                className="form-select"
                style={{ width: 180 }}
                value={days}
                onChange={(e) => onChangeRange(Number(e.target.value))}
                disabled={loading}
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>

              <button className="btn btn-outline-primary" onClick={() => fetchDashboard(days)} disabled={loading}>
                Refresh
              </button>
            </div>
          </div>

          <div className="col-md-3">
            <Sidebar />
          </div>

          <div className="col-md-9">
            {loading && <div className="alert alert-info">Loading dashboard...</div>}

            {!loading && !data && (
              <div className="alert alert-danger">Dashboard data not available.</div>
            )}

            {!loading && data && (
              <>
                {/* KPI Cards */}
                <div className="row g-3 mb-3">
                  <div className="col-md-3">
                    <div className="card shadow-sm">
                      <div className="card-body">
                        <div className="text-muted small">Revenue</div>
                        <div className="fs-5 fw-bold">{money(k.revenue)}</div>
                        <div className="text-muted small">Net Sales: {money(k.net_sales)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-3">
                    <div className="card shadow-sm">
                      <div className="card-body">
                        <div className="text-muted small">Orders</div>
                        <div className="fs-5 fw-bold">{k.total_orders}</div>
                        <div className="text-muted small">
                          Delivered: {k.delivered_orders} • Processing: {k.processing_orders}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-3">
                    <div className="card shadow-sm">
                      <div className="card-body">
                        <div className="text-muted small">Payments</div>
                        <div className="fs-5 fw-bold">{k.paid_orders} paid</div>
                        <div className="text-muted small">{k.pending_payment_orders} pending</div>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-3">
                    <div className="card shadow-sm">
                      <div className="card-body">
                        <div className="text-muted small">Returns</div>
                        <div className="fs-5 fw-bold">{k.returns_count}</div>
                        <div className="text-muted small">
                          Refund loss est: {money(k.refund_loss_estimate)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-3">
                    <div className="card shadow-sm">
                      <div className="card-body">
                        <div className="text-muted small">Customers</div>
                        <div className="fs-5 fw-bold">{k.total_customers}</div>
                        <div className="text-muted small">New: {k.new_customers}</div>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-3">
                    <div className="card shadow-sm">
                      <div className="card-body">
                        <div className="text-muted small">Products</div>
                        <div className="fs-5 fw-bold">{k.total_products}</div>
                        <div className="text-muted small">
                          Low stock: {k.low_stock_products} • Out: {k.out_of_stock_products}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-3">
                    <div className="card shadow-sm">
                      <div className="card-body">
                        <div className="text-muted small">Discount Given</div>
                        <div className="fs-5 fw-bold">{money(k.discount)}</div>
                        <div className="text-muted small">Shipping: {money(k.shipping)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-3">
                    <div className="card shadow-sm">
                      <div className="card-body">
                        <div className="text-muted small">Cancelled</div>
                        <div className="fs-5 fw-bold">{k.cancelled_orders}</div>
                        <div className="text-muted small">Track order health</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts Row 1 */}
                <div className="row g-3 mb-3">
                  <div className="col-lg-8">
                    <div className="card shadow-sm">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h6 className="mb-0">Sales Over Time</h6>
                          <span className="text-muted small">Revenue trend</span>
                        </div>

                        <div style={{ height: 320 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={salesOverTime}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="day" />
                              <YAxis />
                              <Tooltip formatter={(v, n) => (n === "revenue" ? money(v) : v)} />
                              <Legend />
                              <Line type="monotone" dataKey="revenue" stroke={colors[0]} strokeWidth={2} dot={false} />
                              <Line type="monotone" dataKey="orders" stroke={colors[1]} strokeWidth={2} dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-lg-4">
                    <div className="card shadow-sm">
                      <div className="card-body">
                        <h6 className="mb-2">Orders by Status</h6>
                        <div style={{ height: 320 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={ordersByStatus} dataKey="value" nameKey="name" outerRadius={110} label>
                                {ordersByStatus.map((_, idx) => (
                                  <Cell key={idx} fill={colors[idx % colors.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts Row 2 */}
                <div className="row g-3 mb-3">
                  <div className="col-lg-6">
                    <div className="card shadow-sm">
                      <div className="card-body">
                        <h6 className="mb-2">Top Selling Products (Qty)</h6>
                        <div style={{ height: 320 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topProducts}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" hide />
                              <YAxis />
                              <Tooltip formatter={(v, n) => (n === "revenue" ? money(v) : v)} />
                              <Legend />
                              <Bar dataKey="qty" fill={colors[0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="text-muted small">
                          Tip: Add product detail page for deeper insights.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-lg-6">
                    <div className="card shadow-sm">
                      <div className="card-body">
                        <h6 className="mb-2">Category Revenue</h6>
                        <div style={{ height: 320 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={categoryRevenue}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" hide />
                              <YAxis />
                              <Tooltip formatter={(v) => money(v)} />
                              <Legend />
                              <Bar dataKey="revenue" fill={colors[2]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts Row 3 */}
                <div className="row g-3 mb-3">
                  <div className="col-lg-6">
                    <div className="card shadow-sm">
                      <div className="card-body">
                        <h6 className="mb-2">Brand Revenue</h6>
                        <div style={{ height: 300 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={brandRevenue}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" hide />
                              <YAxis />
                              <Tooltip formatter={(v) => money(v)} />
                              <Legend />
                              <Bar dataKey="revenue" fill={colors[3]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-lg-6">
                    <div className="card shadow-sm">
                      <div className="card-body">
                        <h6 className="mb-2">Returns by Status</h6>
                        <div style={{ height: 300 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={returnsByStatus} dataKey="value" nameKey="name" outerRadius={105} label>
                                {returnsByStatus.map((_, idx) => (
                                  <Cell key={idx} fill={colors[idx % colors.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Advanced analytics row */}
                <div className="row g-3 mb-3">
                  <div className="col-lg-6">
                    <div className="card shadow-sm">
                      <div className="card-body">
                        <h6 className="mb-2">Trending Searches</h6>
                        <div style={{ height: 300 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trendingSearches}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="term" hide />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="searches" fill={colors[1]} />
                              <Bar dataKey="noResults" fill={colors[4]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="text-muted small">
                          “No results” indicates missing products customers want.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-lg-6">
                    <div className="card shadow-sm">
                      <div className="card-body">
                        <h6 className="mb-2">Product Interest (Score)</h6>
                        <div style={{ height: 300 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={interestProducts}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" hide />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="score" fill={colors[0]} />
                              <Bar dataKey="cart" fill={colors[2]} />
                              <Bar dataKey="purchase" fill={colors[5]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="text-muted small">
                          Score is your strongest “business intelligence” metric.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tables */}
                <div className="row g-3">
                  <div className="col-lg-12">
                    <div className="card shadow-sm">
                      <div className="card-body">
                        <h6 className="mb-2">Low Stock Products</h6>

                        <div className="table-responsive">
                          <table className="table table-hover align-middle">
                            <thead className="table-light">
                              <tr>
                                <th>ID</th>
                                <th>Product</th>
                                <th className="text-end">Qty</th>
                                <th className="text-end">Price</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {lowStockList.map((p) => (
                                <tr key={p.id}>
                                  <td>{p.id}</td>
                                  <td className="fw-semibold">{p.title}</td>
                                  <td className="text-end">{p.qty}</td>
                                  <td className="text-end">{money(p.price)}</td>
                                  <td>{p.status}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="text-muted small">
                          Tip: keep threshold at qty ≤ 5 (you can change in backend).
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;