import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingBag,
  Star,
  Truck,
} from 'lucide-react';

import {
  Link,
  useParams,
} from 'react-router-dom';

import {
  useEffect,
  useState,
} from 'react';

import { getProduct } from '../api';
import { useCart } from '../context/CartContext';

function formatPrice(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export default function ProductDetails() {
  const { slug } = useParams();

  const { addToCart } =
    useCart();

  const [product, setProduct] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [quantity, setQuantity] =
    useState(1);

  const [activeImage, setActiveImage] =
    useState(0);

  const [added, setAdded] =
    useState(false);

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      setError('');

      try {
        const response =
          await getProduct(slug);

        setProduct(
          response.data
        );

        setActiveImage(0);
        setQuantity(1);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [slug]);

  if (loading) {
    return (
      <main className="container detail-page">
        <div className="detail-skeleton">
          <div className="skeleton detail-image-skeleton" />

          <div>
            <div className="skeleton skeleton-line wide" />
            <div className="skeleton skeleton-line wide" />
            <div className="skeleton skeleton-line medium" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="container detail-page">
        <div className="state-card error-state">
          <h2>
            Product unavailable
          </h2>

          <p>
            {error ||
              'Product not found'}
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

  const images =
    product.images || [];

  const activeImageUrl =
    images[activeImage] ||
    images[0];

  const discount =
    product.compareAtPrice
      ? Math.round(
          ((Number(
            product.compareAtPrice
          ) -
            Number(
              product.price
            )) /
            Number(
              product.compareAtPrice
            )) *
            100
        )
      : null;

  function addProduct() {
    addToCart(
      product,
      quantity
    );

    setAdded(true);

    window.setTimeout(() => {
      setAdded(false);
    }, 1400);
  }

  return (
    <main className="container detail-page">
      <Link
        to="/products"
        className="back-link"
      >
        <ArrowLeft size={17} />
        Back to collection
      </Link>

      <div className="detail-layout">
        <div className="detail-gallery">
          <div className="detail-main-image">
            {activeImageUrl ? (
              <img
                src={activeImageUrl}
                alt={product.name}
              />
            ) : (
              <div className="image-fallback">
                NOVA
              </div>
            )}

            {discount && (
              <span className="detail-discount">
                {discount}% OFF
              </span>
            )}
          </div>

          {images.length > 1 && (
            <div className="thumbnail-row">
              {images.map(
                (image, index) => (
                  <button
                    key={image}
                    className={`thumbnail ${
                      activeImage ===
                      index
                        ? 'active'
                        : ''
                    }`}
                    onClick={() =>
                      setActiveImage(
                        index
                      )
                    }
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${
                        index + 1
                      }`}
                    />
                  </button>
                )
              )}
            </div>
          )}
        </div>

        <div className="detail-info">
          <Link
            to={`/products?category=${product.categorySlug}`}
            className="detail-category"
          >
            {product.categoryName}
          </Link>

          <h1>
            {product.name}
          </h1>

          <div className="detail-rating">
            <span className="rating">
              <Star
                size={15}
                fill="currentColor"
              />

              {Number(
                product.rating
              ).toFixed(1)}
            </span>

            <span>
              {product.reviewCount}{' '}
              customer reviews
            </span>
          </div>

          <div className="detail-price">
            <strong>
              {formatPrice(
                product.price
              )}
            </strong>

            {product.compareAtPrice && (
              <del>
                {formatPrice(
                  product.compareAtPrice
                )}
              </del>
            )}
          </div>

          <p className="detail-description">
            {product.description}
          </p>

          <div className="stock-indicator">
            <span
              className={
                product.stockQuantity >
                5
                  ? 'stock-dot in-stock'
                  : 'stock-dot low-stock'
              }
            />

            {product.stockQuantity >
            5
              ? `${product.stockQuantity} available`
              : product.stockQuantity >
                  0
                ? `Only ${product.stockQuantity} left`
                : 'Out of stock'}
          </div>

          <div className="buy-row">
            <div className="quantity-control">
              <button
                onClick={() =>
                  setQuantity(
                    Math.max(
                      1,
                      quantity - 1
                    )
                  )
                }
                aria-label="Decrease quantity"
              >
                <Minus size={16} />
              </button>

              <span>
                {quantity}
              </span>

              <button
                onClick={() =>
                  setQuantity(
                    Math.min(
                      product.stockQuantity,
                      quantity + 1
                    )
                  )
                }
                disabled={
                  quantity >=
                  product.stockQuantity
                }
                aria-label="Increase quantity"
              >
                <Plus size={16} />
              </button>
            </div>

            <button
              className={`primary-button add-detail-button ${
                added ? 'added' : ''
              }`}
              disabled={
                !product.stockQuantity
              }
              onClick={addProduct}
            >
              <ShoppingBag size={19} />

              {added
                ? 'Added to bag'
                : 'Add to bag'}
            </button>
          </div>

          <div className="delivery-card">
            <Truck size={21} />

            <div>
              <strong>
                Free delivery over ₹999
              </strong>

              <span>
                Estimated delivery in 2–5
                business days
              </span>
            </div>
          </div>

          <div className="specifications">
            <div className="spec-heading">
              Product details
            </div>

            {Object.entries(
              product.specifications ||
                {}
            ).map(
              ([key, value]) => (
                <div
                  className="spec-row"
                  key={key}
                >
                  <span>{key}</span>
                  <strong>
                    {value}
                  </strong>
                </div>
              )
            )}
          </div>

          <div className="sku">
            SKU: {product.sku}
          </div>
        </div>
      </div>
    </main>
  );
}
