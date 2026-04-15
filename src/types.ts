export interface Rating {
  title: string;
  originalTitle: string;
  rating: number;
  ratedAt: string;
}

export interface ScraperOptions {
  userId: string;
  output: string;
}
