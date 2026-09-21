import {
  Heart,
  ShoppingBag,
  Star,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useCart } from '../context/CartContext';

function formatPrice(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export default function ProductCard({ product }) {
  const { addToCart } = useCart();

  const [added, setAdded] = useState(false);
  const [liked, setLiked] = useState(false);

  const image = product.images?.[0];

  function handleAddToCart() {
    addToCart(product, 1);

    setAdded(true);

    window.setTimeout(() => {
      setAdded(false);
    }, 1200);
  }

  const discount = product.compareAtPrice
    ? Math.round(
        ((Number(product.compareAtPrice) -
          Number(product.price)) /
          Number(product.compareAtPrice)) *
          100
      )
    : null;

  return (
    <article className="product-card">
      <Link
        to={`/products/${product.slug}`}
        className="product-image-wrap"
      >
        {image ? (
          <img
            src={image}
            alt={product.name}
            className="product-image"
            loading="lazy"
          />
        ) : (
          <div className="image-fallback">
            NOVA
          </div>
        )}

        {discount && (
          <span className="discount-badge">
            {discount}% OFF
          </span>
        )}
      </Link>

      <button
        className={`wishlist-button ${
          liked ? 'liked' : ''
        }`}
        onClick={() =>
          setLiked((value) => !value)
        }
        aria-label="Wishlist"
      >
        <Heart
          size={18}
          fill={liked ? 'currentColor' : 'none'}
        />
      </button>

      <div className="product-content">
        <div className="product-brand">
          {product.brand}
        </div>

        <Link
          className="product-name"
          to={`/products/${product.slug}`}
        >
          {product.name}
        </Link>

        <div className="product-rating-row">
          <span className="rating">
            <Star
              size={14}
              fill="currentColor"
            />

            {Number(product.rating).toFixed(1)}
          </span>

          <span className="review-count">
            {product.reviewCount} reviews
          </span>
        </div>

        <div className="product-price-row">
          <span className="product-price">
            {formatPrice(product.price)}
          </span>

          {product.compareAtPrice && (
            <span className="compare-price">
              {formatPrice(
                product.compareAtPrice
              )}
            </span>
          )}
        </div>

        <button
          className={`add-button ${
            added ? 'added' : ''
          }`}
          disabled={!product.stockQuantity}
          onClick={handleAddToCart}
        >
          <ShoppingBag size={17} />

          {added
            ? 'Added to bag'
            : product.stockQuantity
              ? 'Add to bag'
              : 'Out of stock'}
        </button>
      </div>
    </article>
  );
}
