// ─── Types ───────────────────────────────────────────────────────────────────

export interface Article {
  id: string;
  title: string;
  summary: string;
  body: string;
  author: string;
  date: string;
  tag: string;
  state: string;
  imageUrl: string;
  featured: boolean;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

export const TAGS = ["TODOS", "SALUD", "PATRIMONIO", "LEGISLATIVO", "CORRUPCIÓN", "ELECTORAL", "SEGURIDAD"];
