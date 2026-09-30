import { useNavigate } from "react-router-dom";
import SecurityPage from "../pages/SecurityPage";

export default function SecurityGuard() {
  const navigate = useNavigate();

  const raw = localStorage.getItem('token');
  if (!raw) {
    navigate("/login");
    return null;
  }

  return <SecurityPage />;
}
