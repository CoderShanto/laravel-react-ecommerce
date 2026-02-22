import React, { useRef } from "react";
import logo from "../../assets/images/logo1.svg";

export default function Logo3D({ size = 42, text = "FashionX" }) {
  const wrapRef = useRef(null);

  const onMove = (e) => {
    const el = wrapRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left; // inside element
    const y = e.clientY - rect.top;

    const midX = rect.width / 2;
    const midY = rect.height / 2;

    // tilt strength (smaller = smoother)
    const rotY = ((x - midX) / midX) * 10; // -10..10
    const rotX = -((y - midY) / midY) * 10; // -10..10

    el.style.setProperty("--rx", `${rotX}deg`);
    el.style.setProperty("--ry", `${rotY}deg`);
    el.style.setProperty("--tz", `10px`);
  };

  const onLeave = () => {
    const el = wrapRef.current;
    if (!el) return;
    el.style.setProperty("--rx", `0deg`);
    el.style.setProperty("--ry", `0deg`);
    el.style.setProperty("--tz", `0px`);
  };

  return (
    <a href="/" className="logo3d-link" aria-label="Go to home">
      <div
        ref={wrapRef}
        className="logo3d"
        onMouseMove={onMove}
        onMouseLeave={onLeave}
      >
        <div className="logo3d-badge" style={{ width: size, height: size }}>
          <img src={logo} alt="Logo" className="logo3d-svg" draggable="false" />
        </div>

        <div className="logo3d-text">
          <span className="logo3d-name">{text}</span>
          <span className="logo3d-tagline d-none d-md-inline">e-commerce</span>
        </div>
      </div>
    </a>
  );
}
