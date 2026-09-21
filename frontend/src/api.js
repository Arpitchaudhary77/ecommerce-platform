const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || 'Something went wrong');
  }

  return payload;
}

export function getProducts(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();

  return request(`/products${query ? `?${query}` : ''}`);
}

export function getProduct(slug) {
  return request(`/products/${encodeURIComponent(slug)}`);
}

export function getCategories() {
  return request('/products/categories');
}

export function getFeaturedProducts() {
  return getProducts({
    limit: 8,
    sort: 'featured',
  });
}
