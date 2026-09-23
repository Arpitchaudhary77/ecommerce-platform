import {
  ArrowLeft,
  Check,
  ChevronRight,
  CreditCard,
  MapPin,
  Plus,
  ShieldCheck,
  Truck,
} from 'lucide-react';

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
  createAddress,
  createOrder,
  getAddresses,
} from '../api';

import { useCart } from '../context/CartContext';

function formatPrice(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value));
}

const emptyAddress = {
  label: 'Home',
  firstName: '',
  lastName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
  isDefault: false,
};

export default function Checkout() {
  const navigate = useNavigate();

  const {
    items,
    subtotal,
    shipping,
    total,
    loading: cartLoading,
  } = useCart();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] =
    useState('');
  const [addressLoading, setAddressLoading] =
    useState(true);
  const [addressError, setAddressError] =
    useState('');

  const [showAddressForm, setShowAddressForm] =
    useState(false);
  const [addressForm, setAddressForm] =
    useState(emptyAddress);
  const [savingAddress, setSavingAddress] =
    useState(false);

  const [placingOrder, setPlacingOrder] =
    useState(false);
  const [orderError, setOrderError] =
    useState('');
  const [completedOrder, setCompletedOrder] =
    useState(null);

  useEffect(() => {
    let active = true;

    async function loadAddresses() {
      try {
        setAddressLoading(true);
        setAddressError('');

        const response = await getAddresses();

        if (!active) {
          return;
        }

        const nextAddresses =
          response.data || [];

        setAddresses(nextAddresses);

        const defaultAddress =
          nextAddresses.find(
            (address) => address.isDefault
          ) || nextAddresses[0];

        if (defaultAddress) {
          setSelectedAddressId(
            defaultAddress.id
          );
        }
      } catch (error) {
        if (!active) {
          return;
        }

        setAddressError(
          error.message ||
            'Unable to load your addresses.'
        );
      } finally {
        if (active) {
          setAddressLoading(false);
        }
      }
    }

    loadAddresses();

    return () => {
      active = false;
    };
  }, []);

  const selectedAddress = useMemo(
    () =>
      addresses.find(
        (address) =>
          address.id === selectedAddressId
      ) || null,
    [addresses, selectedAddressId]
  );

  function handleAddressChange(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setAddressForm((current) => ({
      ...current,
      [name]:
        type === 'checkbox'
          ? checked
          : value,
    }));
  }

  async function handleCreateAddress(event) {
    event.preventDefault();

    try {
      setSavingAddress(true);
      setAddressError('');

      const response =
        await createAddress(
          addressForm
        );

      const newAddress =
        response.data;

      setAddresses((current) => [
        newAddress,
        ...current.map((address) => ({
          ...address,
          isDefault:
            newAddress.isDefault
              ? false
              : address.isDefault,
        })),
      ]);

      setSelectedAddressId(
        newAddress.id
      );

      setShowAddressForm(false);
      setAddressForm(emptyAddress);
    } catch (error) {
      setAddressError(
        error.message ||
          'Unable to save the address.'
      );
    } finally {
      setSavingAddress(false);
    }
  }

  async function handlePlaceOrder(event) {
    event.preventDefault();

    if (!selectedAddressId) {
      setOrderError(
        'Please select a shipping address.'
      );
      return;
    }

    if (!items.length) {
      setOrderError(
        'Your cart is empty.'
      );
      return;
    }

    try {
      setPlacingOrder(true);
      setOrderError('');

      const response =
        await createOrder({
          addressId:
            selectedAddressId,
          paymentMethod: 'COD',
        });

      const orderData =
        response.data?.order ||
        response.data ||
        {};

      setCompletedOrder(
        orderData
      );
    } catch (error) {
      setOrderError(
        error.message ||
          'Unable to place your order. Please try again.'
      );
    } finally {
      setPlacingOrder(false);
    }
  }

  if (cartLoading) {
    return (
      <main className="container checkout-page">
        <div className="empty-cart">
          <span className="eyebrow">
            CHECKOUT
          </span>

          <h1>
            Restoring your bag
          </h1>

          <p>
            We're loading your saved cart.
          </p>
        </div>
      </main>
    );
  }

  if (completedOrder) {
    const orderNumber =
      completedOrder.orderNumber ||
      completedOrder.order_number ||
      'Your order';

    const orderTotal =
      completedOrder.totalAmount ??
      completedOrder.total_amount ??
      total;

    return (
      <main className="container checkout-page">
        <section className="checkout-success">
          <div className="checkout-success-icon">
            <Check size={34} />
          </div>

          <span className="eyebrow">
            ORDER CONFIRMED
          </span>

          <h1>
            Thank you for your order.
          </h1>

          <p>
            Your COD order has been placed
            successfully.
          </p>

          <div className="checkout-success-card">
            <div>
              <span>Order number</span>
              <strong>
                {orderNumber}
              </strong>
            </div>

            <div>
              <span>Payment</span>
              <strong>
                Cash on Delivery
              </strong>
            </div>

            <div>
              <span>Total</span>
              <strong>
                {formatPrice(orderTotal)}
              </strong>
            </div>
          </div>

          <div className="checkout-success-actions">
            <Link
              to="/account"
              className="primary-button"
            >
              View account
              <ChevronRight size={18} />
            </Link>

            <Link
              to="/products"
              className="secondary-button"
            >
              Continue shopping
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="container checkout-page">
        <div className="empty-cart">
          <span className="eyebrow">
            CHECKOUT
          </span>

          <h1>
            Your bag is empty.
          </h1>

          <p>
            Add something to your bag before
            continuing to checkout.
          </p>

          <Link
            className="primary-button"
            to="/products"
          >
            Continue shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container checkout-page">
      <div className="checkout-breadcrumb">
        <Link to="/cart">
          <ArrowLeft size={16} />
          Back to cart
        </Link>
      </div>

      <header className="checkout-header">
        <div>
          <span className="eyebrow">
            SECURE CHECKOUT
          </span>

          <h1>
            Complete your order
          </h1>

          <p>
            Review your delivery address and
            choose your payment method.
          </p>
        </div>

        <div className="checkout-trust">
          <ShieldCheck size={18} />
          Secure checkout
        </div>
      </header>

      {orderError && (
        <div className="checkout-alert">
          {orderError}
        </div>
      )}

      {addressError && (
        <div className="checkout-alert">
          {addressError}
        </div>
      )}

      <div className="checkout-layout">
        <form
          className="checkout-main"
          onSubmit={handlePlaceOrder}
        >
          <section className="checkout-card">
            <div className="checkout-card-header">
              <div>
                <span className="step-number">
                  01
                </span>

                <div>
                  <h2>
                    Delivery address
                  </h2>

                  <p>
                    Where should we deliver
                    your order?
                  </p>
                </div>
              </div>

              <MapPin size={21} />
            </div>

            {addressLoading ? (
              <div className="checkout-loading">
                Loading your saved addresses...
              </div>
            ) : (
              <>
                {addresses.length > 0 && (
                  <div className="address-list">
                    {addresses.map(
                      (address) => {
                        const selected =
                          address.id ===
                          selectedAddressId;

                        return (
                          <button
                            key={address.id}
                            type="button"
                            className={`address-option ${
                              selected
                                ? 'selected'
                                : ''
                            }`}
                            onClick={() =>
                              setSelectedAddressId(
                                address.id
                              )
                            }
                          >
                            <span className="address-radio">
                              {selected && (
                                <span />
                              )}
                            </span>

                            <span className="address-content">
                              <strong>
                                {
                                  address.label
                                }
                              </strong>

                              <span>
                                {
                                  address.firstName
                                }{' '}
                                {
                                  address.lastName
                                }
                              </span>

                              <span>
                                {
                                  address.addressLine1
                                }
                              </span>

                              {address.addressLine2 && (
                                <span>
                                  {
                                    address.addressLine2
                                  }
                                </span>
                              )}

                              <span>
                                {address.city},{' '}
                                {address.state}{' '}
                                {
                                  address.postalCode
                                }
                              </span>

                              <span>
                                {
                                  address.phone
                                }
                              </span>
                            </span>

                            {address.isDefault && (
                              <span className="address-badge">
                                Default
                              </span>
                            )}
                          </button>
                        );
                      }
                    )}
                  </div>
                )}

                {!showAddressForm && (
                  <button
                    type="button"
                    className="add-address-button"
                    onClick={() =>
                      setShowAddressForm(true)
                    }
                  >
                    <Plus size={18} />
                    Add a new address
                  </button>
                )}

                {showAddressForm && (
                  <div className="address-form">
                    <div className="address-form-title">
                      <h3>
                        Add delivery address
                      </h3>

                      <button
                        type="button"
                        className="text-button"
                        onClick={() =>
                          setShowAddressForm(
                            false
                          )
                        }
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="form-grid">
                      <label>
                        <span>Label</span>
                        <input
                          name="label"
                          value={
                            addressForm.label
                          }
                          onChange={
                            handleAddressChange
                          }
                          required
                        />
                      </label>

                      <label>
                        <span>Phone</span>
                        <input
                          name="phone"
                          value={
                            addressForm.phone
                          }
                          onChange={
                            handleAddressChange
                          }
                          required
                        />
                      </label>

                      <label>
                        <span>First name</span>
                        <input
                          name="firstName"
                          value={
                            addressForm.firstName
                          }
                          onChange={
                            handleAddressChange
                          }
                          required
                        />
                      </label>

                      <label>
                        <span>Last name</span>
                        <input
                          name="lastName"
                          value={
                            addressForm.lastName
                          }
                          onChange={
                            handleAddressChange
                          }
                        />
                      </label>

                      <label className="form-field-wide">
                        <span>
                          Address line 1
                        </span>
                        <input
                          name="addressLine1"
                          value={
                            addressForm.addressLine1
                          }
                          onChange={
                            handleAddressChange
                          }
                          required
                        />
                      </label>

                      <label className="form-field-wide">
                        <span>
                          Address line 2
                        </span>
                        <input
                          name="addressLine2"
                          value={
                            addressForm.addressLine2
                          }
                          onChange={
                            handleAddressChange
                          }
                        />
                      </label>

                      <label>
                        <span>City</span>
                        <input
                          name="city"
                          value={
                            addressForm.city
                          }
                          onChange={
                            handleAddressChange
                          }
                          required
                        />
                      </label>

                      <label>
                        <span>State</span>
                        <input
                          name="state"
                          value={
                            addressForm.state
                          }
                          onChange={
                            handleAddressChange
                          }
                          required
                        />
                      </label>

                      <label>
                        <span>Postal code</span>
                        <input
                          name="postalCode"
                          value={
                            addressForm.postalCode
                          }
                          onChange={
                            handleAddressChange
                          }
                          required
                        />
                      </label>

                      <label>
                        <span>Country</span>
                        <input
                          name="country"
                          value={
                            addressForm.country
                          }
                          onChange={
                            handleAddressChange
                          }
                          required
                        />
                      </label>
                    </div>

                    <label className="checkbox-field">
                      <input
                        type="checkbox"
                        name="isDefault"
                        checked={
                          addressForm.isDefault
                        }
                        onChange={
                          handleAddressChange
                        }
                      />
                      <span>
                        Make this my default
                        address
                      </span>
                    </label>

                    <button
                      type="button"
                      className="primary-button compact"
                      disabled={savingAddress}
                      onClick={(event) =>
                        handleCreateAddress(
                          {
                            preventDefault:
                              () => {},
                          }
                        )
                      }
                    >
                      {savingAddress
                        ? 'Saving...'
                        : 'Save address'}
                    </button>
                  </div>
                )}
              </>
            )}
          </section>

          <section className="checkout-card">
            <div className="checkout-card-header">
              <div>
                <span className="step-number">
                  02
                </span>

                <div>
                  <h2>
                    Payment method
                  </h2>

                  <p>
                    Choose how you'd like to
                    pay.
                  </p>
                </div>
              </div>

              <CreditCard size={21} />
            </div>

            <div className="payment-option selected">
              <span className="address-radio">
                <span />
              </span>

              <span className="payment-content">
                <strong>
                  Cash on Delivery
                </strong>

                <span>
                  Pay when your order arrives.
                </span>
              </span>

              <span className="payment-label">
                COD
              </span>
            </div>
          </section>

          <section className="checkout-card checkout-review-card">
            <div className="checkout-card-header">
              <div>
                <span className="step-number">
                  03
                </span>

                <div>
                  <h2>
                    Review order
                  </h2>

                  <p>
                    Confirm your products and
                    quantities.
                  </p>
                </div>
              </div>

              <Truck size={21} />
            </div>

            <div className="checkout-items">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="checkout-item"
                >
                  <div className="checkout-item-image">
                    <img
                      src={
                        Array.isArray(
                          item.images
                        )
                          ? item.images[0]
                          : item.images
                      }
                      alt={item.name}
                      onError={(event) => {
                        event.currentTarget.style.display =
                          'none';
                      }}
                    />
                  </div>

                  <div className="checkout-item-info">
                    <strong>
                      {item.name}
                    </strong>

                    <span>
                      Qty {item.quantity}
                    </span>
                  </div>

                  <strong>
                    {formatPrice(
                      Number(item.price) *
                        item.quantity
                    )}
                  </strong>
                </div>
              ))}
            </div>
          </section>

          <button
            type="submit"
            className="primary-button checkout-place-order"
            disabled={
              placingOrder ||
              !selectedAddress
            }
          >
            {placingOrder
              ? 'Placing order...'
              : `Place order · ${formatPrice(
                  total
                )}`}
            {!placingOrder && (
              <ChevronRight size={19} />
            )}
          </button>
        </form>

        <aside className="checkout-sidebar">
          <div className="checkout-summary">
            <span className="eyebrow">
              ORDER SUMMARY
            </span>

            <h2>
              Your order
            </h2>

            <div className="checkout-summary-count">
              {items.reduce(
                (sum, item) =>
                  sum + item.quantity,
                0
              )}{' '}
              items
            </div>

            <div className="summary-row">
              <span>Subtotal</span>
              <strong>
                {formatPrice(subtotal)}
              </strong>
            </div>

            <div className="summary-row">
              <span>Shipping</span>
              <strong>
                {shipping === 0
                  ? 'FREE'
                  : formatPrice(shipping)}
              </strong>
            </div>

            {shipping === 0 && (
              <div className="summary-note">
                Free shipping applied.
              </div>
            )}

            <div className="summary-divider" />

            <div className="summary-total">
              <span>Total</span>
              <strong>
                {formatPrice(total)}
              </strong>
            </div>

            <div className="checkout-secure-note">
              <ShieldCheck size={17} />
              Your payment details are
              protected.
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
