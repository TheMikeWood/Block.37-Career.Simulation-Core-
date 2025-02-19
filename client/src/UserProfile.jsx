import { useState, useEffect } from "react";

function UserProfile({ auth }) {
  const [reviews, setReviews] = useState([]);
  const [unreviewedItems, setUnreviewedItems] = useState([]);

  useEffect(() => {
    fetch("/api/me/reviews", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then(setReviews)
      .catch(console.error);

    fetch("/api/me/unreviewed-items", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then(setUnreviewedItems)
      .catch(console.error);
  }, []);

  return (
    <div>
      <h2>My Profile</h2>
      <h3>My Reviews</h3>
      <ul>
        {reviews.map((review) => (
          <li key={review.id}>
            {review.text} - {review.rating} Stars
          </li>
        ))}
      </ul>

      <h3>Items I Haven’t Reviewed Yet</h3>
      <ul>
        {unreviewedItems.map((item) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default UserProfile;
