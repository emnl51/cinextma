import { ContentType } from "@/types";
import { Movie, Recommendation, TV } from "tmdb-ts/dist/types";
import { SimilarTvShow } from "tmdb-ts/dist/types/tv-shows";

export type RecommendationSource =
  | "tmdb_recommendations"
  | "tmdb_similar"
  | "genre_discover"
  | "popular";

export type RecommendationSeed = {
  id: number;
  type: ContentType;
  genre_ids: number[];
  original_language?: string;
  adult?: boolean;
};

export type RecommendationCandidate = {
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
};

export type RecommendationProfile = {
  genreWeights: Map<number, number>;
  languagePreference?: string;
  allowAdult: boolean;
};

export type RecommendationRanked = RecommendationCandidate & {
  score: number;
  reasons: string[];
};

const sourceWeights: Record<RecommendationSource, number> = {
  tmdb_recommendations: 0.6,
  tmdb_similar: 0.45,
  genre_discover: 0.35,
  popular: 0.2,
};

export const buildRecommendationProfile = (seeds: RecommendationSeed[]): RecommendationProfile => {
  const genreWeights = new Map<number, number>();
  const languageCounts = new Map<string, number>();
  let adultCount = 0;

  seeds.forEach((seed) => {
    seed.genre_ids.forEach((genreId) => {
      genreWeights.set(genreId, (genreWeights.get(genreId) || 0) + 1);
    });
    if (seed.original_language) {
      languageCounts.set(
        seed.original_language,
        (languageCounts.get(seed.original_language) || 0) + 1,
      );
    }
    if (seed.adult) adultCount += 1;
  });

  let languagePreference: string | undefined;
  let maxCount = 0;
  languageCounts.forEach((count, language) => {
    if (count > maxCount) {
      maxCount = count;
      languagePreference = language;
    }
  });

  return {
    genreWeights,
    languagePreference,
    allowAdult: adultCount > 0,
  };
};

export const normalizeCandidate = (
  item: Movie | TV | Recommendation | SimilarTvShow,
  type: ContentType,
): RecommendationCandidate => {
  return {
    id: item.id,
    type,
    title: "title" in item ? item.title : item.name,
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    release_date: "release_date" in item ? item.release_date : item.first_air_date,
    vote_average: item.vote_average,
    popularity: item.popularity,
    genre_ids: item.genre_ids ?? [],
    original_language: item.original_language,
    adult: "adult" in item ? item.adult : false,
    sources: [],
    sourceScore: 0,
  };
};

export const addCandidateToPool = (
  pool: Map<string, RecommendationCandidate>,
  candidate: RecommendationCandidate,
  source: RecommendationSource,
): void => {
  const key = `${candidate.type}-${candidate.id}`;
  const existing = pool.get(key);
  if (existing) {
    if (!existing.sources.includes(source)) {
      existing.sources.push(source);
    }
    existing.sourceScore += sourceWeights[source];
    return;
  }

  candidate.sources.push(source);
  candidate.sourceScore = sourceWeights[source];
  pool.set(key, candidate);
};

export const scoreCandidates = (
  candidates: RecommendationCandidate[],
  profile: RecommendationProfile,
): RecommendationRanked[] => {
  const maxPopularity = Math.max(
    1,
    ...candidates.map((candidate) => candidate.popularity || 0),
  );
  const totalGenreWeight = Array.from(profile.genreWeights.values()).reduce(
    (sum, value) => sum + value,
    0,
  );

  return candidates.map((candidate) => {
    const genreScore = candidate.genre_ids.reduce((sum, genreId) => {
      return sum + (profile.genreWeights.get(genreId) || 0);
    }, 0);
    const normalizedGenreScore = totalGenreWeight > 0 ? genreScore / totalGenreWeight : 0;
    const popularityScore = (candidate.popularity || 0) / maxPopularity;
    const ratingScore = (candidate.vote_average || 0) / 10;
    const languageBoost =
      profile.languagePreference && candidate.original_language === profile.languagePreference
        ? 0.1
        : 0;

    const finalScore =
      candidate.sourceScore * 0.45 +
      normalizedGenreScore * 0.3 +
      popularityScore * 0.15 +
      ratingScore * 0.1 +
      languageBoost;

    const reasons: string[] = [];
    if (candidate.sources.includes("tmdb_recommendations")) {
      reasons.push("TMDB recommendation");
    }
    if (candidate.sources.includes("tmdb_similar")) {
      reasons.push("Similar to your recent watches");
    }
    if (candidate.sources.includes("genre_discover")) {
      reasons.push("Matches your favorite genres");
    }
    if (candidate.sources.includes("popular")) {
      reasons.push("Popular right now");
    }
    if (languageBoost > 0) {
      reasons.push("Preferred language");
    }

    return {
      ...candidate,
      score: Number(finalScore.toFixed(4)),
      reasons,
    };
  });
};

export const diversifyCandidates = (
  candidates: RecommendationRanked[],
  limit: number,
): RecommendationRanked[] => {
  const genreCount = new Map<number, number>();
  const results: RecommendationRanked[] = [];

  for (const candidate of candidates) {
    const topGenre = candidate.genre_ids[0];
    if (topGenre) {
      const count = genreCount.get(topGenre) || 0;
      if (count >= 4) continue;
      genreCount.set(topGenre, count + 1);
    }

    results.push(candidate);
    if (results.length >= limit) break;
  }

  return results;
};
