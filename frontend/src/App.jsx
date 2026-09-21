import {
  Link,
  Route,
  Routes,
} from 'react-router-dom';

import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Register from './pages/Register';
import Account from './pages/Account';

function NotFound() {
  return (
    <main className="container state-page">
      <div className="state-card">
        <span className="eyebrow">
          404
        </span>

        <h1>
          Page not found
        </h1>

        <p>
          The page you're looking for
          doesn't exist.
        </p>

        <Link
          to="/products"
          className="primary-button compact"
        >
          Back to shop
        </Link>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <>
      <Header />

      <Routes>
        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/products"
          element={<Products />}
        />

        <Route
          path="/products/:slug"
          element={
            <ProductDetails />
          }
        />

        <Route
          path="/cart"
          element={<Cart />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route element={<ProtectedRoute />}>
          <Route
            path="/account"
            element={<Account />}
          />
        </Route>

        <Route
          path="*"
          element={<NotFound />}
        />
      </Routes>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <Link
              className="brand footer-brand"
              to="/"
            >
              <span className="brand-mark">
                N
              </span>

              <span className="brand-text">
                NOVA<span>MARKET</span>
              </span>
            </Link>

            <p>
              Thoughtfully selected products
              for everyday life.
            </p>
          </div>

          <div>
            <span className="footer-heading">
              Shop
            </span>

            <Link to="/products">
              All products
            </Link>

            <Link to="/products?category=electronics">
              Electronics
            </Link>

            <Link to="/products?category=fashion">
              Fashion
            </Link>
          </div>

          <div>
            <span className="footer-heading">
              Company
            </span>

            <span>About</span>
            <span>Contact</span>
            <span>Returns</span>
          </div>
        </div>

        <div className="container footer-bottom">
          © {new Date().getFullYear()} NOVA MARKET
        </div>
      </footer>
    </>
  );
}
