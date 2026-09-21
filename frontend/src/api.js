const API_BASE_URL =
  import.meta.env.VITE_API_URL || '/api';

async function request(
  path,
  options = {}
) {
  const response =
    await fetch(
      `${API_BASE_URL}${path}`,
      {
        credentials: 'include',

        headers: {
          'Content-Type':
            'application/json',
          ...(options.headers || {}),
        },

        ...options,
      }
    );

  const payload =
    await response
      .json()
      .catch(() => ({}));

  if (!response.ok) {
    const error =
      new Error(
        payload.message ||
          'Something went wrong'
      );

    error.status =
      response.status;

    error.payload =
      payload;

    throw error;
  }

  return payload;
}

export function getProducts(
  params = {}
) {
  const searchParams =
    new URLSearchParams();

  Object.entries(params).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ''
      ) {
        searchParams.set(
          key,
          value
        );
      }
    }
  );

  const query =
    searchParams.toString();

  return request(
    `/products${
      query
        ? `?${query}`
        : ''
    }`
  );
}

export function getProduct(
  slug
) {
  return request(
    `/products/${encodeURIComponent(
      slug
    )}`
  );
}

export function getCategories() {
  return request(
    '/products/categories'
  );
}

export function getFeaturedProducts() {
  return getProducts({
    limit: 8,
    sort: 'featured',
  });
}

export function registerUser(
  data
) {
  return request(
    '/auth/register',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

export function loginUser(
  data
) {
  return request(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

export function logoutUser() {
  return request(
    '/auth/logout',
    {
      method: 'POST',
    }
  );
}

export function getCurrentUser() {
  return request(
    '/auth/me'
  );
}

export function updateProfile(
  data
) {
  return request(
    '/auth/me',
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    }
  );
}

export function getAddresses() {
  return request(
    '/addresses'
  );
}

export function createAddress(
  data
) {
  return request(
    '/addresses',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

export function updateAddress(
  id,
  data
) {
  return request(
    `/addresses/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    }
  );
}

export function deleteAddress(
  id
) {
  return request(
    `/addresses/${id}`,
    {
      method: 'DELETE',
    }
  );
}

export function setDefaultAddress(
  id
) {
  return request(
    `/addresses/${id}/default`,
    {
      method: 'POST',
    }
  );
}

export function getCart() {
  return request('/cart');
}

export function addCartItem(
  productId,
  quantity
) {
  return request(
    '/cart/items',
    {
      method: 'POST',
      body: JSON.stringify({
        productId,
        quantity,
      }),
    }
  );
}

export function updateCartItem(
  productId,
  quantity
) {
  return request(
    `/cart/items/${productId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        quantity,
      }),
    }
  );
}

export function removeCartItem(
  productId
) {
  return request(
    `/cart/items/${productId}`,
    {
      method: 'DELETE',
    }
  );
}

export function clearServerCart() {
  return request(
    '/cart',
    {
      method: 'DELETE',
    }
  );
}
