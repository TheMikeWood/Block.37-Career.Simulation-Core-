const express = require("express");
const path = require("path");
const morgan = require("morgan");
require("dotenv").config();

const app = express();
const {
  client,
  createUser,
  findUserByToken,
  isLoggedIn,
  fetchUsers,
  fetchItems,
  fetchReviewsByItem,
  fetchReviewsByUser,
  fetchReviewById,
  createReview,
  createComment,
  updateReview,
  updateComment,
  deleteReview,
  deleteComment,
  fetchCommentsByUser,
  authenticate,
} = require("./db.js");

const PORT = process.env.PORT || 3000;

// Middleware
app.use(morgan("dev"));
app.use(express.json());

// Deployment (Serving Frontend)
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "../client/dist/index.html"))
);
app.use(
  "/assets",
  express.static(path.join(__dirname, "../client/dist/assets"))
);

// AUTH ROUTES
app.post("/api/auth/register", async (req, res, next) => {
  try {
    const user = await createUser(req.body.username, req.body.password);
    res.send(user);
  } catch (ex) {
    next(ex);
  }
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const token = await authenticate(req.body);
    res.send(token);
  } catch (ex) {
    next(ex);
  }
});

app.get("/api/auth/me", isLoggedIn, async (req, res, next) => {
  try {
    res.send(req.user);
  } catch (ex) {
    next(ex);
  }
});

// ITEM ROUTES
app.get("/api/items", async (req, res, next) => {
  try {
    res.send(await fetchItems());
  } catch (ex) {
    next(ex);
  }
});

app.get("/api/items/:itemId", async (req, res, next) => {
  try {
    res.send(await fetchReviewsByItem(req.params.itemId));
  } catch (ex) {
    next(ex);
  }
});

// REVIEW ROUTES
app.get("/api/reviews/me", isLoggedIn, async (req, res, next) => {
  try {
    res.send(await fetchReviewsByUser(req.user.id));
  } catch (ex) {
    next(ex);
  }
});

app.post("/api/items/:itemId/reviews", isLoggedIn, async (req, res, next) => {
  try {
    res.send(
      await createReview(
        req.user.id,
        req.params.itemId,
        req.body.rating,
        req.body.text
      )
    );
  } catch (ex) {
    next(ex);
  }
});

app.delete("/api/reviews/:reviewId", isLoggedIn, async (req, res, next) => {
  try {
    await deleteReview({ user_id: req.user.id, id: req.params.reviewId });
    res.sendStatus(204);
  } catch (ex) {
    next(ex);
  }
});

// COMMENT ROUTES
app.post(
  "/api/reviews/:reviewId/comments",
  isLoggedIn,
  async (req, res, next) => {
    try {
      res.send(
        await createComment(req.user.id, req.params.reviewId, req.body.text)
      );
    } catch (ex) {
      next(ex);
    }
  }
);

app.delete("/api/comments/:commentId", isLoggedIn, async (req, res, next) => {
  try {
    await deleteComment(req.user.id, req.params.commentId);
    res.sendStatus(204);
  } catch (ex) {
    next(ex);
  }
});

// USER ROUTES
app.get("/api/users", async (req, res, next) => {
  try {
    res.send(await fetchUsers());
  } catch (ex) {
    next(ex);
  }
});

// Fetch a specific review
app.get("/api/items/:itemId/reviews/:reviewId", async (req, res, next) => {
  try {
    res.send(await fetchReviewById(req.params.reviewId));
  } catch (ex) {
    next(ex);
  }
});

// Update a review (Requires Authentication)
app.put(
  "/api/users/:userId/reviews/:reviewId",
  isLoggedIn,
  async (req, res, next) => {
    try {
      if (req.user.id !== req.params.userId) {
        return res.status(403).send({ error: "Unauthorized" });
      }
      res.send(
        await updateReview(
          req.user.id,
          req.params.reviewId,
          req.body.rating,
          req.body.text
        )
      );
    } catch (ex) {
      next(ex);
    }
  }
);

// Fetch authenticated user’s comments
app.get("/api/comments/me", isLoggedIn, async (req, res, next) => {
  try {
    res.send(await fetchCommentsByUser(req.user.id));
  } catch (ex) {
    next(ex);
  }
});

// Update a comment (Requires Authentication)
app.put(
  "/api/users/:userId/comments/:commentId",
  isLoggedIn,
  async (req, res, next) => {
    try {
      if (req.user.id !== req.params.userId) {
        return res.status(403).send({ error: "Unauthorized" });
      }
      res.send(
        await updateComment(req.user.id, req.params.commentId, req.body.text)
      );
    } catch (ex) {
      next(ex);
    }
  }
);

// Delete a comment (Requires Authentication)
app.delete(
  "/api/users/:userId/comments/:commentId",
  isLoggedIn,
  async (req, res, next) => {
    try {
      if (req.user.id !== req.params.userId) {
        return res.status(403).send({ error: "Unauthorized" });
      }
      await deleteComment(req.user.id, req.params.commentId);
      res.sendStatus(204);
    } catch (ex) {
      next(ex);
    }
  }
);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).send({ error: err.message });
});

// Initialize Server & DB Connection
const init = async () => {
  try {
    await client.connect();
    app.listen(PORT, () => {
      console.log(`Server alive on port ${PORT}`);
    });
  } catch (err) {
    console.error(err);
  }
};

init();
