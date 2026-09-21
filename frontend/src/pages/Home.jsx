import {
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
} from 'lucide-react';

import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

import {
  getCategories,
  getFeaturedProducts,
} from '../api';

import ProductCard from '../components/ProductCard';
import LoadingSkeleton from '../components/LoadingSkeleton';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadHome() {
      try {
        const [
          productsResponse,
          categoriesResponse,
        ] = await Promise.all([
          getFeaturedProducts(),
          getCategories(),
        ]);

        setProducts(
          productsResponse.data.products
        );

        setCategories(categoriesResponse.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadHome();
  }, []);

  return (
    <main>
      <section className="hero container">
        <div className="hero-copy">
          <span className="eyebrow">
            CURATED FOR EVERYDAY
          </span>

          <h1>
            Better products.
            <br />
            <em>Better living.</em>
          </h1>

          <p>
            Discover thoughtfully selected essentials
            across technology, fashion, home and fitness —
            all in one place.
          </p>

          <div className="hero-actions">
            <Link
              className="primary-button"
              to="/products"
            >
              Shop collection
              <ArrowRight size={18} />
            </Link>

            <Link
              className="secondary-button"
              to="/products?sort=newest"
            >
              New arrivals
            </Link>
          </div>

          <div className="hero-note">
            <span className="live-dot" />
            New drops every week
          </div>
        </div>

        <div className="hero-visual">
          <img
            src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1400&q=90"
            alt="Premium smartwatch"
          />

          <div className="hero-floating-card">
            <span>Featured</span>
            <strong>
              Nova Smartwatch Pro
            </strong>
            <small>From ₹8,999</small>
          </div>
        </div>
      </section>

      <section className="trust-strip">
        <div className="container trust-grid">
          <div className="trust-item">
            <Truck size={22} />

            <div>
              <strong>Fast delivery</strong>
              <span>
                Reliable shipping across India
              </span>
            </div>
          </div>

          <div className="trust-item">
            <ShieldCheck size={22} />

            <div>
              <strong>Secure checkout</strong>
              <span>
                Protected payments and data
              </span>
            </div>
          </div>

          <div className="trust-item">
            <RotateCcw size={22} />

            <div>
              <strong>Easy returns</strong>
              <span>
                Simple return experience
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              SHOP BY CATEGORY
            </span>

            <h2>
              Find your next favorite
            </h2>
          </div>

          <Link
            to="/products"
            className="text-link"
          >
            View all
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="category-grid">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/products?category=${category.slug}`}
              className="category-card"
            >
              <img
                src={category.imageUrl}
                alt={category.name}
                loading="lazy"
              />

              <div className="category-overlay" />

              <div className="category-content">
                <span>
                  {category.productCount} products
                </span>

                <h3>{category.name}</h3>

                <ArrowRight size={19} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section section-muted">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                EDITOR'S PICKS
              </span>

              <h2>
                Designed to stand out
              </h2>
            </div>

            <Link
              to="/products"
              className="text-link"
            >
              Browse everything
              <ArrowRight size={16} />
            </Link>
          </div>

          {loading && <LoadingSkeleton />}

          {error && (
            <div className="state-card error-state">
              <h3>
                We couldn't load the collection
              </h3>

              <p>{error}</p>
            </div>
          )}

          {!loading && !error && (
            <div className="product-grid">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="container promo-section">
        <div className="promo-copy">
          <span className="eyebrow">
            NOVA STANDARD
          </span>

          <h2>
            Good design should make everyday life easier.
          </h2>

          <p>
            We focus on useful details, dependable quality
            and products worth keeping around.
          </p>
        </div>

        <Link
          to="/products"
          className="primary-button"
        >
          Explore NOVA
          <ArrowRight size={18} />
        </Link>
      </section>
    </main>
  );
}
