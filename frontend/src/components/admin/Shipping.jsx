import React, { useEffect, useState } from "react";
import Layout from "../common/Layout";
import { Link } from "react-router-dom";
import Sidebar from "../common/Sidebar";
import { adminApi } from "../common/http";
import { toast } from "react-toastify";

const Shipping = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const [currentCharge, setCurrentCharge] = useState(0);
  const [chargeInput, setChargeInput] = useState("");

  const loadShipping = async () => {
    setLoading(true);
    setErrMsg("");

    try {
      const res = await adminApi.get("/admin/shipping");

      if (res.data?.status === 200) {
        const charge = Number(res.data?.charge ?? res.data?.data?.charge ?? 0);
        setCurrentCharge(charge);
        setChargeInput(String(charge));
      } else {
        setErrMsg("Failed to load shipping.");
      }
    } catch (err) {
      if (err?.response?.status === 401) setErrMsg("Unauthenticated. Please login as admin.");
      else if (err?.response?.status === 403) setErrMsg("Forbidden. Admin only.");
      else setErrMsg("Something went wrong while loading shipping.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShipping();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setErrMsg("");

    const val = Number(chargeInput);
    if (Number.isNaN(val) || val < 0) {
      toast.error("Shipping charge must be 0 or more");
      return;
    }

    setSaving(true);

    try {
      const res = await adminApi.put("/admin/shipping", { charge: val });

      if (res.data?.status === 200) {
        const newCharge = Number(res.data?.charge ?? res.data?.data?.charge ?? val);
        setCurrentCharge(newCharge);
        setChargeInput(String(newCharge));
        toast.success("Shipping updated successfully!");
      } else {
        toast.error("Failed to update shipping.");
      }
    } catch (err) {
      if (err?.response?.status === 422) toast.error("Validation error. Charge must be integer.");
      else if (err?.response?.status === 401) toast.error("Unauthenticated. Please login as admin.");
      else if (err?.response?.status === 403) toast.error("Forbidden. Admin only.");
      else toast.error("Something went wrong while updating shipping.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="container-fluid px-4">
        <div className="row">
          {/* Header (same style as your other admin pages) */}
          <div className="d-flex justify-content-between mt-5 pb-3">
            <h4 className="h4 pb-0 mb-0">Shipping</h4>

            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-secondary"
                onClick={loadShipping}
                disabled={loading}
                type="button"
              >
                Refresh
              </button>
              {/* keep this button style because you used it in template */}
              <Link to="" onClick={(e) => e.preventDefault()} className="btn btn-primary">
                Manage
              </Link>
            </div>
          </div>

          <div className="col-md-3">
            <Sidebar />
          </div>

          <div className="col-md-9">
            <div className="card shadow">
              <div className="card-body p-4">
                {/* Error */}
                {errMsg && <div className="alert alert-danger mb-3">{errMsg}</div>}

                {/* Loading */}
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Top summary row */}
                    <div className="row g-3 mb-4">
                      <div className="col-md-6">
                        <div className="border rounded p-3 h-100">
                          <div className="text-muted small">Current Shipping Charge</div>
                          <div className="fs-3 fw-bold mt-1">৳ {currentCharge}</div>
                          <div className="text-muted small mt-1">
                            This value is used in Cart/Checkout and saved into new orders.
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="border rounded p-3 h-100 d-flex align-items-center justify-content-between">
                          <div>
                            <div className="text-muted small">Status</div>
                            <div className="fw-semibold mt-1">Active</div>
                          </div>
                          <span className="badge bg-info text-dark px-3 py-2">LIVE</span>
                        </div>
                      </div>
                    </div>

                    {/* Update form */}
                    <div className="border rounded p-4">
                      <h5 className="mb-3">Update Shipping</h5>

                      <form onSubmit={handleUpdate}>
                        <div className="row g-3 align-items-end">
                          <div className="col-md-8">
                            <label className="form-label">New Shipping Charge</label>
                            <input
                              type="number"
                              min="0"
                              className="form-control"
                              value={chargeInput}
                              onChange={(e) => setChargeInput(e.target.value)}
                              placeholder="e.g. 60"
                            />
                          </div>

                          <div className="col-md-4 d-grid">
                            <button
                              type="submit"
                              className="btn btn-primary"
                              style={{ width: "150px", height: "40px" }}
                              disabled={saving}
                            >
                              {saving ? "Saving..." : "Update"}
                            </button>
                          </div>
                        </div>

                        <div className="form-text mt-2">
                          Tip: If you set 0, shipping will be free.
                        </div>
                      </form>

                      {/* Optional quick presets */}
                      <div className="d-flex flex-wrap gap-2 mt-3">
                        {[0, 30, 60, 100].map((p) => (
                          <button
                            key={p}
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => setChargeInput(String(p))}
                          >
                            Set ৳ {p}
                          </button>
                        ))}
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

export default Shipping;
