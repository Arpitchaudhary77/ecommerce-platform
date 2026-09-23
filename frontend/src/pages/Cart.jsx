import {
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from 'lucide-react';

import { Link } from 'react-router-dom';

import { useCart } from '../context/CartContext';

function formatPrice(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export default function Cart() {
  const {
    items,
    subtotal,
    shipping,
    total,
    loading,
    updateQuantity,
    removeFromCart,
  } = useCart();

  /*
   * IMPORTANT:
   *
   * During a full browser refresh an authenticated cart
   * needs a moment to be restored from PostgreSQL.
   *
   * Do NOT display the empty-cart state during that
   * window.
   */
  if (loading) {
    return (
      <main className="container cart-page">
        <div className="empty-cart">
          <div className="empty-cart-icon">
            <ShoppingBag size={30} />
          </div>

          <span className="eyebrow">
            YOUR BAG
          </span>

          <h1>
            Restoring your bag
          </h1>

          <p>
            We're loading your saved products.
          </p>
        </div>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="container cart-page">
        <div className="empty-cart">
          <div className="empty-cart-icon">
            <ShoppingBag size={30} />
          </div>

          <span className="eyebrow">
            YOUR BAG
          </span>

          <h1>
            Your bag is waiting
          </h1>

          <p>
            Add something you love and it
            will appear here.
          </p>

          <Link
            className="primary-button"
            to="/products"
          >
            Continue shopping
            <ArrowRight size={18} />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container cart-page">
      <div className="cart-header">
        <div>
          <span className="eyebrow">
            YOUR BAG
          </span>

          <h1>
            Shopping bag
          </h1>
        </div>

        <span className="cart-item-count">
          {items.length} product
          {items.length === 1
            ? ''
            : 's'}
        </span>
      </div>

      <div className="cart-layout">
        <section className="cart-items">
          {items.map(
            (item) => (
              <article
                className="cart-item"
                key={item.productId}
              >
                <Link
                  to={`/products/${item.slug}`}
                  className="cart-item-image"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                  />
                </Link>

                <div className="cart-item-info">
                  <span className="product-brand">
                    {item.brand}
                  </span>

                  <Link
                    to={`/products/${item.slug}`}
                    className="cart-item-name"
                  >
                    {item.name}
                  </Link>

                  <span className="cart-item-price">
                    {formatPrice(
                      item.price
                    )}
                  </span>

                  <div className="cart-item-controls">
                    <div className="quantity-control">
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.quantity -
                              1
                          )
                        }
                        aria-label="Decrease quantity"
                      >
                        <Minus size={15} />
                      </button>

                      <span>
                        {item.quantity}
                      </span>

                      <button
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.quantity +
                              1
                          )
                        }
                        disabled={
                          item.quantity >=
                          item.stockQuantity
                        }
                        aria-label="Increase quantity"
                      >
                        <Plus size={15} />
                      </button>
                    </div>

                    <button
                      className="remove-button"
                      onClick={() =>
                        removeFromCart(
                          item.productId
                        )
                      }
                    >
                      <Trash2 size={16} />
                      Remove
                    </button>
                  </div>
                </div>

                <strong className="cart-line-total">
                  {formatPrice(
                    item.price *
                      item.quantity
                  )}
                </strong>
              </article>
            )
          )}
        </section>

        <aside className="summary-card">
          <div className="summary-heading">
            Order summary
          </div>

          <div className="summary-row">
            <span>
              Subtotal
            </span>

            <strong>
              {formatPrice(
                subtotal
              )}
            </strong>
          </div>

          <div className="summary-row">
            <span>
              Shipping
            </span>

            <strong>
              {shipping === 0
                ? 'FREE'
                : formatPrice(
                    shipping
                  )}
            </strong>
          </div>

          {shipping === 0 && (
            <div className="summary-note">
              You qualify for free
              shipping.
            </div>
          )}

          <div className="summary-divider" />

          <div className="summary-total">
            <span>Total</span>

            <strong>
              {formatPrice(total)}
            </strong>
          </div>

          <Link
            to="/checkout"
            className="primary-button checkout-button"
          >
            Checkout
            <ArrowRight size={18} />
          </Link>
        </aside>
      </div>
    </main>
  );
}
