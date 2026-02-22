import React, { useContext } from 'react';
import { AdminAuthContext } from '../context/AdminAuth';
import { Link } from 'react-router-dom';

const Sidebar = () => {
  const { logout } = useContext(AdminAuthContext);

  return (
    <div className='card shadow mb-5 sidebar'>
      <div className='card-body p-4'>
        <ul>

          {/* Dashboard */}
          <li>
            <Link to="/admin/dashboard">Dashboard</Link>
          </li>

          {/* Catalog */}
          <li>
            <Link to="/admin/categories">Categories</Link>
          </li>
          <li>
            <Link to="/admin/brand">Brands</Link>
          </li>
          <li>
            <Link to="/admin/product">Products</Link>
          </li>

          {/* Order Management */}
          <li>
            <Link to="/admin/orders">Orders</Link>
          </li>

          {/* ⭐ ADD RETURNS HERE */}
          <li>
            <Link to="/admin/returns">Returns</Link>
          </li>

          <li>
            <Link to="/admin/shipping">Shipping</Link>
          </li>

          {/* Courier */}
         

          {/* Users */}
          <li>
            <Link to="/admin/users">Users</Link>
          </li>

          {/* Settings */}
          <li>
            <Link to="/admin/password">Change Password</Link>
          </li>

          {/* Logout */}
          <li>
            <Link to="#" onClick={logout}>Logout</Link>
          </li>

        </ul>
      </div>
    </div>
  );
};

export default Sidebar;