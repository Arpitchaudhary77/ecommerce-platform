CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    first_name VARCHAR(80) NOT NULL,
    last_name VARCHAR(80),

    email VARCHAR(255) NOT NULL UNIQUE,

    password_hash TEXT NOT NULL,

    phone VARCHAR(30),

    role VARCHAR(20) NOT NULL DEFAULT 'customer'
        CHECK (role IN ('customer', 'admin')),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email
    ON users(email);

CREATE INDEX IF NOT EXISTS idx_users_role
    ON users(role);

CREATE TABLE IF NOT EXISTS addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    label VARCHAR(50) NOT NULL DEFAULT 'Home',

    first_name VARCHAR(80) NOT NULL,
    last_name VARCHAR(80),

    phone VARCHAR(30) NOT NULL,

    address_line_1 VARCHAR(200) NOT NULL,
    address_line_2 VARCHAR(200),

    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,

    country VARCHAR(100) NOT NULL DEFAULT 'India',

    is_default BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_addresses_user
    ON addresses(user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_default_address_per_user
    ON addresses(user_id)
    WHERE is_default = TRUE;

CREATE TABLE IF NOT EXISTS carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL UNIQUE
        REFERENCES users(id)
        ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    cart_id UUID NOT NULL
        REFERENCES carts(id)
        ON DELETE CASCADE,

    product_id UUID NOT NULL
        REFERENCES products(id)
        ON DELETE RESTRICT,

    quantity INTEGER NOT NULL
        CHECK (quantity > 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(cart_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart
    ON cart_items(cart_id);

CREATE INDEX IF NOT EXISTS idx_cart_items_product
    ON cart_items(product_id);

CREATE OR REPLACE FUNCTION create_user_cart()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO carts (user_id)
    VALUES (NEW.id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_create_user_cart
ON users;

CREATE TRIGGER trg_create_user_cart
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_user_cart();
