import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Todo from "./pages/Todo";
import PrivateRoute from "./components/PrivateRoute";

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/todo"
          element={
            <PrivateRoute>
              <Todo />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Signup />} /> {/* Default route */}
      </Routes>
    </Router>
  );
};

export default AppRouter;
