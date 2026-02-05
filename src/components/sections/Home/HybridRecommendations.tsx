"use client";

import RecommendationCard from "@/components/sections/Home/Cards/Recommendation";
import SectionTitle from "@/components/ui/other/SectionTitle";
import Carousel from "@/components/ui/wrapper/Carousel";
import useDiscoverFilters from "@/hooks/useDiscoverFilters";
import { getHybridRecommendations } from "@/actions/recommendations";
import { Skeleton } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";

const HybridRecommendations: React.FC = () => {
  const { content } = useDiscoverFilters();
  const { data, isPending } = useQuery({
    queryKey: ["hybrid-recommendations", content],
    queryFn: () =>
      getHybridRecommendations({
        limit: 20,
        includeReasons: true,
        type: content,
      }),
  });

  const recommendations = data?.data ?? [];
  const isEmpty = !isPending && recommendations.length === 0;
  const emptyMessage =
    data?.success === false
      ? "Sign in to get personalized picks."
      : "Watch a few titles to unlock personalized picks.";

  return (
    <section id="hybrid-recommendations" className="min-h-[250px] md:min-h-[300px]">
      <div className="z-3 flex flex-col gap-2">
        <SectionTitle color={content === "movie" ? "primary" : "warning"}>
          Recommended For You
        </SectionTitle>
        {isPending ? (
          <Skeleton className="h-[250px] rounded-lg md:h-[300px]" />
        ) : isEmpty ? (
          <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed border-divider bg-secondary-background px-6 text-center text-sm text-foreground/70">
            {emptyMessage}
          </div>
        ) : (
          <Carousel>
            {recommendations.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className="embla__slide flex min-h-fit max-w-fit items-center px-1 py-2"
              >
                <RecommendationCard
                  item={item}
                  accentColor={content === "movie" ? "primary" : "warning"}
                />
              </div>
            ))}
          </Carousel>
        )}
      </div>
    </section>
  );
};

export default HybridRecommendations;
