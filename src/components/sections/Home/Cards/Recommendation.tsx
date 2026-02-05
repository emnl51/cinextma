import Rating from "@/components/ui/other/Rating";
import { HybridRecommendation } from "@/types/recommendations";
import { getImageUrl } from "@/utils/movies";
import { Card, CardBody, CardFooter, CardHeader, Chip, Image, Tooltip } from "@heroui/react";
import Link from "next/link";

interface RecommendationCardProps {
  item: HybridRecommendation;
  accentColor: "primary" | "warning";
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ item, accentColor }) => {
  const releaseYear = item.release_date ? new Date(item.release_date).getFullYear() : null;
  const posterImage = getImageUrl(item.poster_path ?? undefined);
  const firstReason = item.reasons[0];
  const href = item.type === "movie" ? `/movie/${item.id}` : `/tv/${item.id}`;

  return (
    <Card isHoverable shadow="md" className="group h-full bg-secondary-background">
      <Link href={href} className="flex h-full flex-col">
        <CardHeader className="flex items-center justify-center pb-0">
          <div className="relative size-full">
            {item.adult && (
              <Chip
                color="danger"
                size="sm"
                variant="flat"
                className="absolute left-2 top-2 z-20"
              >
                18+
              </Chip>
            )}
            <div className="relative overflow-hidden rounded-large">
              <Image
                alt={item.title}
                className="aspect-2/3 rounded-lg object-cover object-center group-hover:scale-110"
                src={posterImage}
              />
            </div>
          </div>
        </CardHeader>
        <CardBody className="justify-end pb-2">
          <p className="truncate text-sm font-semibold">{item.title}</p>
          <div className="mt-2 flex items-center justify-between text-xs text-foreground/70">
            <span>{releaseYear ?? "N/A"}</span>
            <Rating rate={item.vote_average ?? 0} />
          </div>
        </CardBody>
        <CardFooter className="pt-0">
          {firstReason && (
            <Tooltip
              showArrow
              className="bg-secondary-background text-xs"
              content={
                <div className="flex max-w-[200px] flex-col gap-1">
                  {item.reasons.map((reason) => (
                    <span key={reason}>{reason}</span>
                  ))}
                </div>
              }
            >
              <Chip color={accentColor} size="sm" variant="flat" className="truncate">
                {firstReason}
              </Chip>
            </Tooltip>
          )}
        </CardFooter>
      </Link>
    </Card>
  );
};

export default RecommendationCard;
