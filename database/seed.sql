INSERT INTO categories (name, slug, description, image_url)
VALUES
(
    'Electronics',
    'electronics',
    'Smart technology, audio, accessories and everyday gadgets.',
    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80'
),
(
    'Fashion',
    'fashion',
    'Modern essentials designed for everyday style.',
    'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=80'
),
(
    'Home & Living',
    'home-living',
    'Thoughtful products for a better home.',
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=80'
),
(
    'Fitness',
    'fitness',
    'Gear to help you move better and train smarter.',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80'
)
ON CONFLICT (slug) DO NOTHING;


INSERT INTO products (
    category_id,
    name,
    slug,
    sku,
    brand,
    description,
    price,
    compare_at_price,
    stock_quantity,
    images,
    specifications,
    rating,
    review_count,
    is_featured
)
SELECT
    c.id,
    v.name,
    v.slug,
    v.sku,
    v.brand,
    v.description,
    v.price,
    v.compare_at_price,
    v.stock_quantity,
    v.images::jsonb,
    v.specifications::jsonb,
    v.rating,
    v.review_count,
    v.is_featured
FROM (
    VALUES

    (
        'electronics',
        'Pulse Wireless Headphones',
        'pulse-wireless-headphones',
        'AUD-PULSE-001',
        'Pulse',
        'Premium over-ear wireless headphones with adaptive noise cancellation, balanced sound and up to 40 hours of battery life.',
        5999.00,
        7499.00,
        42,
        '[
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=85",
            "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1200&q=85"
        ]',
        '{
            "Battery": "40 hours",
            "Connectivity": "Bluetooth 5.3",
            "Noise Cancellation": "Adaptive ANC",
            "Weight": "265 g"
        }',
        4.7,
        328,
        TRUE
    ),

    (
        'electronics',
        'Orbit Mechanical Keyboard',
        'orbit-mechanical-keyboard',
        'KEY-ORBIT-002',
        'Orbit',
        'Compact mechanical keyboard with hot-swappable switches, RGB lighting and a premium aluminum top plate.',
        4299.00,
        5299.00,
        67,
        '[
            "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=85",
            "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=1200&q=85"
        ]',
        '{
            "Layout": "75%",
            "Switches": "Hot-swappable",
            "Connection": "USB-C + Bluetooth",
            "Lighting": "RGB"
        }',
        4.6,
        184,
        TRUE
    ),

    (
        'electronics',
        'Nova Smartwatch Pro',
        'nova-smartwatch-pro',
        'WAT-NOVA-003',
        'Nova',
        'A refined smartwatch with AMOLED display, multi-day battery and advanced activity tracking.',
        8999.00,
        10999.00,
        31,
        '[
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=85",
            "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=1200&q=85"
        ]',
        '{
            "Display": "1.9 inch AMOLED",
            "Battery": "7 days",
            "Water Resistance": "5 ATM",
            "Compatibility": "Android / iOS"
        }',
        4.5,
        241,
        TRUE
    ),

    (
        'electronics',
        'Aero USB-C Hub',
        'aero-usb-c-hub',
        'HUB-AERO-004',
        'Aero',
        'Slim aluminum USB-C hub with HDMI, USB 3.0, SD card and power delivery.',
        2199.00,
        2799.00,
        85,
        '[
            "https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=1200&q=85"
        ]',
        '{
            "Ports": "7-in-1",
            "HDMI": "4K 60Hz",
            "Power Delivery": "100W",
            "Body": "Aluminum"
        }',
        4.4,
        97,
        FALSE
    ),

    (
        'fashion',
        'Essential Overshirt',
        'essential-overshirt',
        'FAS-OVER-005',
        'Northline',
        'Versatile heavyweight overshirt with a relaxed silhouette, brushed fabric and durable metal buttons.',
        2499.00,
        3299.00,
        54,
        '[
            "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=85",
            "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1200&q=85"
        ]',
        '{
            "Material": "Cotton blend",
            "Fit": "Relaxed",
            "Care": "Machine wash",
            "Sizes": "S - XXL"
        }',
        4.6,
        113,
        TRUE
    ),

    (
        'fashion',
        'Everyday Knit Sneakers',
        'everyday-knit-sneakers',
        'FAS-SNK-006',
        'Stride',
        'Lightweight knit sneakers built for everyday commuting, travel and casual wear.',
        3199.00,
        3999.00,
        48,
        '[
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85",
            "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1200&q=85"
        ]',
        '{
            "Upper": "Engineered knit",
            "Sole": "EVA foam",
            "Closure": "Lace-up",
            "Sizes": "6 - 11"
        }',
        4.7,
        209,
        TRUE
    ),

    (
        'fashion',
        'Minimal Leather Backpack',
        'minimal-leather-backpack',
        'FAS-BAG-007',
        'Crest',
        'Clean everyday backpack with a padded laptop sleeve and water-resistant finish.',
        4499.00,
        5799.00,
        27,
        '[
            "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=85",
            "https://images.unsplash.com/photo-1491637639811-60e2756cc1c7?auto=format&fit=crop&w=1200&q=85"
        ]',
        '{
            "Capacity": "18 L",
            "Laptop": "Up to 15.6 inch",
            "Material": "Vegan leather",
            "Water Resistance": "Yes"
        }',
        4.8,
        76,
        TRUE
    ),

    (
        'home-living',
        'Ceramic Table Lamp',
        'ceramic-table-lamp',
        'HOM-LAMP-008',
        'Luma',
        'Warm ambient table lamp with a tactile ceramic body and linen shade.',
        1799.00,
        2299.00,
        36,
        '[
            "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=85",
            "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1200&q=85"
        ]',
        '{
            "Material": "Ceramic + linen",
            "Bulb": "E27",
            "Light": "Warm white",
            "Height": "42 cm"
        }',
        4.5,
        62,
        FALSE
    ),

    (
        'home-living',
        'Stoneware Dinner Set',
        'stoneware-dinner-set',
        'HOM-DIN-009',
        'Hearth',
        'Modern stoneware dinner set designed for everyday meals and weekend hosting.',
        3599.00,
        4499.00,
        19,
        '[
            "https://images.unsplash.com/photo-1603199506016-b9a594b593c0?auto=format&fit=crop&w=1200&q=85",
            "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1200&q=85"
        ]',
        '{
            "Pieces": "16",
            "Material": "Stoneware",
            "Dishwasher": "Yes",
            "Microwave": "Yes"
        }',
        4.6,
        54,
        FALSE
    ),

    (
        'fitness',
        'Apex Training Mat',
        'apex-training-mat',
        'FIT-MAT-010',
        'Apex',
        'High-density exercise mat with a textured surface for strength training, mobility and yoga.',
        1499.00,
        1899.00,
        73,
        '[
            "https://images.unsplash.com/photo-1592432678016-e910b452f9a2?auto=format&fit=crop&w=1200&q=85"
        ]',
        '{
            "Length": "183 cm",
            "Thickness": "8 mm",
            "Material": "NBR foam",
            "Carry Strap": "Included"
        }',
        4.7,
        143,
        TRUE
    ),

    (
        'fitness',
        'Core Adjustable Dumbbells',
        'core-adjustable-dumbbells',
        'FIT-DUM-011',
        'Core',
        'Space-saving adjustable dumbbell set for progressive strength training at home.',
        6999.00,
        8499.00,
        14,
        '[
            "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1200&q=85"
        ]',
        '{
            "Total Weight": "24 kg",
            "Adjustment": "5 kg - 24 kg",
            "Handle": "Ergonomic",
            "Use": "Home training"
        }',
        4.8,
        88,
        TRUE
    ),

    (
        'fitness',
        'Flex Resistance Bands',
        'flex-resistance-bands',
        'FIT-BND-012',
        'Flex',
        'Five resistance levels with comfortable fabric handles for full-body workouts.',
        899.00,
        1199.00,
        120,
        '[
            "https://images.unsplash.com/photo-1598289431512-b97b0917affc?auto=format&fit=crop&w=1200&q=85"
        ]',
        '{
            "Levels": "5",
            "Material": "Latex + fabric",
            "Use": "Full body",
            "Storage": "Carry pouch"
        }',
        4.5,
        171,
        FALSE
    )

) AS v(
    category_slug,
    name,
    slug,
    sku,
    brand,
    description,
    price,
    compare_at_price,
    stock_quantity,
    images,
    specifications,
    rating,
    review_count,
    is_featured
)
JOIN categories c ON c.slug = v.category_slug
ON CONFLICT (slug) DO NOTHING;
