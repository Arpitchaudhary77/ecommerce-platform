import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  addCartItem,
  clearServerCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from '../api';

import { useAuth } from './AuthContext';

const CartContext =
  createContext(null);

const STORAGE_KEY =
  'ecommerce-guest-cart-v2';

/*
 * Shared hydration promises.

 * React StrictMode can execute effects more than once
 * during development. Both executions for the same user
 * share the same promise instead of starting two cart
 * merges.
 */
const hydrationPromises =
  new Map();

/* ----------------------------------------------------------
   GUEST CART HELPERS
---------------------------------------------------------- */

function readGuestCart() {
  try {
    const stored =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (!stored) {
      return [];
    }

    const parsed =
      JSON.parse(stored);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    return [];
  }
}

function saveGuestCart(
  items
) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(items)
  );
}

function removeGuestItem(
  productId
) {
  const remaining =
    readGuestCart().filter(
      (item) =>
        item.productId !==
        productId
    );

  saveGuestCart(
    remaining
  );

  return remaining;
}

function clearGuestCart() {
  localStorage.removeItem(
    STORAGE_KEY
  );
}

/* ----------------------------------------------------------
   SERVER CART MAPPING
---------------------------------------------------------- */

function mapServerItems(
  items
) {
  return items.map(
    (item) => ({
      productId:
        item.productId,

      slug:
        item.slug,

      name:
        item.name,

      brand:
        item.brand,

      price:
        Number(item.price),

      image:
        item.images?.[0] || '',

      stockQuantity:
        item.stockQuantity,

      quantity:
        item.quantity,
    })
  );
}

/* ----------------------------------------------------------
   TOTALS
---------------------------------------------------------- */

function calculateTotals(
  items
) {
  const subtotal =
    items.reduce(
      (sum, item) =>
        sum +
        Number(item.price) *
          item.quantity,
      0
    );

  const itemCount =
    items.reduce(
      (sum, item) =>
        sum + item.quantity,
      0
    );

  const shipping =
    subtotal === 0
      ? 0
      : subtotal >= 999
        ? 0
        : 99;

  return {
    subtotal,
    itemCount,
    shipping,
    total:
      subtotal + shipping,
  };
}

/* ----------------------------------------------------------
   AUTHENTICATED CART HYDRATION
---------------------------------------------------------- */

function hydrateAuthenticatedCart(
  userId
) {
  const existingPromise =
    hydrationPromises.get(
      userId
    );

  if (existingPromise) {
    return existingPromise;
  }

  const promise =
    (async () => {
      /*
       * Read the latest guest cart directly from storage.
       *
       * We do not depend on React state here because
       * authentication may happen while the cart provider
       * is mounting.
       */
      const guestItems =
        readGuestCart();

      /*
       * Merge guest items into the server cart.
       *
       * Successfully merged guest items are removed from
       * localStorage immediately. This means that if the
       * operation has to be retried, already-merged items
       * cannot be merged twice.
       */
      for (
        const item of guestItems
      ) {
        await addCartItem(
          item.productId,
          item.quantity
        );

        removeGuestItem(
          item.productId
        );
      }

      /*
       * The server cart is authoritative.
       */
      const response =
        await getCart();

      return mapServerItems(
        response.data.items
      );
    })();

  hydrationPromises.set(
    userId,
    promise
  );

  /*
   * Remove the promise after completion.
   *
   * A future login of the same user must be able
   * to perform a fresh hydration.
   */
  promise.then(
    () => {
      if (
        hydrationPromises.get(
          userId
        ) === promise
      ) {
        hydrationPromises.delete(
          userId
        );
      }
    },
    () => {
      if (
        hydrationPromises.get(
          userId
        ) === promise
      ) {
        hydrationPromises.delete(
          userId
        );
      }
    }
  );

  return promise;
}

/* ----------------------------------------------------------
   CART PROVIDER
---------------------------------------------------------- */

