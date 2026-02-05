"use server";

import { tmdb } from "@/api/tmdb";
import { ActionResponse, ContentType } from "@/types";
import { isEmpty } from "@/utils/helpers";
import {
  addCandidateToPool,
  buildRecommendationProfile,
  diversifyCandidates,
  normalizeCandidate,
  scoreCandidates,
  RecommendationSeed,
} from "@/utils/recommendations";
import { HybridRecommendation } from "@/types/recommendations";
import { createClient } from "@/utils/supabase/server";

type RecommendationRequest = {
  limit?: number;
  includeReasons?: boolean;
  seedLimit?: number;
  type?: ContentType;
};

export const getHybridRecommendations = async (
  request: RecommendationRequest = {},
): Promise<ActionResponse<HybridRecommendation[]>> => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        message: "User not authenticated",
      };
    }

    const { data: histories, error } = await supabase
      .from("histories")
      .select("media_id,type,adult,release_date,title")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(request.seedLimit ?? 12);

    if (error) {
      console.info("Recommendation history fetch error:", error);
      return {
        success: false,
        message: "Failed to fetch histories",
      };
    }

    if (isEmpty(histories)) {
      return {
        success: true,
        message: "No history yet",
        data: [],
      };
    }

    const seeds: RecommendationSeed[] = [];
    for (const history of histories) {
      const seedType = history.type === "movie" ? "movie" : "tv";
      if (request.type && seedType !== request.type) continue;
      try {
        const details =
          seedType === "movie"
            ? await tmdb.movies.details(history.media_id)
            : await tmdb.tvShows.details(history.media_id);
        seeds.push({
          id: history.media_id,
          type: seedType,
          genre_ids: details.genres?.map((genre) => genre.id) ?? [],
          original_language: details.original_language,
          adult: "adult" in details ? details.adult : false,
        });
      } catch (detailError) {
        console.info("Recommendation seed fetch error:", detailError);
      }
    }

    if (isEmpty(seeds)) {
      return {
        success: true,
        message: "No seeds available",
        data: [],
      };
    }

    const profile = buildRecommendationProfile(seeds);
    const pool = new Map<string, HybridRecommendation>();

    const tmdbRequests = seeds.map(async (seed) => {
      const [recommendations, similar] =
        seed.type === "movie"
          ? await Promise.all([
              tmdb.movies.recommendations(seed.id, { page: 1 }),
              tmdb.movies.similar(seed.id, { page: 1 }),
            ])
          : await Promise.all([
              tmdb.tvShows.recommendations(seed.id, { page: 1 }),
              tmdb.tvShows.similar(seed.id, { page: 1 }),
            ]);

      recommendations.results.forEach((item) => {
        addCandidateToPool(pool, normalizeCandidate(item, seed.type), "tmdb_recommendations");
      });
      similar.results.forEach((item) => {
        addCandidateToPool(pool, normalizeCandidate(item, seed.type), "tmdb_similar");
      });

      const genreIds = seed.genre_ids.slice(0, 3).join(",");
      if (!isEmpty(genreIds)) {
        const discoverResult =
          seed.type === "movie"
            ? await tmdb.discover.movie({ with_genres: genreIds, page: 1 })
            : await tmdb.discover.tvShow({ with_genres: genreIds, page: 1 });
        discoverResult.results.forEach((item) => {
          addCandidateToPool(pool, normalizeCandidate(item, seed.type), "genre_discover");
        });
      }
    });

    await Promise.all(tmdbRequests);

    const [popularMovies, popularTv] = await Promise.all([
      tmdb.movies.popular({ page: 1 }),
      tmdb.tvShows.popular({ page: 1 }),
    ]);

    popularMovies.results.forEach((item) => {
      addCandidateToPool(pool, normalizeCandidate(item, "movie"), "popular");
    });
    popularTv.results.forEach((item) => {
      addCandidateToPool(pool, normalizeCandidate(item, "tv"), "popular");
    });

    const candidates = Array.from(pool.values()).filter((candidate) => {
      if (!profile.allowAdult && candidate.adult) return false;
      return true;
    });

    const ranked = scoreCandidates(candidates, profile)
      .sort((a, b) => b.score - a.score)
      .filter((candidate) => {
        return !seeds.some((seed) => seed.type === candidate.type && seed.id === candidate.id);
      });

    const limit = request.limit ?? 20;
    const diversified = diversifyCandidates(ranked, limit);

    return {
      success: true,
      message: "Recommendations generated",
      data: diversified.map((item) => ({
        ...item,
        reasons: request.includeReasons ? item.reasons : [],
      })),
    };
  } catch (error) {
    console.info("Recommendations error:", error);
    return {
      success: false,
      message: "Failed to generate recommendations",
    };
  }
};
