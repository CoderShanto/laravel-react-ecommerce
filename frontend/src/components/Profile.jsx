import React, { useEffect, useMemo, useRef, useState } from "react";
import Layout from "./common/Layout";
import UserSidebar from "./common/UserSidebar";
import { apiUrl } from "./common/http";
import { toast } from "react-toastify";

const Profile = () => {
  const token = useMemo(
    () => JSON.parse(localStorage.getItem("userInfo") || "{}")?.token,
    []
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // refs for focusing invalid fields
  const refs = {
    name: useRef(null),
    email: useRef(null),
    mobile: useRef(null),
    address: useRef(null),
    city: useRef(null),
  };

  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    address: "",
    area: "",
    city: "",
    district: "",
    postal_code: "",
    country: "Bangladesh",
  });

  // Normalize API response
  const normalizeProfile = (data) => {
    const p = data?.profile || data?.user || data?.data || data;
    return {
      name: p?.name || "",
      email: p?.email || "",
      mobile: p?.mobile || "",
      address: p?.address || "",
      area: p?.area || "",
      city: p?.city || "",
      district: p?.district || "",
      postal_code: p?.postal_code || "",
      country: p?.country || "Bangladesh",
    };
  };

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const updateLocalStorageUserInfo = (updatedUser) => {
    const existing = JSON.parse(localStorage.getItem("userInfo") || "{}");
    const next = {
      ...existing,
      name: updatedUser?.name ?? existing?.name,
      email: updatedUser?.email ?? existing?.email,
      token: existing?.token,
    };
    localStorage.setItem("userInfo", JSON.stringify(next));
  };

  // ✅ frontend validation (prevents blank save)
  const validate = () => {
    const name = form.name?.trim();
    const email = form.email?.trim();
    const mobile = form.mobile?.trim();
    const address = form.address?.trim();
    const city = form.city?.trim();

    if (!name) return { field: "name", message: "Name is required" };
    if (!email) return { field: "email", message: "Email is required" };
    if (!/^\S+@\S+\.\S+$/.test(email))
      return { field: "email", message: "Email format is invalid" };
    if (!mobile) return { field: "mobile", message: "Mobile is required" };
    if (mobile.length < 8)
      return { field: "mobile", message: "Mobile looks too short" };
    if (!address) return { field: "address", message: "Address is required" };
    if (!city) return { field: "city", message: "City is required" };

    return null;
  };

  // =============================
  // FETCH PROFILE
  // =============================
  const fetchProfile = async () => {
    setLoading(true);

    if (!token) {
      toast.error("Please login first.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/account/profile`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Non-JSON response:", text);
        toast.error("Server error (not JSON). Check laravel.log");
        return;
      }

      if (res.ok && (data.status === 200 || data.success)) {
        setForm(normalizeProfile(data));
      } else if (res.status === 401) {
        toast.error("Session expired. Please login again.");
      } else {
        toast.error(data.message || "Failed to load profile");
      }
    } catch (error) {
      console.error(error);
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line
  }, []);

  // =============================
  // SAVE PROFILE
  // =============================
  const onSave = async () => {
    if (loading || saving) return;

    if (!token) {
      toast.error("Please login first.");
      return;
    }

    // ✅ block blank save + show toast + focus field
    const v = validate();
    if (v) {
      toast.error(v.message);
      setTimeout(() => refs[v.field]?.current?.focus?.(), 50);
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`${apiUrl}/account/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Non-JSON response:", text);
        toast.error("Server error (not JSON). Check laravel.log");
        return;
      }

      // ✅ Server-side validation errors (Laravel 422)
      if (res.status === 422 && data?.errors) {
        const firstKey = Object.keys(data.errors)[0];
        const firstMsg = data.errors[firstKey]?.[0];
        toast.error(firstMsg || "Validation error");
        setTimeout(() => refs[firstKey]?.current?.focus?.(), 50);
        return;
      }

      if (res.ok && (data.status === 200 || data.success)) {
        // ✅ show message from backend if exists
        toast.success(data.message || "Profile updated successfully");

        const updatedUser = data?.user || data?.profile || data?.data || null;

        if (updatedUser) {
          updateLocalStorageUserInfo(updatedUser);
          setForm(normalizeProfile({ profile: updatedUser }));
        } else {
          await fetchProfile();
        }
      } else if (res.status === 401) {
        toast.error("Session expired. Please login again.");
      } else {
        toast.error(data.message || "Save failed");
      }
    } catch (error) {
      console.error(error);
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  // ✅ All CSS in this file (no extra CSS file needed)
  const css = `
    /* ===== Premium Profile Page UI ===== */
    .fx-profile-page{
      padding-bottom: 28px;
      animation: fxFadeUp .55s ease both;
    }
    @keyframes fxFadeUp{
      from{opacity:0;transform:translateY(10px)}
      to{opacity:1;transform:translateY(0)}
    }

    /* Header */
    .fx-profile-header{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:16px;
      margin-top: 48px;
      margin-bottom: 18px;
    }
    .fx-profile-title{
      font-size: 30px;
      font-weight: 900;
      letter-spacing: -0.6px;
      color:#0f172a;
      margin:0;
    }
    .fx-profile-subtitle{
      margin:6px 0 0;
      color:#64748b;
      font-size:14px;
    }

    /* Save Button */
    .fx-save-btn{
      border-radius: 14px !important;
      padding: 10px 16px !important;
      font-weight: 800 !important;
      box-shadow: 0 14px 34px rgba(37, 99, 235, .22);
      transition: transform .15s ease, box-shadow .15s ease, filter .15s ease;
      display:inline-flex;
      align-items:center;
      gap:10px;
      position:relative;
      overflow:hidden;
    }
    .fx-save-btn:hover{
      transform: translateY(-1px);
      box-shadow: 0 18px 40px rgba(37, 99, 235, .28);
      filter: brightness(1.02);
    }
    .fx-save-btn:active{ transform: translateY(0); }
    .fx-save-btn:disabled{
      box-shadow: none;
      transform:none;
      filter:none;
      opacity:.85;
    }

    /* Soft background card */
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
      background: radial-gradient(800px 220px at 20% -10%, rgba(37, 99, 235, .18), transparent 55%),
                  radial-gradient(900px 260px at 100% 0%, rgba(16, 185, 129, .14), transparent 55%),
                  radial-gradient(700px 240px at 40% 120%, rgba(244, 63, 94, .10), transparent 55%);
      pointer-events:none;
    }
    .fx-card-body{
      position:relative;
      padding: 28px !important;
    }

    /* Sidebar wrapper */
    .fx-sidebar-wrap{
      position: sticky;
      top: 90px;
    }

    /* Section heading */
    .fx-section-row{
      display:flex;
      align-items:flex-start;
      justify-content:space-between;
      gap:12px;
      margin-bottom: 18px;
    }
    .fx-section-title{
      margin:0;
      font-weight: 900;
      color:#0f172a;
    }
    .fx-section-hint{
      margin-top:6px;
      color:#64748b;
      font-size: 13px;
    }
    .fx-badge{
      background: rgba(16, 185, 129, 0.12);
      color: #059669;
      border: 1px solid rgba(16, 185, 129, 0.25);
      padding: 8px 12px;
      border-radius: 999px;
      font-weight: 800;
      font-size: 12px;
      white-space:nowrap;
    }

    /* Inputs */
    .fx-label{
      font-size: 12px;
      font-weight: 800;
      color:#334155;
      margin-bottom: 6px;
    }
    .fx-input{
      border-radius: 14px !important;
      padding: 12px 12px !important;
      border: 1px solid rgba(15, 23, 42, 0.10) !important;
      background: rgba(255,255,255,0.92) !important;
      transition: box-shadow .16s ease, border-color .16s ease, transform .16s ease;
      box-shadow: 0 10px 20px rgba(15, 23, 42, .04);
    }
    .fx-input:hover{
      transform: translateY(-1px);
    }
    .fx-input:focus{
      border-color: rgba(37, 99, 235, 0.55) !important;
      box-shadow: 0 0 0 6px rgba(37, 99, 235, 0.12), 0 10px 22px rgba(15, 23, 42, .06) !important;
      outline: none;
    }

    /* Small footnote */
    .fx-footnote{
      margin-top: 6px;
      font-size: 13px;
      color:#64748b;
      display:flex;
      align-items:center;
      gap:10px;
      padding: 10px 12px;
      border-radius: 12px;
      background: rgba(148, 163, 184, 0.10);
      border: 1px solid rgba(148, 163, 184, 0.18);
    }
    .fx-dot{
      width:8px;height:8px;border-radius:999px;
      background: rgba(37, 99, 235, .7);
      display:inline-block;
      flex: 0 0 auto;
    }

    /* Loading skeleton */
    .fx-skeleton{
      display:grid;
      gap:12px;
    }
    .fx-skel-line{
      border-radius: 14px;
      height: 48px;
      background: linear-gradient(90deg, rgba(229,231,235,.75), rgba(243,244,246,.95), rgba(229,231,235,.75));
      background-size: 200% 100%;
      animation: fxShimmer 1.2s ease-in-out infinite;
    }
    .fx-skel-title{
      height: 22px;
      width: 260px;
    }
    @keyframes fxShimmer{
      0%{background-position:0% 0}
      100%{background-position:200% 0}
    }

    /* Responsive */
    @media (max-width: 768px){
      .fx-profile-header{
        flex-direction: column;
        align-items: flex-start;
      }
      .fx-save-btn{
        width: 100%;
        justify-content:center;
      }
      .fx-card-body{
        padding: 18px !important;
      }
    }
  `;

  return (
    <Layout>
      <style>{css}</style>

      <div className="container-fluid px-4">
        <div className="row">
          <div className="fx-profile-header">
            <div>
              <h2 className="fx-profile-title">My Account</h2>
              <p className="fx-profile-subtitle">
                Update your personal info and delivery address for faster checkout.
              </p>
            </div>

            <button
              className="btn btn-primary fx-save-btn"
              onClick={onSave}
              disabled={saving || loading}
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>

          <div className="col-md-3 mb-4 mb-md-0">
            <div className="fx-sidebar-wrap">
              <UserSidebar />
            </div>
          </div>

          <div className="col-md-9">
            <div className="card fx-card">
              <div className="card-body fx-card-body">
                {loading ? (
                  <div className="fx-skeleton">
                    <div className="fx-skel-line fx-skel-title" />
                    <div className="fx-skel-line" />
                    <div className="fx-skel-line" />
                    <div className="fx-skel-line" />
                  </div>
                ) : (
                  <>
                    <div className="fx-section-row">
                      <div>
                        <h5 className="fx-section-title">Profile Details</h5>
                        <div className="fx-section-hint">
                          Keep your information accurate to avoid delivery issues.
                        </div>
                      </div>
                      <span className="fx-badge">Verified</span>
                    </div>

                    <div className="row g-4">
                      <div className="col-md-6">
                        <label className="form-label fx-label">Name *</label>
                        <input
                          ref={refs.name}
                          className="form-control fx-input"
                          name="name"
                          value={form.name}
                          onChange={onChange}
                          placeholder="Enter your full name"
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fx-label">Email *</label>
                        <input
                          ref={refs.email}
                          className="form-control fx-input"
                          name="email"
                          value={form.email}
                          onChange={onChange}
                          placeholder="you@example.com"
                        />
                      </div>

                      <div className="col-md-12">
                        <label className="form-label fx-label">Mobile *</label>
                        <input
                          ref={refs.mobile}
                          className="form-control fx-input"
                          name="mobile"
                          value={form.mobile}
                          onChange={onChange}
                          placeholder="e.g. 01XXXXXXXXX"
                        />
                      </div>

                      <div className="col-md-12">
                        <label className="form-label fx-label">Address *</label>
                        <textarea
                          ref={refs.address}
                          className="form-control fx-input"
                          rows={3}
                          name="address"
                          value={form.address}
                          onChange={onChange}
                          placeholder="House / Road / Area details"
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fx-label">Area</label>
                        <input
                          className="form-control fx-input"
                          name="area"
                          value={form.area}
                          onChange={onChange}
                          placeholder="e.g. Gopipur"
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fx-label">District</label>
                        <input
                          className="form-control fx-input"
                          name="district"
                          value={form.district}
                          onChange={onChange}
                          placeholder="e.g. Dhaka"
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fx-label">City *</label>
                        <input
                          ref={refs.city}
                          className="form-control fx-input"
                          name="city"
                          value={form.city}
                          onChange={onChange}
                          placeholder="e.g. Cumilla"
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fx-label">Postal Code</label>
                        <input
                          className="form-control fx-input"
                          name="postal_code"
                          value={form.postal_code}
                          onChange={onChange}
                          placeholder="e.g. 1207"
                        />
                      </div>

                      <div className="col-12">
                        <div className="fx-footnote">
                          <span className="fx-dot" />
                          Fields marked <strong>*</strong> are required.
                        </div>
                      </div>
                    </div>
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
};

export default Profile;