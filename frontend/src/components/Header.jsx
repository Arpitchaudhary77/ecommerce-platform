import { useState } from 'react';
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

import { useCart } from '../context/CartContext';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const { itemCount } = useCart();

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [search, setSearch] =
    useState('');

  const currentCategory =
    new URLSearchParams(location.search)
      .get('category');

  const isProductsPage =
    location.pathname === '/products';

  const isShopActive =
    isProductsPage &&
    !currentCategory &&
    !new URLSearchParams(location.search)
      .get('search');

  function isCategoryActive(slug) {
    return (
      isProductsPage &&
      currentCategory === slug
    );
  }

  function submitSearch(event) {
    event.preventDefault();

    const value = search.trim();

    if (!value) {
      navigate('/products');
    } else {
      navigate(
        `/products?search=${encodeURIComponent(value)}`
      );
    }

    setSearch('');
    setMobileOpen(false);
  }

  function closeMobileMenu() {
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
          onClick={closeMobileMenu}
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
          onSubmit={submitSearch}
        >
          <Search size={19} />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search products, brands and more"
            aria-label="Search products"
          />
        </form>

        <div className="header-actions">
          <button
            className="icon-button"
            onClick={() => navigate('/')}
            aria-label="Account"
          >
            <UserRound size={21} />

            <span className="desktop-only">
              Account
            </span>
          </button>

          <Link
            className="icon-button bag-button"
            to="/cart"
            onClick={closeMobileMenu}
            aria-label="Shopping bag"
          >
            <ShoppingBag size={21} />

            <span className="desktop-only">
              Bag
            </span>

            {itemCount > 0 && (
              <span className="cart-count">
                {itemCount}
              </span>
            )}
          </Link>

          <button
            className="icon-button mobile-menu-button"
            onClick={() =>
              setMobileOpen(
                (value) => !value
              )
            }
            aria-label="Toggle navigation"
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
              location.pathname === '/'
                ? 'active'
                : ''
            }`}
            onClick={
              closeMobileMenu
            }
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
            onClick={
              closeMobileMenu
            }
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
            onClick={
              closeMobileMenu
            }
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
            onClick={
              closeMobileMenu
            }
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
            onClick={
              closeMobileMenu
            }
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
            onClick={
              closeMobileMenu
            }
          >
            Fitness
          </Link>
        </div>
      </nav>

      <div className="mobile-search container">
        <form
          className="search-bar"
          onSubmit={submitSearch}
        >
          <Search size={19} />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search products..."
            aria-label="Search products"
          />
        </form>
      </div>
    </header>
  );
}
