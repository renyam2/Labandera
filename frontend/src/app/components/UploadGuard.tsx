import { useNavigate } from "react-router-dom";
import UploadPage from "../pages/UploadPage";

export default function UploadGuard() {
  const navigate = useNavigate();
  const raw = localStorage.getItem('user');

  if (raw) {
    try {
      const user = JSON.parse(raw);
      const roles = user.roles || [];
      if (!roles.includes("Administrador") && !roles.includes("Editor")) {
        navigate("/");
        return null;
      }
    } catch (e) {
      navigate("/");
      return null;
    }
  } else {
    navigate("/login");
    return null;
  }

  return <UploadPage onBack={() => navigate("/")} onPublish={() => navigate("/")} />;
}
