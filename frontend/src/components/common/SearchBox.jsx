import { useEffect, useState } from "react";
import { api } from "./http";
import { useNavigate } from "react-router-dom";

export default function SearchBox() {
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [mode, setMode] = useState("normal");
  const navigate = useNavigate();

  useEffect(() => {
    if (!q.trim()) {
      setSuggestions([]);
      return;
    }

    const t = setTimeout(async () => {
      try {
        const res = await api.get("/search/suggestions", { params: { q } });
        setMode(res.data.mode);
        setSuggestions(res.data.suggestions || []);
      } catch {
        setSuggestions([]);
      }
    }, 250);

    return () => clearTimeout(t);
  }, [q]);

  const submitSearch = async (e) => {
    e.preventDefault();
    if (!q.trim()) return;

    try {
      await api.post("/search/track", { term: q });
    } catch {
      // ignore if not logged in
    }

    window.location.href = `/shop?search=${encodeURIComponent(q)}`;
  };

  const onClickSuggestion = async (productId) => {
    try {
      await api.post(`/products/${productId}/interest`, { action: "click" });
    } catch {
      // ignore if not logged in
    }

    navigate(`/product/${productId}`);
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <form onSubmit={submitSearch}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search products..."
          style={{ width: "100%", padding: "10px" }}
        />
      </form>

      {suggestions.length > 0 && (
        <div style={{ border: "1px solid #ddd", marginTop: 6, background: "#fff" }}>
          <div style={{ padding: 8, fontSize: 12, opacity: 0.8 }}>
            {mode === "personalized" ? "Based on your interest" : "Suggestions"}
          </div>

          {suggestions.map((s) => (
            <div
              key={s.id}
              onClick={() => onClickSuggestion(s.id)}
              style={{ padding: 10, cursor: "pointer" }}
            >
              {s.name} {s.score ? <small>(score: {s.score})</small> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
