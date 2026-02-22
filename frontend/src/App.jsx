import { useState } from 'react'
import { BrowserRouter,Route,Routes } from 'react-router-dom'
import Home from './components/Home'
import Shop from './components/Shop'
import Product from './components/Product'
import Cart from './components/Cart'
import Checkout from './components/Checkout'
import Login from './components/admin/Login'
import { ToastContainer } from 'react-toastify'
import Dashboard from './components/admin/Dashboard'
import { AdminRequireAuth } from './components/admin/AdminRequireAuth'
import {default as ShowCategories} from './components/admin/category/Show'
import {default as CreateCategories} from './components/admin/category/Create'
import {default as EditCategories} from './components/admin/category/Edit'
import {default as ShowBrands} from './components/admin/brand/Show'
import {default as CreateBrands} from './components/admin/brand/Create'
import {default as EditBrands} from './components/admin/brand/Edit'
import {default as ShowProducts} from './components/admin/product/Show'
import {default as CreateProducts} from './components/admin/product/Create'
import {default as EditProducts} from './components/admin/product/Edit'
import {default as ShowOrders} from './components/admin/orders/Show'
import {default as OrderDetails}  from './components/admin/orders/OrderDetails'
import Register from './components/Register'
import {default as UserLogin} from './components/Login'
import {default as UserRegister} from './components/Register'
import Profile from './components/Profile'
import { RequireAuth } from './components/RequireAuth'
import OrderSuccess from './components/OrderSuccess'
import AccountOrders from './components/account/Orders'
import AccountOrderDetails from './components/account/OrderDetails'
import Users from "./components/admin/Users";
import Password from "./components/admin/ChangePassword";
import ShowReturns from "./components/admin/Return";
import Shipping from './components/admin/Shipping'
import Discount from './components/admin/Discount'
import UserHistory from './components/account/UserHistory'
import UserPassword from './components/account/Change_Password'
import AccountReturn from './components/account/Return'


function App() {

  return (
    <>
    <BrowserRouter>
    <Routes>
     {/**User Routes */}
     <Route path='/' element={<Home/>} />
     <Route path='/shop' element={<Shop/>} />
     <Route path='/product/:id' element={<Product/>} />
     <Route path='/cart' element={<Cart/>} />
     <Route path='/checkout' element={<Checkout/>} />
     <Route path='/order-success' element={<OrderSuccess/>} />
         <Route path='/account/register' element={<UserRegister/>} />
     <Route path='/account/login' element={<UserLogin/>} />
     
     
      
      <Route path='/order-success' element={
      <RequireAuth>
        <OrderSuccess/>
      </RequireAuth>
     } />
     
     <Route path='/account' element={
      <RequireAuth>
        <Profile/>
      </RequireAuth>
     } />

        <Route path='/account/orders' element={
      <RequireAuth>
        <AccountOrders />
      </RequireAuth>
    } />

    <Route path='/account/return' element={
      <RequireAuth>
        <AccountReturn />
      </RequireAuth>
    } />

    <Route path='/account/history' element={
      <RequireAuth>
        <UserHistory />
      </RequireAuth>
    } />

      <Route path='/account/change-password' element={
      <RequireAuth>
        <UserPassword />
      </RequireAuth>
    } />

      <Route path='/account/orders/:id' element={
        <RequireAuth>
          <AccountOrderDetails />
        </RequireAuth>
      } />





     
     {/**Admin Routes */}
     <Route path='/admin/login' element={<Login/>} />
     <Route path='/admin/dashboard' element={
      <AdminRequireAuth>
        <Dashboard/>
      </AdminRequireAuth>
     } />

      <Route path='/admin/categories' element={
      <AdminRequireAuth>
        <ShowCategories/>
      </AdminRequireAuth>
     } />

     <Route path='/admin/categories/create' element={
      <AdminRequireAuth>
        <CreateCategories/>
      </AdminRequireAuth>
     } />

     <Route path='/admin/categories/edit/:id' element={
      <AdminRequireAuth>
        <EditCategories/>
      </AdminRequireAuth>
     } />

     <Route path='/admin/brand' element={
      <AdminRequireAuth>
        <ShowBrands/>
      </AdminRequireAuth>
     } />

     <Route path='/admin/brand/create' element={
      <AdminRequireAuth>
        <CreateBrands/>
      </AdminRequireAuth>
     } />

      <Route path='/admin/brands/edit/:id' element={
      <AdminRequireAuth>
        <EditBrands/>
      </AdminRequireAuth>
     } />

      <Route path='/admin/product' element={
      <AdminRequireAuth>
        <ShowProducts/>
      </AdminRequireAuth>
     } />

     <Route path='/admin/product/create' element={
      <AdminRequireAuth>
        <CreateProducts/>
      </AdminRequireAuth>
     } />

      <Route path='/admin/product/edit/:id' element={
      <AdminRequireAuth>
        <EditProducts/>
      </AdminRequireAuth>
     } />

     <Route path="/admin/orders" element={
  <AdminRequireAuth>
    <ShowOrders />
  </AdminRequireAuth>
} />

     <Route path="/admin/orders/:id" element={
  <AdminRequireAuth>
    <OrderDetails />
  </AdminRequireAuth>
} />
 <Route path="/admin/returns" element={
  <AdminRequireAuth>
    <ShowReturns />
  </AdminRequireAuth>
} />
  
  
<Route
  path="/admin/users"
  element={
    <AdminRequireAuth>
      <Users />
    </AdminRequireAuth>
  }
/>

<Route
  path="/admin/password"
  element={
    <AdminRequireAuth>
      <Password />
    </AdminRequireAuth>
  }
/>



<Route
  path="/admin/shipping"
  element={
    <AdminRequireAuth>
      <Shipping />
    </AdminRequireAuth>
  }
/>

<Route
  path="/admin/discount"
  element={
    <AdminRequireAuth>
      <Discount />
    </AdminRequireAuth>
  }
/>


    </Routes>
    
    </BrowserRouter>
     <ToastContainer />
     
    </>
  )
}

export default App
