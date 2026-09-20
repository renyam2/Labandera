import { Link } from "react-router-dom";
import { MapPin, ChevronRight } from "lucide-react";
import { Article } from "../types";
import TagBadge from "./TagBadge";

export default function ArticleCard({
  article,
  isHighlighted,
  onPointerEnter,
  onPointerLeave,
  onArticle
}: {
  article: Article;
  isHighlighted: boolean;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
  onArticle: (a: Article) => void;
}) {

  return (
<Link
      to={`/article/${article.id}`}
      onClick={() => onArticle(article)}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}

      className={`bg-card p-6 cursor-pointer group flex flex-col gap-4 transition-all duration-300 ${
        isHighlighted
          ? "bg-secondary border-2 border-accent shadow-xl scale-[1.02] z-10"
          : "hover:bg-secondary"
      }`}
      aria-label={`Ver nota: ${article.title}`}
    >
      <div className="overflow-hidden bg-muted aspect-video">
        <img
          src={article.imageUrl}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      </div>
      <div className="flex items-center gap-2">
        <TagBadge tag={article.tag} />
        <span className="font-mono text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {article.state}
        </span>
      </div>
      <h3
        className="font-black text-xl leading-tight group-hover:text-accent transition-colors"
        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
      >
        {article.title}
      </h3>
      <p
        className="text-xs text-muted-foreground leading-relaxed line-clamp-3"
        style={{ fontFamily: "'Lora', serif" }}
      >
        {article.summary}
      </p>
      <div className="mt-auto flex items-center justify-between pt-3 border-t border-border">
        <span className="font-mono text-xs text-muted-foreground">{article.date}</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
      </div>
</Link>
  );
}
