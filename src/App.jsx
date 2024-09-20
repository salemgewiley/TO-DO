import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase"; // Your firebase config
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Todo from "./pages/Todo";
import PrivateRoute from "./components/PrivateRoute";

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

const AppContent = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, navigate to /todo
        navigate("/todo");
      } else {
        // User is signed out
        // Example logic to decide between /login or /signup
        const currentPath = window.location.pathname;

        if (currentPath === "/signup") {
          navigate("/signup"); // If the user is already on /signup, stay there
        } else {
          navigate("/login"); // Redirect to /login if not signed in and not on /signup
        }
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Private Route */}
        <Route
          path="/todo"
          element={
            <PrivateRoute>
              <Todo />
            </PrivateRoute>
          }
        />
      </Routes>
    </div>
  );
};

export default App;
