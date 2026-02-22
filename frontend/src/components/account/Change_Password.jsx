import React, { useMemo, useRef, useState } from "react";
import Layout from "../common/Layout";
import UserSidebar from "../common/UserSidebar";
import { apiUrl } from "../common/http";
import { toast } from "react-toastify";

const ChangePassword = () => {
  const token = useMemo(
    () => JSON.parse(localStorage.getItem("userInfo") || "{}")?.token,
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
      return {
        field: "current_password",
        message: "Current password is required",
      };

    if (!np || np.length < 6)
      return {
        field: "new_password",
        message: "New password must be at least 6 characters",
      };

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
      toast.error("Please login first.");
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
      const res = await fetch(`${apiUrl}/account/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const raw = await res.text();
      let data = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        toast.error(
          `Server returned non-JSON (status ${res.status}). Check laravel.log`
        );
        console.error("Non-JSON response:", raw);
        return;
      }

      if (res.ok && (data.success === true || data.status === 200 || data.message)) {
        toast.success(data.message || "Password changed successfully");
        setForm({
          current_password: "",
          new_password: "",
          new_password_confirmation: "",
        });
        return;
      }

      if (res.status === 422 && data?.errors) {
        const firstKey = Object.keys(data.errors)[0];
        const firstMsg = data.errors[firstKey]?.[0];
        toast.error(firstMsg || data.message || "Validation error");
        setTimeout(() => refs[firstKey]?.current?.focus?.(), 50);
        return;
      }

      toast.error(data.message || "Password change failed");
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  // ✅ Premium CSS to match your Profile / Orders / Returns pages (ALL in same file)
  const css = `
    .fx-page{
      padding-bottom: 28px;
      animation: fxFadeUp .55s ease both;
    }
    @keyframes fxFadeUp{
      from{opacity:0;transform:translateY(10px)}
      to{opacity:1;transform:translateY(0)}
    }

    .fx-header{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:16px;
      margin-top: 48px;
      margin-bottom: 18px;
    }
    .fx-title{
      font-size: 28px;
      font-weight: 900;
      letter-spacing: -0.6px;
      color:#0f172a;
      margin:0;
    }
    .fx-subtitle{
      margin:6px 0 0;
      color:#64748b;
      font-size:14px;
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
                  radial-gradient(900px 260px at 100% 0%, rgba(245, 158, 11, .10), transparent 55%),
                  radial-gradient(700px 240px at 40% 120%, rgba(244, 63, 94, .08), transparent 55%);
      pointer-events:none;
    }
    .fx-card-body{
      position:relative;
      padding: 22px !important;
    }

    .fx-form-label{
      font-weight: 800;
      color:#0f172a;
    }
    .fx-input{
      border-radius: 14px !important;
      padding: 11px 12px !important;
      border: 1px solid rgba(15, 23, 42, .10) !important;
      box-shadow: 0 10px 22px rgba(15, 23, 42, .05);
      transition: box-shadow .15s ease, transform .15s ease, border-color .15s ease;
    }
    .fx-input:focus{
      border-color: rgba(37, 99, 235, .40) !important;
      box-shadow: 0 0 0 .25rem rgba(37,99,235,.12), 0 14px 30px rgba(15,23,42,.08);
      transform: translateY(-1px);
    }

    .fx-note{
      color:#64748b;
      font-size: 12px;
      margin-top: 6px;
    }

    .fx-actions{
      display:flex;
      gap:10px;
      flex-wrap:wrap;
      align-items:center;
      margin-top: 6px;
    }

    .fx-btn{
      border-radius: 14px !important;
      padding: 10px 14px !important;
      font-weight: 900 !important;
      transition: transform .15s ease, box-shadow .15s ease, filter .15s ease;
      display:inline-flex;
      align-items:center;
      gap:10px;
      position:relative;
      overflow:hidden;
    }
    .fx-btn:hover{
      transform: translateY(-1px);
      filter: brightness(1.02);
    }
    .fx-btn:active{ transform: translateY(0); }
    .fx-btn:disabled{ transform:none; filter:none; opacity:.85; }

    .fx-btn-warning{
      box-shadow: 0 14px 34px rgba(245, 158, 11, .22);
    }

    .fx-tip{
      margin-top: 10px;
      border-radius: 14px;
      padding: 12px 14px;
      background: rgba(148, 163, 184, 0.10);
      border: 1px solid rgba(148, 163, 184, 0.20);
      color:#334155;
      font-size: 13px;
      font-weight: 700;
    }

    .fx-security{
      display:flex;
      gap:10px;
      flex-wrap:wrap;
      margin-bottom: 14px;
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
      background: rgba(245, 158, 11, .80);
      display:inline-block;
    }

    @media (max-width: 768px){
      .fx-header{
        flex-direction: column;
        align-items:flex-start;
      }
      .fx-card-body{
        padding: 16px !important;
      }
    }
  `;

  return (
    <Layout>
      <style>{css}</style>

      <div className="container-fluid px-4 fx-page">
        <div className="row g-4">
          {/* Header */}
          <div className="fx-header">
            <div>
              <h2 className="fx-title">Change Password</h2>
              <div className="fx-subtitle">
                Keep your account secure by using a strong password.
              </div>
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
                <div className="fx-security">
                  <span className="fx-chip">
                    <span className="dot" />
                    Use at least 6+ characters
                  </span>
                  <span className="fx-chip">
                    <span className="dot" style={{ background: "rgba(37,99,235,.80)" }} />
                    Mix letters + numbers
                  </span>
                  <span className="fx-chip">
                    <span className="dot" style={{ background: "rgba(16,185,129,.80)" }} />
                    Avoid old passwords
                  </span>
                </div>

                <form onSubmit={onSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fx-form-label">
                        Current Password *
                      </label>
                      <input
                        ref={refs.current_password}
                        type="password"
                        className="form-control fx-input"
                        name="current_password"
                        value={form.current_password}
                        onChange={onChange}
                      />
                    </div>

                    <div className="col-md-6" />

                    <div className="col-md-6">
                      <label className="form-label fx-form-label">
                        New Password *
                      </label>
                      <input
                        ref={refs.new_password}
                        type="password"
                        className="form-control fx-input"
                        name="new_password"
                        value={form.new_password}
                        onChange={onChange}
                      />
                      <div className="fx-note">Minimum 6 characters</div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fx-form-label">
                        Confirm New Password *
                      </label>
                      <input
                        ref={refs.new_password_confirmation}
                        type="password"
                        className="form-control fx-input"
                        name="new_password_confirmation"
                        value={form.new_password_confirmation}
                        onChange={onChange}
                      />
                      <div className="fx-note">
                        Must match the new password
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="fx-actions">
                        <button
                          type="submit"
                          className="btn btn-warning fx-btn fx-btn-warning"
                          disabled={saving}
                        >
                          {saving ? (
                            <>
                              <span className="spinner-border spinner-border-sm" />
                              Updating...
                            </>
                          ) : (
                            "Update Password"
                          )}
                        </button>
                      </div>

                      <div className="fx-tip">
                        Tip: Use a strong password and don’t reuse old passwords.
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            <div className="mb-5" />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ChangePassword;