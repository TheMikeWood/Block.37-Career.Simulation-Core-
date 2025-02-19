import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

function ItemDetails({ auth }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: "", text: "" });

  useEffect(() => {
    fetch(`/api/items/${id}`)
      .then((res) => res.json())
      .then(setItem)
      .catch(console.error);

    fetch(`/api/items/${id}/reviews`)
      .then((res) => res.json())
      .then(setReviews)
      .catch(console.error);
  }, [id]);

  const submitReview = async (e) => {
    e.preventDefault();
    if (!auth) return navigate("/login");

    const response = await fetch(`/api/items/${id}/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(newReview),
    });

    if (response.ok) {
      setReviews([...reviews, await response.json()]);
      setNewReview({ rating: "", text: "" });
    }
  };

  return item ? (
    <div>
      <h2>{item.name}</h2>
      <h3>Reviews</h3>
      <ul>
        {reviews.map((review) => (
          <li key={review.id}>
            {review.rating} Stars - {review.text} (by {review.username})
          </li>
        ))}
      </ul>

      {auth && (
        <form onSubmit={submitReview}>
          <input
            type="number"
            min="1"
            max="5"
            placeholder="Rating"
            required
            value={newReview.rating}
            onChange={(e) =>
              setNewReview({ ...newReview, rating: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Your review"
            required
            value={newReview.text}
            onChange={(e) =>
              setNewReview({ ...newReview, text: e.target.value })
            }
          />
          <button type="submit">Submit Review</button>
        </form>
      )}
    </div>
  ) : (
    <p>Loading...</p>
  );
}

export default ItemDetails;
