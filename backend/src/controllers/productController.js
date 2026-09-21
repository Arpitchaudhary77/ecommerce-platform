const { query } = require('../db');

function parsePositiveInteger(value, fallback, maximum) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(parsed, maximum);
}

function parseNonNegativeNumber(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

async function getProducts(req, res, next) {
  try {
    const {
      search = '',
      category = '',
      minPrice,
      maxPrice,
      sort = 'featured',
    } = req.query;

    const page = parsePositiveInteger(req.query.page, 1, 100000);
    const limit = parsePositiveInteger(req.query.limit, 12, 48);
    const offset = (page - 1) * limit;

    const values = [];
    const conditions = ['p.is_active = TRUE'];

    if (search.trim()) {
      values.push(`%${search.trim()}%`);
      const index = values.length;

      conditions.push(`(
        p.name ILIKE $${index}
        OR p.brand ILIKE $${index}
        OR p.description ILIKE $${index}
      )`);
    }

    if (category.trim()) {
      values.push(category.trim());
      const index = values.length;
      conditions.push(`c.slug = $${index}`);
    }

    const min = parseNonNegativeNumber(minPrice);
    if (min !== null) {
      values.push(min);
      const index = values.length;
      conditions.push(`p.price >= $${index}`);
    }

    const max = parseNonNegativeNumber(maxPrice);
    if (max !== null) {
      values.push(max);
      const index = values.length;
      conditions.push(`p.price <= $${index}`);
    }

    const whereClause = conditions.join(' AND ');

    const sortMap = {
      featured: 'p.is_featured DESC, p.created_at DESC',
      newest: 'p.created_at DESC',
      price_asc: 'p.price ASC',
      price_desc: 'p.price DESC',
      rating: 'p.rating DESC, p.review_count DESC',
      name_asc: 'p.name ASC',
    };

    const orderBy = sortMap[sort] || sortMap.featured;

    const countResult = await query(
      `
        SELECT COUNT(*)::INTEGER AS total
        FROM products p
        INNER JOIN categories c ON c.id = p.category_id
        WHERE ${whereClause}
      `,
      values
    );

    const total = countResult.rows[0].total;

    values.push(limit);
    values.push(offset);

    const productsResult = await query(
      `
        SELECT
          p.id,
          p.name,
          p.slug,
          p.sku,
          p.brand,
          p.description,
          p.price,
          p.compare_at_price AS "compareAtPrice",
          p.stock_quantity AS "stockQuantity",
          p.images,
          p.specifications,
          p.rating,
          p.review_count AS "reviewCount",
          p.is_featured AS "isFeatured",
          p.created_at AS "createdAt",
          c.id AS "categoryId",
          c.name AS "categoryName",
          c.slug AS "categorySlug"
        FROM products p
        INNER JOIN categories c ON c.id = p.category_id
        WHERE ${whereClause}
        ORDER BY ${orderBy}
        LIMIT $${values.length - 1}
        OFFSET $${values.length}
      `,
      values
    );

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        products: productsResult.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

async function getProductBySlug(req, res, next) {
  try {
    const result = await query(
      `
        SELECT
          p.id,
          p.name,
          p.slug,
          p.sku,
          p.brand,
          p.description,
          p.price,
          p.compare_at_price AS "compareAtPrice",
          p.stock_quantity AS "stockQuantity",
          p.images,
          p.specifications,
          p.rating,
          p.review_count AS "reviewCount",
          p.is_featured AS "isFeatured",
          p.created_at AS "createdAt",
          c.id AS "categoryId",
          c.name AS "categoryName",
          c.slug AS "categorySlug"
        FROM products p
        INNER JOIN categories c ON c.id = p.category_id
        WHERE p.slug = $1
          AND p.is_active = TRUE
        LIMIT 1
      `,
      [req.params.slug]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    return res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

async function getCategories(req, res, next) {
  try {
    const result = await query(
      `
        SELECT
          c.id,
          c.name,
          c.slug,
          c.description,
          c.image_url AS "imageUrl",
          COUNT(p.id)::INTEGER AS "productCount"
        FROM categories c
        LEFT JOIN products p
          ON p.category_id = c.id
          AND p.is_active = TRUE
        GROUP BY c.id
        ORDER BY c.name ASC
      `
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProducts,
  getProductBySlug,
  getCategories,
};
