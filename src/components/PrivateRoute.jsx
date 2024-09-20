import { Navigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";

const PrivateRoute = ({ children }) => {
  const [user, loading, error] = useAuthState(auth);

  if (loading) {
    return <p>Loading...</p>; // يمكنك تغيير هذا النص ليتماشى مع تصميم الموقع
  }

  if (error) {
    return <p>Error: {error.message}</p>; // يمكنك أيضًا تحسين عرض الأخطاء هنا
  }

  return user ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
