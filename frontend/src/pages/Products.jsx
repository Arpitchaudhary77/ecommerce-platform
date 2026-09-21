import {
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
} from 'lucide-react';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useSearchParams,
} from 'react-router-dom';

import {
  getCategories,
  getProducts,
} from '../api';

import ProductCard from '../components/ProductCard';
import LoadingSkeleton from '../components/LoadingSkeleton';

export default function Products() {
  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  const [products, setProducts] =
    useState({
      products: [],
      pagination: {
        total: 0,
        totalPages: 1,
      },
    });

  const [categories, setCategories] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [mobileFilters, setMobileFilters] =
    useState(false);

  const search =
    searchParams.get('search') || '';

  const category =
    searchParams.get('category') || '';

  const sort =
    searchParams.get('sort') || 'featured';

  const minPrice =
    searchParams.get('minPrice') || '';

  const maxPrice =
    searchParams.get('maxPrice') || '';

  const page =
    Number(searchParams.get('page')) || 1;

  useEffect(() => {
    getCategories()
      .then((response) =>
        setCategories(response.data)
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      setError('');

      try {
        const response =
          await getProducts({
            search,
            category,
            sort,
            minPrice,
            maxPrice,
            page,
            limit: 12,
          });

        setProducts(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [
    search,
    category,
    sort,
    minPrice,
    maxPrice,
    page,
  ]);

  const totalResults =
    products.pagination?.total || 0;

  const totalPages =
    products.pagination?.totalPages || 1;

  const selectedCategory = useMemo(
    () =>
      categories.find(
        (item) => item.slug === category
      ),
    [categories, category]
  );

  function updateFilter(
    key,
    value
  ) {
    const params =
      new URLSearchParams(searchParams);

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    params.delete('page');

    setSearchParams(params);
    setMobileFilters(false);
  }

  function clearFilters() {
    const params =
      new URLSearchParams();

    if (search) {
      params.set('search', search);
    }

    setSearchParams(params);
    setMobileFilters(false);
  }

  function goToPage(nextPage) {
    const params =
      new URLSearchParams(searchParams);

    params.set('page', String(nextPage));

    setSearchParams(params);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  return (
    <main className="container catalog-page">
      <div className="catalog-header">
        <div>
          <span className="eyebrow">
            STORE
          </span>

          <h1>
            {selectedCategory
              ? selectedCategory.name
              : search
                ? `Results for "${search}"`
                : 'All products'}
          </h1>

          <p>
            {totalResults
              ? `${totalResults} products`
              : 'Explore our latest collection'}
          </p>
        </div>

        <div className="catalog-actions">
          <button
            className="filter-mobile-button"
            onClick={() =>
              setMobileFilters(true)
            }
          >
            <SlidersHorizontal size={18} />
            Filters
          </button>

          <select
            className="sort-select"
            value={sort}
            onChange={(event) =>
              updateFilter(
                'sort',
                event.target.value
              )
            }
            aria-label="Sort products"
          >
            <option value="featured">
              Featured
            </option>

            <option value="newest">
              Newest
            </option>

            <option value="price_asc">
              Price: Low to high
            </option>

            <option value="price_desc">
              Price: High to low
            </option>

            <option value="rating">
              Highest rated
            </option>

            <option value="name_asc">
              Name: A-Z
            </option>
          </select>
        </div>
      </div>

      <div
        className={`catalog-layout ${
          mobileFilters
            ? 'filters-open'
            : ''
        }`}
      >
        <aside className="filter-panel">
          <div className="mobile-filter-header">
            <strong>Filters</strong>

            <button
              className="icon-button"
              onClick={() =>
                setMobileFilters(false)
              }
              aria-label="Close filters"
            >
              <X size={20} />
            </button>
          </div>

          <div className="filter-section">
            <div className="filter-heading">
              Category
            </div>

            <button
              className={`filter-option ${
                !category
                  ? 'selected'
                  : ''
              }`}
              onClick={() =>
                updateFilter(
                  'category',
                  ''
                )
              }
            >
              <span>All products</span>
              <span>{totalResults}</span>
            </button>

            {categories.map((item) => (
              <button
                key={item.id}
                className={`filter-option ${
                  category === item.slug
                    ? 'selected'
                    : ''
                }`}
                onClick={() =>
                  updateFilter(
                    'category',
                    item.slug
                  )
                }
              >
                <span>{item.name}</span>
                <span>
                  {item.productCount}
                </span>
              </button>
            ))}
          </div>

          <div className="filter-section">
            <div className="filter-heading">
              Price range
            </div>

            <div className="price-inputs">
              <input
                type="number"
                min="0"
                placeholder="Min"
                value={minPrice}
                onChange={(event) =>
                  updateFilter(
                    'minPrice',
                    event.target.value
                  )
                }
              />

              <span>—</span>

              <input
                type="number"
                min="0"
                placeholder="Max"
                value={maxPrice}
                onChange={(event) =>
                  updateFilter(
                    'maxPrice',
                    event.target.value
                  )
                }
              />
            </div>
          </div>

          {(category ||
            minPrice ||
            maxPrice) && (
            <button
              className="clear-filters-button"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          )}
        </aside>

        <section className="catalog-results">
          {loading && (
            <LoadingSkeleton />
          )}

          {error && (
            <div className="state-card error-state">
              <h3>
                Unable to load products
              </h3>

              <p>{error}</p>
            </div>
          )}

          {!loading &&
            !error &&
            products.products.length ===
              0 && (
              <div className="state-card">
                <h3>
                  No products found
                </h3>

                <p>
                  Try changing your search
                  or filters.
                </p>

                <button
                  className="primary-button compact"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              </div>
            )}

          {!loading &&
            !error &&
            products.products.length >
              0 && (
              <>
                <div className="product-grid">
                  {products.products.map(
                    (product) => (
                      <ProductCard
                        key={product.id}
                        product={
                          product
                        }
                      />
                    )
                  )}
                </div>

                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      className="pagination-button"
                      disabled={
                        page <= 1
                      }
                      onClick={() =>
                        goToPage(
                          page - 1
                        )
                      }
                    >
                      <ChevronLeft
                        size={17}
                      />
                    </button>

                    {Array.from(
                      {
                        length:
                          totalPages,
                      },
                      (_, index) =>
                        index + 1
                    )
                      .slice(
                        Math.max(
                          0,
                          page - 3
                        ),
                        Math.min(
                          totalPages,
                          page + 2
                        )
                      )
                      .map(
                        (
                          pageNumber
                        ) => (
                          <button
                            key={
                              pageNumber
                            }
                            className={`pagination-number ${
                              pageNumber ===
                              page
                                ? 'current'
                                : ''
                            }`}
                            onClick={() =>
                              goToPage(
                                pageNumber
                              )
                            }
                          >
                            {pageNumber}
                          </button>
                        )
                      )}

                    <button
                      className="pagination-button"
                      disabled={
                        page >=
                        totalPages
                      }
                      onClick={() =>
                        goToPage(
                          page + 1
                        )
                      }
                    >
                      <ChevronRight
                        size={17}
                      />
                    </button>
                  </div>
                )}
              </>
            )}
        </section>
      </div>
    </main>
  );
}