export function CartProvider({
  children,
}) {
  const {
    user,
    loading: authLoading,
  } = useAuth();

  const initialGuestCart =
    readGuestCart();

  /*
   * Visible cart.

   * Guest user:
   *   localStorage cart

   * Authenticated user:
   *   PostgreSQL cart
   */
  const [
    items,
    setItems,
  ] = useState(
    initialGuestCart
  );

  /*
   * Guest cart state only.
   */
  const [
    guestItems,
    setGuestItems,
  ] = useState(
    initialGuestCart
  );

  const [
    syncing,
    setSyncing,
  ] = useState(false);

  /*
   * Persist ONLY guest cart data.
   *
   * This effect deliberately never writes `items`.
   *
   * Therefore an authenticated server cart can never
   * accidentally become a guest cart during logout.
   */
  useEffect(() => {
    if (
      authLoading ||
      user
    ) {
      return;
    }

    saveGuestCart(
      guestItems
    );
  }, [
    guestItems,
    authLoading,
    user,
  ]);

  /* --------------------------------------------------------
     AUTH STATE → CART STATE
  -------------------------------------------------------- */

  useEffect(() => {
    if (authLoading) {
      return;
    }

    /*
     * ------------------------------------------------------
     * GUEST USER
     * ------------------------------------------------------
     */
    if (!user) {
      const latestGuestCart =
        readGuestCart();

      setGuestItems(
        latestGuestCart
      );

      setItems(
        latestGuestCart
      );

      setSyncing(false);

      return;
    }

    /*
     * ------------------------------------------------------
     * AUTHENTICATED USER
     * ------------------------------------------------------
     */

    let cancelled = false;

    setSyncing(true);

    hydrateAuthenticatedCart(
      user.id
    )
      .then(
        (serverItems) => {
          if (cancelled) {
            return;
          }

          setItems(
            serverItems
          );

          /*
           * Guest cart should now be empty because each
           * successfully merged item was removed.
           */
          setGuestItems(
            readGuestCart()
          );
        }
      )
      .catch(
        (error) => {
          console.error(
            'Cart hydration failed:',
            error
          );

          /*
           * If hydration fails, keep the authenticated
           * server cart visible when possible.
           *
           * We intentionally don't destroy guest data.
           */
          if (
            cancelled
          ) {
            return;
          }

          getCart()
            .then(
              (response) => {
                if (
                  !cancelled
                ) {
                  setItems(
                    mapServerItems(
                      response
                        .data
                        .items
                    )
                  );
                }
              }
            )
            .catch(
              (
                serverError
              ) => {
                console.error(
                  'Unable to reload server cart:',
                  serverError
                );
              }
            );
        }
      )
      .finally(() => {
        if (
          !cancelled
        ) {
          setSyncing(false);
        }
      });

    return () => {
      /*
       * This only prevents the current React instance
       * from updating after cleanup.
       *
       * It does NOT cancel the shared network request.
       *
       * That is the important fix for StrictMode.
       */
      cancelled = true;
    };
  }, [
    authLoading,
    user,
  ]);

  /* --------------------------------------------------------
     ADD
  -------------------------------------------------------- */

  async function addToCart(
    product,
    quantity = 1
  ) {
    if (user) {
      const response =
        await addCartItem(
          product.id,
          quantity
        );

      setItems(
        mapServerItems(
          response.data.items
        )
      );

      return;
    }

    setGuestItems(
      (currentItems) => {
        const existing =
          currentItems.find(
            (item) =>
              item.productId ===
              product.id
          );

        let updatedItems;

        if (existing) {
          updatedItems =
            currentItems.map(
              (item) => {
                if (
                  item.productId !==
                  product.id
                ) {
                  return item;
                }

                return {
                  ...item,

                  quantity:
                    Math.min(
                      item.quantity +
                        quantity,
                      product.stockQuantity
                    ),
                };
              }
            );
        } else {
          updatedItems = [
            ...currentItems,

            {
              productId:
                product.id,

              slug:
                product.slug,

              name:
                product.name,

              brand:
                product.brand,

              price:
                Number(
                  product.price
                ),

              image:
                product.images?.[0] ||
                '',

              stockQuantity:
                product.stockQuantity,

              quantity:
                Math.min(
                  quantity,
                  product.stockQuantity
                ),
            },
          ];
        }

        setItems(
          updatedItems
        );

        return updatedItems;
      }
    );
  }

  /* --------------------------------------------------------
     UPDATE QUANTITY
  -------------------------------------------------------- */

  async function updateQuantity(
    productId,
    quantity
  ) {
    if (
      quantity <= 0
    ) {
      await removeFromCart(
        productId
      );

      return;
    }

    if (user) {
      const response =
        await updateCartItem(
          productId,
          quantity
        );

      setItems(
        mapServerItems(
          response.data.items
        )
      );

      return;
    }

    setGuestItems(
      (currentItems) => {
        const updatedItems =
          currentItems
            .map((item) => {
              if (
                item.productId !==
                productId
              ) {
                return item;
              }

              return {
                ...item,

                quantity:
                  Math.min(
                    quantity,
                    item.stockQuantity
                  ),
              };
            })
            .filter(
              (item) =>
                item.quantity >
                0
            );

        setItems(
          updatedItems
        );

        return updatedItems;
      }
    );
  }

  /* --------------------------------------------------------
     REMOVE
  -------------------------------------------------------- */

  async function removeFromCart(
    productId
  ) {
    if (user) {
      const response =
        await removeCartItem(
          productId
        );

      setItems(
        mapServerItems(
          response.data.items
        )
      );

      return;
    }

    setGuestItems(
      (currentItems) => {
        const updatedItems =
          currentItems.filter(
            (item) =>
              item.productId !==
              productId
          );

        setItems(
          updatedItems
        );

        return updatedItems;
      }
    );
  }

  /* --------------------------------------------------------
     CLEAR
  -------------------------------------------------------- */

  async function clearCart() {
    if (user) {
      await clearServerCart();

      setItems([]);

      return;
    }

    setGuestItems([]);

    setItems([]);

    clearGuestCart();
  }

  const totals =
    useMemo(
      () =>
        calculateTotals(
          items
        ),
      [items]
    );

  /*
   * During initial auth resolution or server cart
   * hydration, the cart page should not display
   * "empty" prematurely.
   */
  const loading =
    authLoading ||
    syncing;

  return (
    <CartContext.Provider
      value={{
        items,
        guestItems,
        syncing,
        loading,

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
  const context =
    useContext(
      CartContext
    );

  if (!context) {
    throw new Error(
      'useCart must be used inside CartProvider'
    );
  }

  return context;
}
