import { useNavigate } from "react-router-dom";
import EstadisticasPage from "../pages/EstadisticasPage";

export default function AdminGuard() {
  const navigate = useNavigate();
  const raw = localStorage.getItem('user');

  if (raw) {
    try {
      const user = JSON.parse(raw);
      const roles = user.roles || [];
      if (!roles.includes("Administrador")) {
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

  return <EstadisticasPage />;
}
