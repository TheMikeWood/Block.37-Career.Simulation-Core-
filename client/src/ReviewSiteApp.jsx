import { useState, useEffect } from "react";
import axios from "axios";

const ReviewSiteApp = () => {
  const [auth, setAuth] = useState(null);
  const [items, setItems] = useState([]);
  const [reviews, setReviews] = useState({});
  const [newReview, setNewReview] = useState({ rating: "", text: "" });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      attemptLoginWithToken();
    }
  }, []);

  const attemptLoginWithToken = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/auth/me", {
        headers: { authorization: token },
      });
      setAuth(response.data);
    } catch (error) {
      localStorage.removeItem("token");
    }
  };

  const login = async (credentials) => {
    try {
      const response = await axios.post("/api/auth/login", credentials);
      localStorage.setItem("token", response.data.token);
      attemptLoginWithToken();
    } catch (error) {
      console.error(error);
    }
  };

  const fetchItems = async () => {
    const response = await axios.get("/api/items");
    setItems(response.data);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchReviews = async (itemId) => {
    const response = await axios.get(`/api/items/${itemId}/reviews`);
    setReviews((prev) => ({ ...prev, [itemId]: response.data }));
  };

  const submitReview = async (itemId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `/api/items/${itemId}/reviews`,
        newReview,
        { headers: { authorization: token } }
      );
      setReviews((prev) => ({
        ...prev,
        [itemId]: [...(prev[itemId] || []), response.data],
      }));
      setNewReview({ rating: "", text: "" });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      {auth ? (
        <button
          onClick={() => {
            localStorage.removeItem("token");
            setAuth(null);
          }}
        >
          Logout
        </button>
      ) : (
        <button
          onClick={() => login({ username: "test", password: "password" })}
        >
          Login
        </button>
      )}

      <h1>Items</h1>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            {item.name}
            <button onClick={() => fetchReviews(item.id)}>View Reviews</button>
            {reviews[item.id] && (
              <ul>
                {reviews[item.id].map((review) => (
                  <li key={review.id}>
                    {review.text} - {review.rating}/5
                  </li>
                ))}
              </ul>
            )}
            {auth && (
              <div>
                <input
                  type="number"
                  placeholder="Rating"
                  value={newReview.rating}
                  onChange={(e) =>
                    setNewReview({ ...newReview, rating: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Write a review..."
                  value={newReview.text}
                  onChange={(e) =>
                    setNewReview({ ...newReview, text: e.target.value })
                  }
                />
                <button onClick={() => submitReview(item.id)}>Submit</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ReviewSiteApp;
