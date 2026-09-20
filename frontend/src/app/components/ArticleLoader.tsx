import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { getArticleById } from "../services/articles";
import type { Article } from "../types";

export default function ArticleLoader({ setCurrentArticle }: { setCurrentArticle: (article: Article) => void }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      navigate("/");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await getArticleById(id);
        if (!cancelled) {
          const backendArticle = res.data;
          const frontendArticle: Article = {
            id: backendArticle.id,
            title: backendArticle.title,
            summary: backendArticle.summary || '',
            body: backendArticle.content,
            author: backendArticle.author?.name || 'Desconocido',
            date: new Date(backendArticle.createdAt).toLocaleDateString('es-MX', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }).toUpperCase(),
            tag: backendArticle.category?.name || 'SIN CATEGORÍA',
            state: backendArticle.state || '',
            imageUrl: backendArticle.image || '',
            featured: false,
          };
          setCurrentArticle(frontendArticle);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error al cargar artículo:', err);
          setError('No se encontró el artículo solicitado.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [id, navigate, setCurrentArticle]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-6" />
          <p className="font-mono text-sm text-muted-foreground">Cargando artículo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-destructive/10 flex items-center justify-center mx-auto mb-6">
            <X className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-black mb-3" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            ARTÍCULO NO ENCONTRADO
          </h2>
          <p className="font-mono text-sm text-muted-foreground mb-6">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="bg-accent text-accent-foreground px-6 py-3 font-mono text-sm tracking-widest hover:bg-primary transition-colors"
          >
            VOLVER AL INICIO
          </button>
        </div>
      </div>
    );
  }

  return null;
}
