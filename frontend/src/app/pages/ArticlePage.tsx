import { Link } from "react-router-dom";
import { ArrowLeft, MapPin, Droplets } from "lucide-react";
import { Article } from "../types";
import TagBadge from "../components/TagBadge";

export default function ArticlePage({
  article,
  onBack,
  onArticle,
  allArticles,
}: {
  article: Article;
  onBack: () => void;
  onArticle: (a: Article) => void;
  allArticles: Article[];
}) {
  const related = allArticles.filter((a) => a.id !== article.id && a.tag === article.tag).slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero image */}
      <div className="relative w-full bg-muted" style={{ height: "420px" }}>
        <img
          src={article.imageUrl}
          alt={article.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <TagBadge tag={article.tag} accent />
            <span className="font-mono text-xs text-white/70 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {article.state}
            </span>
          </div>
          <h1
            className="text-3xl md:text-5xl font-black text-white leading-tight max-w-3xl"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            {article.title}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Back */}
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 font-mono text-xs tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-8"
          aria-label="Volver al inicio"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          VOLVER AL INICIO
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main */}
          <article className="lg:col-span-2">
            {/* Byline */}
            <div className="flex flex-wrap gap-6 pb-6 mb-6 border-b-2 border-foreground">
              <div>
                <p className="font-mono text-xs text-muted-foreground tracking-widest">
                  PERIODISTA
                </p>
                <p className="font-mono text-sm font-700">{article.author}</p>
              </div>
              <div>
                <p className="font-mono text-xs text-muted-foreground tracking-widest">
                  PUBLICADO
                </p>
                <p className="font-mono text-sm">{article.date}</p>
              </div>
              <div>
                <p className="font-mono text-xs text-muted-foreground tracking-widest">
                  CATEGORÍA
                </p>
                <p className="font-mono text-sm">{article.tag}</p>
              </div>
            </div>

            {/* Summary */}
            <p
              className="text-lg font-semibold leading-relaxed border-l-4 border-accent pl-5 mb-8 text-foreground"
              style={{ fontFamily: "'Lora', serif" }}
            >
              {article.summary}
            </p>

            {/* Body */}
            <div
              className="prose-content space-y-5"
              style={{ fontFamily: "'Lora', serif" }}
            >
              {article.body.split("\n\n").map((para, i) => (
                <p key={i} className="text-sm leading-loose text-foreground/90">
                  {para}
                </p>
              ))}
            </div>

            {/* Disclaimer */}
            <div className="mt-10 p-5 bg-secondary border border-border">
              <p className="font-mono text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground">NOTA EDITORIAL:</strong> LABANDERA
                solicitó postura oficial a las dependencias mencionadas antes de la
                publicación. Las respuestas recibidas, en su caso, se incorporan al
                texto. Este trabajo periodístico no busca sustituir investigaciones de
                las autoridades competentes.
              </p>
            </div>
          </article>

          {/* Sidebar */}
          <aside>
            <div className="sticky top-28">
              {/* About */}
              <div className="bg-foreground text-background p-6 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Droplets className="w-4 h-4 text-accent" />
                  <span
                    className="text-lg font-black"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  >
                    LA<span className="text-accent">BANDERA</span>
                  </span>
                </div>
                <p className="font-mono text-xs text-muted-foreground leading-relaxed">
                  Periodismo político de investigación. Filtramos el agua sucia de la política mexicana desde 2024.
                </p>
              </div>

              {/* Related */}
              {related.length > 0 && (
                <div>
                  <p className="font-mono text-xs tracking-widest text-muted-foreground mb-4 border-b border-border pb-2">
                    NOTAS RELACIONADAS
                  </p>
                  <div className="space-y-4">
                    {related.map((r) => (


<Link
  key={r.id}
  to={`/article/${r.id}`}
  onClick={() => onArticle(r)}
  className="cursor-pointer group flex gap-3"
>
  <div className="w-20 h-16 bg-muted shrink-0 overflow-hidden">
    <img
      src={r.imageUrl}
      alt={r.title}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      loading="lazy"
    />
  </div>
  <div>
    <p className="text-xs font-black leading-snug group-hover:text-accent transition-colors" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
      {r.title}
    </p>
    <p className="font-mono text-xs text-muted-foreground mt-1">
      {r.date}
    </p>
  </div>
</Link>
                    ))}


                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
