import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, provider, database } from "../firebase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faLock, faUser } from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { ref, set } from "firebase/database";

const Signup = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Save username in Firebase
      await set(ref(database, "users/" + user.uid), {
        username: username,
        email: email,
      });

      navigate("/todo");
    } catch (error) {
      setError("Failed to sign up. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Check if username exists
      const userRef = ref(database, `users/${user.uid}/username`);
      userRef.once("value", (snapshot) => {
        if (!snapshot.exists()) {
          // Username not set, prompt for username
          setLoading(false);
          const username = prompt("Please enter your username:");
          if (username) {
            set(ref(database, `users/${user.uid}`), {
              username: username,
              email: user.email,
            });
            navigate("/todo");
          }
        } else {
          navigate("/todo");
        }
      });
    } catch (error) {
      setError("Failed to sign in with Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900  ">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 shadow-lg rounded-lg">
        <h2 className="text-2xl font-bold text-center text-white">Sign Up</h2>
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="relative">
            <FontAwesomeIcon
              icon={faUser}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-12 py-3 mt-1 rounded-md bg-gray-700 text-white focus:outline-none"
              placeholder="Username"
              required
              aria-label="Username"
            />
          </div>
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
              className="w-full px-12 py-3 mt-1 rounded-md bg-gray-700 text-white focus:outline-none"
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
              className="w-full px-12 py-3 mt-1 rounded-md bg-gray-700 text-white focus:outline-none"
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
            aria-label="Sign Up"
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>
        <div className="text-center">
          <button
            onClick={handleGoogleSignIn}
            className={`w-full px-4 py-2 mt-4 font-bold text-white bg-red-700 rounded-md hover:bg-red-600 flex items-center justify-center ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={loading}
            aria-label="Sign up with Google"
          >
            <FontAwesomeIcon icon={faGoogle} className="mr-2" />
            {loading ? "Signing in..." : "Sign up with Google"}
          </button>
        </div>
        <p className="text-sm text-center text-gray-400">
          Already have an account?{" "}
          <a href="/" className="text-[#38bdf8]">
            Login
          </a>
        </p>
      </div>
    </div>
  );
};

export default Signup;
