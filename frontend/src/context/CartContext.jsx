import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const CartContext = createContext(null);

const STORAGE_KEY = 'ecommerce-cart';

function readStoredCart() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readStoredCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function addToCart(product, quantity = 1) {
    const requestedQuantity = Math.max(1, quantity);

    setItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => item.productId === product.id
      );

      if (existingItem) {
        return currentItems.map((item) => {
          if (item.productId !== product.id) {
            return item;
          }

          return {
            ...item,
            quantity: Math.min(
              item.quantity + requestedQuantity,
              product.stockQuantity
            ),
          };
        });
      }

      return [
        ...currentItems,
        {
          productId: product.id,
          slug: product.slug,
          name: product.name,
          brand: product.brand,
          price: Number(product.price),
          image: product.images?.[0] || '',
          stockQuantity: product.stockQuantity,
          quantity: Math.min(
            requestedQuantity,
            product.stockQuantity
          ),
        },
      ];
    });
  }

  function updateQuantity(productId, quantity) {
    setItems((currentItems) =>
      currentItems
        .map((item) => {
          if (item.productId !== productId) {
            return item;
          }

          return {
            ...item,
            quantity: Math.max(
              0,
              Math.min(quantity, item.stockQuantity)
            ),
          };
        })
        .filter((item) => item.quantity > 0)
    );
  }

  function removeFromCart(productId) {
    setItems((currentItems) =>
      currentItems.filter(
        (item) => item.productId !== productId
      )
    );
  }

  function clearCart() {
    setItems([]);
  }

  const totals = useMemo(() => {
    const subtotal = items.reduce(
      (sum, item) =>
        sum + item.price * item.quantity,
      0
    );

    const itemCount = items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    const shipping =
      items.length === 0
        ? 0
        : subtotal >= 999
          ? 0
          : 99;

    return {
      subtotal,
      itemCount,
      shipping,
      total: subtotal + shipping,
    };
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        ...totals,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      'useCart must be used inside CartProvider'
    );
  }

  return context;
}
