import React, { useEffect, useRef, useState } from "react";
import { api } from "./http";

export default function AutoCompleteSearch({
  value,
  onChange,
  onSelect,
  onEnterSearch, // ✅ only called for typed Enter (not suggestion click)
  placeholder = "Search product by title...",
}) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const boxRef = useRef(null);

  useEffect(() => {
    const q = value.trim();
    if (!q) {
      setItems([]);
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    const t = setTimeout(async () => {
      try {
        const res = await api.get("/search/suggestions", { params: { q } });
        const list = res.data?.suggestions || [];
        setItems(list);
        setOpen(list.length > 0);
        setActiveIndex(-1);
      } catch (err) {
        setItems([]);
        setOpen(false);
        setActiveIndex(-1);
      }
    }, 200);

    return () => clearTimeout(t);
  }, [value]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const handleKeyDown = async (e) => {
    if (e.key === "ArrowDown" && open && items.length > 0) {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, items.length - 1));
      return;
    }

    if (e.key === "ArrowUp" && open && items.length > 0) {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();

      // ✅ If suggestion highlighted, select it (Shop will handle tracking once)
      if (open && activeIndex >= 0 && items[activeIndex]) {
        onSelect(items[activeIndex]);
        setOpen(false);
        setActiveIndex(-1);
        return;
      }

      // ✅ Otherwise typed search: track once here
      if (onEnterSearch) {
        await onEnterSearch(value);
      }

      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  const highlightMatch = (text, q) => {
    const query = q.trim();
    if (!query) return text;

    const i = text.toLowerCase().indexOf(query.toLowerCase());
    if (i === -1) return text;

    const before = text.slice(0, i);
    const match = text.slice(i, i + query.length);
    const after = text.slice(i + query.length);

    return (
      <>
        {before}
        <strong>{match}</strong>
        {after}
      </>
    );
  };

  return (
    <div ref={boxRef} style={{ position: "relative", width: "100%" }}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="form-control"
        onFocus={() => value.trim() && items.length > 0 && setOpen(true)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />

      {open && items.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: 10,
            marginTop: 6,
            overflow: "hidden",
            boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
            zIndex: 9999,
          }}
        >
          {items.map((item, idx) => (
            <div
              key={item.id}
              onMouseDown={() => {
                onSelect(item); // ✅ Shop tracks once
                setOpen(false);
                setActiveIndex(-1);
              }}
              onMouseEnter={() => setActiveIndex(idx)}
              style={{
                padding: "10px 12px",
                cursor: "pointer",
                background: idx === activeIndex ? "#f2f4f7" : "#fff",
                display: "flex",
                gap: 10,
                alignItems: "center",
                borderTop: idx === 0 ? "none" : "1px solid #f1f1f1",
              }}
            >
              <span style={{ opacity: 0.7 }}>🔍</span>
              <span>{highlightMatch(item.name, value)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
