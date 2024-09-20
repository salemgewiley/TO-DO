import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, provider } from "../firebase";
import { getDatabase, ref, get } from "firebase/database"; // Import get and ref from database
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faLock } from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const navigate = useNavigate();
  const database = getDatabase();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Fetch username from the database
      const snapshot = await get(ref(database, "users/" + user.uid));
      if (snapshot.exists()) {
        const userData = snapshot.val();
        setUsername(userData.username); // Store username in state
      }

      navigate("/todo");
    } catch (error) {
      setError("Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, provider);
      navigate("/todo");
    } catch (error) {
      setError("Failed to sign in with Google.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    const email = prompt("Please enter your email for password reset:");
    if (email) {
      try {
        await sendPasswordResetEmail(auth, email);
        alert("Password reset email sent! Check your inbox.");
      } catch (error) {
        setError(
          "Failed to send password reset email. Please check your email."
        );
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 shadow-lg rounded-lg">
        <h2 className="text-3xl font-bold text-center text-white">Login</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <FontAwesomeIcon
              icon={faEnvelope}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-12 py-3 mt-1 rounded-md bg-gray-700 text-white focus:outline-none placeholder-gray-400"
              placeholder="Email"
              required
              aria-label="Email"
            />
          </div>
          <div className="relative">
            <FontAwesomeIcon
              icon={faLock}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-12 py-3 mt-1 rounded-md bg-gray-700 text-white focus:outline-none placeholder-gray-400"
              placeholder="Password"
              required
              aria-label="Password"
            />
          </div>
          {error && (
            <p className="text-red-500 text-sm" aria-live="assertive">
              {error}
            </p>
          )}
          <button
            type="submit"
            className={`w-full px-4 py-2 font-bold text-white bg-[#32a0d8] rounded-md hover:bg-[#38bdf8] ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={loading}
            aria-label="Login"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <div className="text-center">
          <button
            onClick={handleGoogleSignIn}
            className={`w-full px-4 py-2 mt-4 font-bold text-white bg-red-700 rounded-md hover:bg-red-600 flex items-center justify-center ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={loading}
            aria-label="Sign in with Google"
          >
            <FontAwesomeIcon icon={faGoogle} className="mr-2" />
            {loading ? "Signing in..." : "Sign in with Google"}
          </button>
        </div>
        <p className="text-sm text-center text-gray-400">
          Don't have an account?{" "}
          <a href="/signup" className="text-[#38bdf8]">
            Sign up
          </a>
        </p>
        <p className="text-sm text-center text-gray-400">
          <button
            onClick={handlePasswordReset}
            className="text-[#38bdf8] underline"
          >
            Forgot Password?
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
