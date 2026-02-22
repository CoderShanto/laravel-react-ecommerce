import { createContext, useEffect, useMemo, useState } from "react";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartData, setCartData] = useState(
    JSON.parse(localStorage.getItem("cart")) || []
  );

  // ✅ money helper (avoid 7.99800000004)
  const money = (n) => {
    const x = Number(n || 0);
    return Math.round(x); // show integer taka
  };

  // ✅ calculate final price from DB discount fields
  const calcFinalPrice = (product) => {
    const price = Number(product?.price || 0);
    const type = product?.discount_type;
    const val = Number(product?.discount_value || 0);

    if (!type || !val) return money(price);

    if (type === "percent") {
      const final = price - (price * val) / 100;
      return money(Math.max(0, final));
    }

    // ✅ you used amount in backend model
    if (type === "amount") {
      const final = price - val;
      return money(Math.max(0, final));
    }

    return money(price);
  };

  // ✅ add to cart
  const addToCart = (product, size = null) => {
    let updatedCart = [...cartData];

    const finalPrice = calcFinalPrice(product);
    const unitPrice = money(product?.price);

    const newItem = {
      id: `${product.id}-${Math.floor(Math.random() * 10000000)}`,
      product_id: product.id,
      size: size,
      title: product.title,
      unit_price: unitPrice,          // ✅ original
      final_price: finalPrice,        // ✅ discounted/actual price
      discount_type: product?.discount_type || null,
      discount_value: product?.discount_value || null,
      qty: 1,
      image_url: product.image_url,
    };

    // find existing item (same product + same size)
    const isExist = updatedCart.find(
      (item) =>
        item.product_id === product.id &&
        (size ? item.size === size : item.size === null || item.size === undefined)
    );

    if (isExist) {
      updatedCart = updatedCart.map((item) =>
        item.id === isExist.id ? { ...item, qty: item.qty + 1 } : item
      );
    } else {
      updatedCart.push(newItem);
    }

    setCartData(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const shipping = () => 0;

  // ✅ subtotal uses final_price (discount applied)
  const subTotal = () => {
    let subtotal = 0;
    cartData.forEach((item) => {
      const priceToUse = Number(item.final_price ?? item.price ?? 0); // backward compatible
      subtotal += Number(item.qty || 1) * priceToUse;
    });
    return money(subtotal);
  };

  const grandTotal = () => {
    return money(subTotal() + shipping());
  };

  const updateCartItem = (itemId, newQty) => {
    const qtyNum = Math.max(1, Math.min(10, Number(newQty) || 1));

    const updatedCart = cartData.map((item) =>
      item.id === itemId ? { ...item, qty: qtyNum } : item
    );

    setCartData(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const deleteCartItem = (itemId) => {
    const newCartData = cartData.filter((item) => item.id !== itemId);
    setCartData(newCartData);
    localStorage.setItem("cart", JSON.stringify(newCartData));
  };

  const clearCart = () => {
    setCartData([]);
    localStorage.removeItem("cart");
  };

  const getQty = () => {
    return cartData.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  };

  return (
    <CartContext.Provider
      value={{
        addToCart,
        cartData,
        grandTotal,
        subTotal,
        shipping,
        updateCartItem,
        deleteCartItem,
        getQty,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
