// src/components/common/TrendingSearch.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "./http"; // ✅ IMPORTANT: same folder common

const TrendingSearch = () => {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrending();
    // eslint-disable-next-line
  }, []);

  const fetchTrending = async () => {
    try {
      setLoading(true);

      const res = await api.get(`/search/trending?limit=12&days=30`);
      const result = res.data;

      if (result?.status === 200) setItems(result.data || []);
      else setItems([]);
    } catch (e) {
      console.error("Trending fetch error:", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const goShop = (term) => {
    const q = (term || "").trim();
    if (!q) return;
    navigate(`/shop?query=${encodeURIComponent(q)}`);
  };

  if (loading) {
    return (
      <section className="py-4">
        <div className="container">
          <div className="d-flex align-items-end justify-content-between mb-3">
            <div>
              <h2 className="mb-1">Trending Searches</h2>
              <div className="text-muted small">
                Most searched keywords (Last 30 days)
              </div>
            </div>
          </div>

          <div className="text-center py-4">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!items.length) return null;

  return (
    <section className="py-4">
      <div className="container">
        <div className="d-flex align-items-end justify-content-between mb-3">
          <div>
            <h2 className="mb-1">Trending Searches</h2>
            <div className="text-muted small">
              Most searched keywords (Last 30 days)
            </div>
          </div>
        </div>

        <div className="trend-wrap">
          {items.map((it, idx) => (
            <button
              key={`${it.term}-${idx}`}
              type="button"
              className="trend-pill"
              onClick={() => goShop(it.term)}
              title="Search this"
            >
              <span className="trend-term">{it.term}</span>
              <span className="trend-count">{it.total_searches || 0}</span>
            </button>
          ))}
        </div>
      </div>

      <style>{`
        .trend-wrap{ display:flex; flex-wrap:wrap; gap:10px; }
        .trend-pill{
          border: 1px solid #e9ecef; background: #fff; border-radius: 999px;
          padding: 9px 12px; display:flex; align-items:center; gap:10px;
          transition: 0.2s ease; cursor:pointer;
          box-shadow: 0 1px 6px rgba(0,0,0,0.04);
        }
        .trend-pill:hover{
          border-color: #111; transform: translateY(-1px);
          box-shadow: 0 10px 18px rgba(0,0,0,0.08);
        }
        .trend-term{
          font-size: 14px; font-weight: 600; color: #111;
          text-transform: capitalize; max-width: 180px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .trend-count{
          font-size: 12px; font-weight: 700; color: #111;
          background: #f6f7f9; border: 1px solid #eef0f2;
          padding: 3px 9px; border-radius: 999px;
          min-width: 34px; text-align:center;
        }
        @media(max-width: 576px){ .trend-term{ max-width: 120px; } }
      `}</style>
    </section>
  );
};

export default TrendingSearch;