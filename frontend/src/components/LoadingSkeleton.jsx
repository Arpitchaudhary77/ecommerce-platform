export default function LoadingSkeleton() {
  return (
    <div className="product-grid">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          className="skeleton-card"
          key={index}
        >
          <div className="skeleton skeleton-image" />
          <div className="skeleton skeleton-line wide" />
          <div className="skeleton skeleton-line medium" />
          <div className="skeleton skeleton-line short" />
        </div>
      ))}
    </div>
  );
}
