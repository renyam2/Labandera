import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { getArticles } from "./services/articles";
import { useCalendarEvent } from "./hooks/useCalendarEvent";
import { useSeasonalUpdate } from "./hooks/useSeasonalUpdate";
import type { Article } from "./types";
import Navbar from "./components/Navbar";
import ArticleLoader from "./components/ArticleLoader";
import UploadGuard from "./components/UploadGuard";
import AdminGuard from "./components/AdminGuard";
import HomePage from "./pages/HomePage";
import ArticlePage from "./pages/ArticlePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AcercaDePage from "./pages/AcercaDePage";
import EquipoPage from "./pages/EquipoPage";
import MetodologiaPage from "./pages/MetodologiaPage";
import PrivacidadPage from "./pages/PrivacidadPage";
import TerminosPage from "./pages/TerminosPage";
import ContactoPage from "./pages/ContactoPage";
import FuentesPage from "./pages/FuentesPage";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('token'));
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getArticles();
        if (!cancelled) {
          setArticles(data);
        }
      } catch (err) {
        console.error('Error al cargar artículos:', err);
      } finally {
        if (!cancelled) {
          setLoadingArticles(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleLogin = () => {
    setLoggedIn(true);
    navigate("/");
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setLoggedIn(false);
    navigate("/");
  };

  const openArticle = (a: Article) => {
    setCurrentArticle(a);
    navigate(`/article/${a.id}`);
  };

  const activeEvent = useCalendarEvent();
  const activeSeason = useSeasonalUpdate();

  const currentBg = activeSeason?.bgClass || activeEvent?.theme.bgClass || "bg-background";
  const currentBanner = activeSeason || activeEvent;

  return (
    <div className={`min-h-screen ${currentBg} transition-colors duration-500`}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-accent focus:text-accent-foreground focus:px-4 focus:py-2 focus:font-mono focus:text-sm focus:tracking-widest focus:rounded"
      >
        Saltar al contenido
      </a>
      {currentBanner && (
        <div className={`w-full py-2 text-center font-mono text-sm tracking-widest ${currentBanner.bannerBg}`}>
          {currentBanner.bannerText}
        </div>
      )}
      <Navbar loggedIn={loggedIn} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<HomePage onArticle={openArticle} loggedIn={loggedIn} articles={articles} loadingArticles={loadingArticles} />} />
        <Route path="/login" element={loggedIn ? <Navigate to="/" /> : <LoginPage onLogin={handleLogin} />} />
        <Route path="/register" element={loggedIn ? <Navigate to="/" /> : <RegisterPage onLogin={handleLogin} />} />
        <Route path="/article/:id" element={
          currentArticle ? (
            <ArticlePage article={currentArticle} onBack={() => navigate("/")} onArticle={openArticle} allArticles={articles} />
          ) : (
            <ArticleLoader setCurrentArticle={setCurrentArticle} />
          )
        } />
        <Route path="/upload" element={<UploadGuard />} />
        <Route path="/estadisticas" element={<AdminGuard />} />
        <Route path="/privacidad" element={<PrivacidadPage />} />
        <Route path="/terminos" element={<TerminosPage />} />
        <Route path="/contacto" element={<ContactoPage />} />
        <Route path="/fuentes" element={<FuentesPage />} />
        <Route path="/acerca" element={<AcercaDePage />} />
        <Route path="/equipo" element={<EquipoPage />} />
        <Route path="/metodologia" element={<MetodologiaPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}
