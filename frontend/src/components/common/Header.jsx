/* ===========================
   ✅ Header.jsx (User + Admin FIXED — Icons Untouched)
   =========================== */
import React, { useContext, useEffect, useState } from "react";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import logo from "../../assets/images/logo1.svg";
import { Link, useNavigate } from "react-router-dom";
import { apiUrl } from "./http";
import { CartContext } from "../context/Cart";

const Header = () => {
  const [categories, setCategories] = useState([]);
  const { getQty } = useContext(CartContext);
  const navigate = useNavigate();

  const userInfo = JSON.parse(localStorage.getItem("userInfo") || "null");
  const adminInfo = JSON.parse(localStorage.getItem("adminInfo") || "null");

  const isAdmin = !!adminInfo;
  const isUser = !!userInfo;

  const fetchCategories = async () => {
    if (isAdmin) return; // ❌ Don't load categories for admin

    try {
      const res = await fetch(`${apiUrl}/get-categories`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      const result = await res.json();
      if (result.status === 200) setCategories(result.data || []);
      else setCategories([]);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line
  }, []);

  const handleLogout = () => {
    if (isAdmin) {
      localStorage.removeItem("adminInfo");
      navigate("/admin/login");
    } else {
      localStorage.removeItem("userInfo");
      navigate("/account/login");
    }
  };

  return (
    <header className="shadow">
      {/* TOP BAR */}
      <div className={`text-center py-3 ${isAdmin ? "bg-danger" : "bg-dark"}`}>
        <span className="text-white">
          {isAdmin ? "Admin Control Panel" : "Your fashion partner"}
        </span>
      </div>

      <div className="container">
        <Navbar expand="lg">
          <Navbar.Brand
            as={Link}
            to={isAdmin ? "/admin/dashboard" : "/"}
            className="brand-wrap"
          >
            <img src={logo} alt="FashionX logo" className="brand-logo" />
            <div className="brand-text">
              <span className="brand-name">
                {isAdmin ? "FashionX Admin" : "FashionX"}
              </span>
              <span className="brand-tag">
                {isAdmin ? "Dashboard" : "e-commerce"}
              </span>
            </div>
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="navbarScroll" />
          <Navbar.Collapse id="navbarScroll">
            {/* ===== USER SIDE ===== */}
            {!isAdmin && (
              <>
                <Nav className="ms-auto my-2 my-lg-0" navbarScroll>
                  {categories.map((category) => (
                    <Nav.Link
                      key={category.id}
                      as={Link}
                      to={`/shop?category=${category.id}`}
                    >
                      {category.name}
                    </Nav.Link>
                  ))}
                </Nav>

                {/* ✅ Improved alignment + spacing (icons untouched) */}
                <div className="nav-right d-flex align-items-center ms-3">
                  {/* ✅ Make shop look consistent with navbar links */}
                  <Nav.Link
                    as={Link}
                    to="/shop"
                    className="fw-semibold px-3"
                    style={{ color: "#222", fontSize: "15px" }}
                  >
                    Shop
                  </Nav.Link>

                  {/* ===== ICONS PART (UNCHANGED) ===== */}
                  <Link
                    to="/account"
                    className="btn btn-link ms-3 p-0"
                    style={{ color: "inherit" }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="28"
                      height="28"
                      fill="currentColor"
                      className="bi bi-person"
                      viewBox="0 0 16 16"
                    >
                      <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z"></path>
                    </svg>
                  </Link>

                  <Link to="/cart" className="ms-3 cart-bucket">
                    <span>{getQty()}</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="28"
                      fill="currentColor"
                      className="bi bi-bag"
                      viewBox="0 0 16 16"
                    >
                      <path d="M8 1a2.5 2.5 0 0 1 2.5 2.5V4h-5v-.5A2.5 2.5 0 0 1 8 1m3.5 3v-.5a3.5 3.5 0 1 0-7 0V4H1v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4zM2 5h12v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"></path>
                    </svg>
                  </Link>
                  {/* ===== ICONS PART END ===== */}

                  {isUser && (
                    <button
                      className="btn btn-sm btn-outline-secondary ms-3"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  )}
                </div>
              </>
            )}

            {/* ===== ADMIN SIDE ===== */}
            {isAdmin && (
              <div className="ms-auto d-flex align-items-center gap-3">
                <Link to="/admin/dashboard" className="btn btn-light btn-sm">
                  Dashboard
                </Link>

                {/* <Link to="/admin/orders" className="btn btn-outline-light btn-sm">
                  Orders
                </Link> */}

                <Link to="/" className="btn btn-warning btn-sm">
                  View Website
                </Link>

                <button
                  className="btn btn-outline-light btn-sm"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </Navbar.Collapse>
        </Navbar>
      </div>
    </header>
  );
};

export default Header;