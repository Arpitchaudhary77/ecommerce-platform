import {
  Menu,
  Search,
  ShoppingBag,
  UserRound,
  X,
} from 'lucide-react';

import {
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import { useState } from 'react';

import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Header() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const {
    user,
  } = useAuth();

  const {
    itemCount,
  } = useCart();

  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

  const [
    search,
    setSearch,
  ] = useState('');

  const query =
    new URLSearchParams(
      location.search
    );

  const currentCategory =
    query.get(
      'category'
    );

  const isProductsPage =
    location.pathname ===
    '/products';

  const isShopActive =
    isProductsPage &&
    !currentCategory &&
    !query.get(
      'search'
    );

  function isCategoryActive(
    slug
  ) {
    return (
      isProductsPage &&
      currentCategory ===
        slug
    );
  }

  function submitSearch(
    event
  ) {
    event.preventDefault();

    const value =
      search.trim();

    navigate(
      value
        ? `/products?search=${encodeURIComponent(
            value
          )}`
        : '/products'
    );

    setSearch('');
    setMobileOpen(false);
  }

  return (
    <header className="site-header">
      <div className="announcement">
        Free shipping on orders over ₹999
      </div>

      <div className="header-main container">
        <Link
          to="/"
          className="brand"
          onClick={() =>
            setMobileOpen(false)
          }
        >
          <span className="brand-mark">
            N
          </span>

          <span className="brand-text">
            NOVA<span>MARKET</span>
          </span>
        </Link>

        <form
          className="search-bar desktop-search"
          onSubmit={
            submitSearch
          }
        >
          <Search size={19} />

          <input
            value={search}
            onChange={(
              event
            ) =>
              setSearch(
                event.target
                  .value
              )
            }
            placeholder="Search products, brands and more"
          />
        </form>

        <div className="header-actions">
          <button
            className="icon-button"
            onClick={() =>
              navigate(
                user
                  ? '/account'
                  : '/login'
              )
            }
            aria-label="Account"
          >
            <UserRound
              size={21}
            />

            <span className="desktop-only">
              {user
                ? user.firstName
                : 'Account'}
            </span>
          </button>

          <Link
            className="icon-button bag-button"
            to="/cart"
            aria-label="Shopping bag"
          >
            <ShoppingBag
              size={21}
            />

            <span className="desktop-only">
              Bag
            </span>

            {itemCount >
              0 && (
              <span className="cart-count">
                {itemCount}
              </span>
            )}
          </Link>

          <button
            className="icon-button mobile-menu-button"
            onClick={() =>
              setMobileOpen(
                (value) =>
                  !value
              )
            }
          >
            {mobileOpen ? (
              <X size={22} />
            ) : (
              <Menu size={22} />
            )}
          </button>
        </div>
      </div>

      <nav
        className={`main-nav ${
          mobileOpen
            ? 'mobile-open'
            : ''
        }`}
      >
        <div className="container nav-inner">
          <Link
            to="/"
            className={`nav-link ${
              location.pathname ===
              '/'
                ? 'active'
                : ''
            }`}
          >
            Home
          </Link>

          <Link
            to="/products"
            className={`nav-link ${
              isShopActive
                ? 'active'
                : ''
            }`}
          >
            Shop
          </Link>

          <Link
            to="/products?category=electronics"
            className={`nav-link ${
              isCategoryActive(
                'electronics'
              )
                ? 'active'
                : ''
            }`}
          >
            Electronics
          </Link>

          <Link
            to="/products?category=fashion"
            className={`nav-link ${
              isCategoryActive(
                'fashion'
              )
                ? 'active'
                : ''
            }`}
          >
            Fashion
          </Link>

          <Link
            to="/products?category=home-living"
            className={`nav-link ${
              isCategoryActive(
                'home-living'
              )
                ? 'active'
                : ''
            }`}
          >
            Home & Living
          </Link>

          <Link
            to="/products?category=fitness"
            className={`nav-link ${
              isCategoryActive(
                'fitness'
              )
                ? 'active'
                : ''
            }`}
          >
            Fitness
          </Link>
        </div>
      </nav>

      <div className="mobile-search container">
        <form
          className="search-bar"
          onSubmit={
            submitSearch
          }
        >
          <Search size={19} />

          <input
            value={search}
            onChange={(
              event
            ) =>
              setSearch(
                event.target
                  .value
              )
            }
            placeholder="Search products..."
          />
        </form>
      </div>
    </header>
  );
}
