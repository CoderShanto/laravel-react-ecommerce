import React, { useMemo, useRef, useState } from "react";
import Layout from "../common/Layout";
import Sidebar from "../common/Sidebar";
import { adminApi } from "../common/http";
import { toast } from "react-toastify";

const AdminChangePassword = () => {
  const token = useMemo(
    () => JSON.parse(localStorage.getItem("adminInfo") || "{}")?.token,
    []
  );

  const [saving, setSaving] = useState(false);

  const refs = {
    current_password: useRef(null),
    new_password: useRef(null),
    new_password_confirmation: useRef(null),
  };

  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    const current = form.current_password?.trim();
    const np = form.new_password;
    const cnp = form.new_password_confirmation;

    if (!current)
      return { field: "current_password", message: "Current password is required" };

    if (!np || np.length < 6)
      return { field: "new_password", message: "New password must be at least 6 characters" };

    if (np !== cnp)
      return {
        field: "new_password_confirmation",
        message: "New password and confirmation do not match",
      };

    return null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    if (!token) {
      toast.error("Please login as admin first.");
      return;
    }

    const v = validate();
    if (v) {
      toast.error(v.message);
      setTimeout(() => refs[v.field]?.current?.focus?.(), 50);
      return;
    }

    setSaving(true);

    try {
      // ✅ using adminApi (it auto adds Bearer token via interceptor)
      const res = await adminApi.post("/admin/change-password", form);

      toast.success(res?.data?.message || "Password changed successfully");
      setForm({
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
      });
    } catch (err) {
      // Laravel validation errors
      if (err?.response?.status === 422 && err?.response?.data?.errors) {
        const errors = err.response.data.errors;
        const firstKey = Object.keys(errors)[0];
        const firstMsg = errors[firstKey]?.[0];
        toast.error(firstMsg || "Validation error");
        setTimeout(() => refs[firstKey]?.current?.focus?.(), 50);
        return;
      }

      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Password change failed"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="container-fluid px-4">
        <div className="row">
          <div className="d-flex justify-content-between mt-5 pb-3">
            <h4 className="h4 pb-0 mb-0">Admin Change Password</h4>
          </div>

          <div className="col-md-3">
            <Sidebar />
          </div>

          <div className="col-md-9">
            <div className="card shadow">
              <div className="card-body p-4">
                <form onSubmit={onSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Current Password *</label>
                      <input
                        ref={refs.current_password}
                        type="password"
                        className="form-control"
                        name="current_password"
                        value={form.current_password}
                        onChange={onChange}
                      />
                    </div>

                    <div className="col-md-6" />

                    <div className="col-md-6">
                      <label className="form-label">New Password *</label>
                      <input
                        ref={refs.new_password}
                        type="password"
                        className="form-control"
                        name="new_password"
                        value={form.new_password}
                        onChange={onChange}
                      />
                      <small className="text-muted">Minimum 6 characters</small>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Confirm New Password *</label>
                      <input
                        ref={refs.new_password_confirmation}
                        type="password"
                        className="form-control"
                        name="new_password_confirmation"
                        value={form.new_password_confirmation}
                        onChange={onChange}
                      />
                    </div>

                    <div className="col-12">
                      <button
                        type="submit"
                        className="btn btn-warning"
                        disabled={saving}
                      >
                        {saving ? "Updating..." : "Update Password"}
                      </button>
                    </div>

                    <div className="col-12">
                      <small className="text-muted">
                        Tip: Use a strong password and don’t reuse old passwords.
                      </small>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default AdminChangePassword;