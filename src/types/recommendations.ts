import { ContentType } from "@/types";
import { RecommendationSource } from "@/utils/recommendations";

export type HybridRecommendation = {
  id: number;
  type: ContentType;
  title: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  vote_average?: number;
  popularity?: number;
  genre_ids: number[];
  original_language?: string;
  adult?: boolean;
  sources: RecommendationSource[];
  sourceScore: number;
  score: number;
  reasons: string[];
};
