import React, { useContext, useEffect, useMemo, useState } from "react";
import Layout from "./common/Layout";
import { Link, useNavigate } from "react-router-dom";
import { CartContext } from "./context/Cart";
import { api, apiUrl } from "./common/http";

const Cart = () => {
  const navigate = useNavigate();

  const { cartData, subTotal, updateCartItem, deleteCartItem } =
    useContext(CartContext);

  const [qty, setQty] = useState({});
  const [loadingCheckout, setLoadingCheckout] = useState(false);

  // ✅ Shipping from DB
  const [shippingCharge, setShippingCharge] = useState(0);
  const [loadingShipping, setLoadingShipping] = useState(true);

  const money = (n) => Math.round(Number(n || 0));

  // ✅ fetch active shipping
  useEffect(() => {
    const fetchShipping = async () => {
      setLoadingShipping(true);
      try {
        const res = await fetch(`${apiUrl}/shipping`, {
          headers: { Accept: "application/json" },
        });

        const text = await res.text();
        let data;

        try {
          data = JSON.parse(text);
        } catch {
          setShippingCharge(0);
          return;
        }

        if (res.ok && data?.status === 200) {
          setShippingCharge(money(data.shipping ?? 0));
        } else {
          setShippingCharge(0);
        }
      } catch {
        setShippingCharge(0);
      } finally {
        setLoadingShipping(false);
      }
    };

    fetchShipping();
  }, []);

  const handleQty = (e, itemId) => {
    const newQty = e.target.value;
    setQty((prev) => ({ ...prev, [itemId]: newQty }));
    updateCartItem(itemId, newQty);
  };

  // ✅ subtotal (already uses final_price in context)
  const subtotalValue = useMemo(() => money(subTotal()), [subTotal, cartData]);

  const grandTotalValue = useMemo(
    () => money(subtotalValue + money(shippingCharge)),
    [subtotalValue, shippingCharge]
  );

  // ✅ interest score + go checkout
  const giveCartScoreAndGoCheckout = async () => {
    if (!cartData || cartData.length === 0) {
      navigate("/checkout");
      return;
    }

    setLoadingCheckout(true);

    try {
      for (const item of cartData) {
        // use product_id not cart id
        await api
          .post(`/products/${item.product_id}/interest`, { action: "cart" })
          .catch(() => {});
      }
    } finally {
      setLoadingCheckout(false);
      navigate("/checkout");
    }
  };

  return (
    <Layout>
      <div className="container pb-5">
        <div className="row">
          <div className="col-md-12">
            <nav aria-label="breadcrumb" className="py-4">
              <ol className="breadcrumb">
                <li className="breadcrumb-item">
                  <Link to="/">Home</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Cart
                </li>
              </ol>
            </nav>
          </div>

          <div className="col-md-12">
            <h2 className="border-bottom pb-3">Cart</h2>

            <table className="table">
              <tbody>
                {cartData.length === 0 && (
                  <tr>
                    <td align="center" valign="middle" colSpan={4} style={{ height: 200 }}>
                      Your Cart is empty
                    </td>
                  </tr>
                )}

                {cartData.map((item) => {
                  const unitPrice = money(item.unit_price ?? item.price);
                  const finalPrice = money(item.final_price ?? item.price);
                  const hasDiscount = finalPrice < unitPrice;

                  const lineTotal = money(finalPrice * Number(item.qty || 1));

                  return (
                    <tr key={item.id}>
                      <td width={100}>
                        <img src={item.image_url} width={90} alt="" />
                      </td>

                      <td width={600}>
                        <h4 className="mb-1">{item.title}</h4>

                        <div className="d-flex align-items-center gap-2 pt-2">
                          {/* ✅ show discount if exists */}
                          {hasDiscount ? (
                            <>
                              <span className="fw-semibold">৳ {finalPrice}</span>
                              <span className="text-muted text-decoration-line-through">
                                ৳ {unitPrice}
                              </span>
                              <span className="badge bg-success">
                                Save ৳ {money(unitPrice - finalPrice)}
                              </span>
                            </>
                          ) : (
                            <span className="fw-semibold">৳ {unitPrice}</span>
                          )}

                          {item.size && (
                            <button className="btn btn-size ms-2">{item.size}</button>
                          )}
                        </div>

                        <div className="small text-muted pt-1">
                          Line total: <b>৳ {lineTotal}</b>
                        </div>
                      </td>

                      <td valign="middle">
                        <input
                          style={{ width: "100px" }}
                          min={1}
                          max={10}
                          type="number"
                          value={qty[item.id] || item.qty}
                          onChange={(e) => handleQty(e, item.id)}
                          className="form-control"
                        />
                      </td>

                      <td valign="middle">
                        <button
                          className="btn btn-link p-0"
                          onClick={() => deleteCartItem(item.id)}
                          type="button"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            fill="currentColor"
                            className="bi bi-trash3"
                            viewBox="0 0 16 16"
                          >
                            <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {cartData.length > 0 && (
          <div className="row justify-content-end">
            <div className="col-md-3">
              <div className="d-flex justify-content-between border-bottom pb-2">
                <div>Subtotal:</div>
                <div>৳ {subtotalValue}</div>
              </div>

              <div className="d-flex justify-content-between border-bottom py-2">
                <div>Shipping:</div>
                <div>{loadingShipping ? "Loading..." : `৳ ${money(shippingCharge)}`}</div>
              </div>

              <div className="d-flex justify-content-between border-bottom py-2">
                <div>
                  <strong>Grand Total:</strong>
                </div>
                <div>{loadingShipping ? "Loading..." : `৳ ${grandTotalValue}`}</div>
              </div>

              <div className="d-flex justify-content-end py-4">
                <button
                  className="btn btn-primary"
                  onClick={giveCartScoreAndGoCheckout}
                  disabled={loadingCheckout || loadingShipping}
                  type="button"
                >
                  {loadingCheckout ? "Processing..." : "Proceed to Checkout"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Cart;
