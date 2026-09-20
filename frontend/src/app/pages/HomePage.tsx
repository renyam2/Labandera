import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Search, ChevronRight } from "lucide-react";
import { Article, TAGS } from "../types";
import TagBadge from "../components/TagBadge";
import Footer from "../components/Footer";
import ArticleCard from "../components/ArticleCard";

export default function HomePage({
  onArticle,
  loggedIn,
  articles,
  loadingArticles,
}: {
  onArticle: (a: Article) => void;
  loggedIn: boolean;
  articles: Article[];
  loadingArticles: boolean;
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTag = searchParams.get("tag") || "TODOS";
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedId, setHighlightedId] = useState<number | null>(null);

  const featured = articles.length > 0 ? articles[0] : null;
  const filtered = articles.filter((a) => {
    const matchTag = activeTag === "TODOS" || a.tag === activeTag;
    const matchSearch =
      !searchTerm ||
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.summary.toLowerCase().includes(searchTerm.toLowerCase());
    return matchTag && matchSearch;
  });
  const rest = filtered.filter((a) => !a.featured);

  return (
    <div className="min-h-screen bg-background">
      {/* Tag bar */}
      <div className="border-b border-border bg-card sticky top-14 z-40">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between overflow-x-auto">
          <nav aria-label="Filtrar por categoría">
            <ul className="flex list-none">
              {TAGS.map((t) => (
                <li key={t}>
                  <button
                    onClick={() => navigate(`/?tag=${encodeURIComponent(t)}`)}
                    aria-current={activeTag === t ? "page" : undefined}
                    className={`font-mono text-xs tracking-widest px-4 py-3 border-b-2 whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent ${
                      activeTag === t
                        ? "border-accent text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="ml-4 text-muted-foreground hover:text-foreground transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"
            aria-label="Buscar notas"
            aria-expanded={searchOpen}
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
        {searchOpen && (
          <div className="border-t border-border px-4 py-2 max-w-7xl mx-auto">
            <input
              autoFocus
              type="search"
              placeholder="Buscar notas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent text-sm focus:outline-none py-1"
              style={{ fontFamily: "'Lora', serif" }}
            />
          </div>
        )}
      </div>

      <main id="main-content" className="max-w-7xl mx-auto px-4 py-8">
        {loadingArticles ? (
          <div className="text-center py-20">
            <p className="font-mono text-muted-foreground text-sm">
              Cargando notas...
            </p>
          </div>
        ) : (
          <>
        {/* Featured */}
        {featured !== null && (activeTag === "TODOS" || activeTag === featured.tag) && !searchTerm && (

<Link
            to={`/article/${featured.id}`}
            onClick={() => onArticle(featured)}
            className="grid grid-cols-1 lg:grid-cols-2 border-2 border-foreground mb-8 cursor-pointer group"
          >


            <div className="relative overflow-hidden bg-muted">
              <img
                src={featured.imageUrl}
                alt={featured.title}
                className="w-full h-64 lg:h-full object-cover group-hover:scale-102 transition-transform duration-500"
                loading="lazy"
                style={{ minHeight: "260px" }}
              />
              <div className="absolute inset-0 bg-foreground/10 group-hover:bg-foreground/0 transition-colors" />
            </div>
            <div className="p-8 flex flex-col justify-between bg-card">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <TagBadge tag={featured.tag} accent />
                  <span className="font-mono text-xs text-muted-foreground">
                    NOTA PRINCIPAL
                  </span>
                </div>
                <h2
                  className="text-3xl lg:text-4xl font-black leading-tight mb-4 group-hover:text-accent transition-colors"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  {featured.title}
                </h2>
                <p
                  className="text-sm text-muted-foreground leading-relaxed"
                  style={{ fontFamily: "'Lora', serif" }}
                >
                  {featured.summary}
                </p>
              </div>
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">
                    {featured.author}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {featured.date} · {featured.state}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-accent group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
          {rest.map((article) => (

<ArticleCard
              key={article.id}
              article={article}
              isHighlighted={highlightedId === article.id}
              onPointerEnter={() => setHighlightedId(article.id)}
              onPointerLeave={() => setHighlightedId(null)}
              onArticle={onArticle}
            />

          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="font-mono text-muted-foreground text-sm">
              No se encontraron notas.
            </p>
          </div>
        )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
