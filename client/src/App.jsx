import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState, useEffect } from "react";
import ItemsList from "./ItemsList";
import ItemDetails from "./ItemDetails";
import UserProfile from "./UserProfile";
import Login from "./Login";

function App() {
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) attemptLoginWithToken();
  }, []);

  const attemptLoginWithToken = async () => {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      setAuth(await response.json());
    } else {
      localStorage.removeItem("token");
    }
  };

  const login = async (credentials) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    if (response.ok) {
      localStorage.setItem("token", (await response.json()).token);
      attemptLoginWithToken();
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setAuth(null);
  };

  return (
    <Router>
      <nav>
        <a href="/">Home</a> |{" "}
        {auth ? <a href="/me">My Profile</a> : <a href="/login">Login</a>}
        {auth && <button onClick={logout}>Logout {auth.username}</button>}
      </nav>
      <Routes>
        <Route path="/" element={<ItemsList />} />
        <Route path="/items/:id" element={<ItemDetails auth={auth} />} />
        <Route
          path="/me"
          element={
            auth ? <UserProfile auth={auth} /> : <Navigate to="/login" />
          }
        />
        <Route path="/login" element={<Login login={login} />} />
      </Routes>
    </Router>
  );
}

export default App;
