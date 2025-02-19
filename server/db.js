const pg = require("pg");
const client = new pg.Client();
const uuid = require("uuid");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const secret = process.env.JWT || "shhh";

const createTables = async () => {
  await client.query(`
    DROP TABLE IF EXISTS comments;
    DROP TABLE IF EXISTS reviews;
    DROP TABLE IF EXISTS items;
    DROP TABLE IF EXISTS users;

    CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username VARCHAR(100) NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT now()
    );

    CREATE TABLE items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      avg_rating DECIMAL(3,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT now()
    );

    CREATE TABLE reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      item_id UUID REFERENCES items(id) ON DELETE CASCADE,
      rating INT CHECK (rating BETWEEN 1 AND 5),
      text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT now(),
      CONSTRAINT unique_user_item_review UNIQUE (user_id, item_id)
);

    CREATE TABLE comments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT now()
    );
  `);
};

const createUser = async (username, password) => {
  try {
    const SQL = `INSERT INTO users(username, password) VALUES ($1, $2) RETURNING id, username;`;
    const { rows } = await client.query(SQL, [
      username,
      await bcrypt.hash(password, 5),
    ]);
    return rows[0];
  } catch (err) {
    console.error(err);
  }
};

const createItem = async (name, description) => {
  try {
    const SQL = `
    INSERT INTO items (name, description) VALUES ($1, $2) RETURNING *;
    `;
    const { rows } = await client.query(SQL, [name, description]);
    return rows[0];
  } catch (err) {
    console.error(err);
  }
};

const createReview = async (user_id, item_id, rating, text) => {
  try {
    const SQL = `
      INSERT INTO reviews (user_id, item_id, rating, text) 
      VALUES ($1, $2, $3, $4) 
      RETURNING *;
    `;
    const { rows } = await client.query(SQL, [user_id, item_id, rating, text]);
    return rows[0];
  } catch (err) {
    console.error(err);
  }
};

const createComment = async (user_id, review_id, text) => {
  try {
    const SQL = `
      INSERT INTO comments (user_id, review_id, text) 
      VALUES ($1, $2, $3) 
      RETURNING *;
    `;
    const { rows } = await client.query(SQL, [user_id, review_id, text]);
    return rows[0];
  } catch (err) {
    console.error(err);
  }
};

const fetchUsers = async () => {
  const SQL = `
    SELECT id, username 
    FROM users
  `;
  const response = await client.query(SQL);
  return response.rows;
};

const fetchItems = async () => {
  const SQL = `
    SELECT *
    FROM items
  `;
  const response = await client.query(SQL);
  return response.rows;
};

const fetchReviewsByUser = async (user_id) => {
  const SQL = `
    SELECT *
    FROM reviews
    WHERE user_id = $1
  `;
  const response = await client.query(SQL, [user_id]);
  return response.rows;
};
const fetchReviewsByItem = async (item_id) => {
  const SQL = `
    SELECT reviews.*, users.username 
  FROM reviews 
  JOIN users ON reviews.user_id = users.id
  WHERE reviews.item_id = $1
  `;
  const response = await client.query(SQL, [item_id]);
  return response.rows;
};

const authenticate = async ({ username, password }) => {
  const SQL = `
    SELECT id, password
    FROM users
    WHERE username = $1
  `;
  const response = await client.query(SQL, [username]);
  if (
    !response.rows.length ||
    (await bcrypt.compare(password, response.rows[0].password)) === false
  ) {
    const error = Error("not authorized");
    error.status = 401;
    throw error;
  }
  const token = await jwt.sign({ id: response.rows[0].id }, secret);
  return { token };
};

const findUserByToken = async (token) => {
  try {
    console.log("Received Token:", token);

    const tokenWithoutBearer = token.replace("Bearer ", "").trim(); // Ensure clean token
    const { id } = jwt.verify(tokenWithoutBearer, secret);

    console.log("Decoded ID:", id);

    const { rows } = await client.query("SELECT * FROM users WHERE id = $1", [
      id,
    ]);
    if (!rows.length) throw new Error("User not found");

    return rows[0];
  } catch (err) {
    console.error("Error in findUserByToken:", err.message);
    throw new Error("Not authorized!");
  }
};

const isLoggedIn = async (req, res, next) => {
  try {
    console.log("middleware running");
    req.user = await findUserByToken(req.headers.authorization);
    next();
  } catch (err) {
    next(err);
  }
};

const updateReview = async (user_id, review_id, rating, text) => {
  try {
    const SQL = `
      UPDATE reviews
      SET rating = $3, text = $4, created_at = now()
      WHERE id = $2 AND user_id = $1
      RETURNING *;
    `;
    const { rows } = await client.query(SQL, [
      user_id,
      review_id,
      rating,
      text,
    ]);
    return rows[0];
  } catch (err) {
    console.error(err);
  }
};

const fetchItemById = async (item_id) => {
  try {
    const SQL = `SELECT * FROM items WHERE id = $1`;
    const { rows } = await client.query(SQL, [item_id]);
    return rows[0];
  } catch (err) {
    console.error(err);
  }
};

const fetchReviewById = async (review_id) => {
  try {
    const SQL = `SELECT * FROM reviews WHERE id = $1`;
    const { rows } = await client.query(SQL, [review_id]);
    return rows[0];
  } catch (err) {
    console.error(err);
  }
};

const fetchCommentsByUser = async (user_id) => {
  try {
    const SQL = `SELECT * FROM comments WHERE user_id = $1`;
    const { rows } = await client.query(SQL, [user_id]);
    return rows;
  } catch (err) {
    console.error(err);
  }
};

const updateComment = async (user_id, comment_id, text) => {
  try {
    const SQL = `
      UPDATE comments
      SET text = $3, created_at = now()
      WHERE id = $2 AND user_id = $1
      RETURNING *;
    `;
    const { rows } = await client.query(SQL, [user_id, comment_id, text]);
    return rows[0];
  } catch (err) {
    console.error(err);
  }
};

const deleteComment = async (user_id, comment_id) => {
  try {
    const SQL = `DELETE FROM comments WHERE id = $2 AND user_id = $1`;
    await client.query(SQL, [user_id, comment_id]);
  } catch (err) {
    console.error(err);
  }
};

const deleteReview = async (user_id, review_id) => {
  const SQL = `
    DELETE
    FROM reviews
    WHERE user_id = $1 AND id = $2
  `;
  await client.query(SQL, [user_id, review_id]);
};

module.exports = {
  client,
  createTables,
  createUser,
  createItem,
  createReview,
  createComment,
  fetchUsers,
  fetchItems,
  fetchReviewsByUser,
  fetchReviewsByItem,
  fetchItemById,
  deleteReview,
  isLoggedIn,
  deleteComment,
  updateComment,
  updateReview,
  fetchCommentsByUser,
  fetchReviewById,
  authenticate,
};
