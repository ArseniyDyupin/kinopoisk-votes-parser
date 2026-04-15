export interface Rating {
  title: string;
  originalTitle: string;
  year: string;
  rating: number;
  ratedAt: string;
  kpRating: string;
  votesCount: string;
  duration: string;
  kpUrl: string;
}

export const ALL_FIELDS: (keyof Rating)[] = [
  "title",
  "originalTitle",
  "year",
  "rating",
  "ratedAt",
  "kpRating",
  "votesCount",
  "duration",
  "kpUrl",
];

export type Format = "json" | "csv" | "xml";
