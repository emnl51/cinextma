import { getHybridRecommendations } from "@/actions/recommendations";
import { NextResponse } from "next/server";

export const GET = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") ?? 20);
    const includeReasons = searchParams.get("includeReasons") === "true";
    const typeParam = searchParams.get("type");
    const type = typeParam === "movie" || typeParam === "tv" ? typeParam : undefined;

    const response = await getHybridRecommendations({
      limit,
      includeReasons,
      type,
    });

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 500 },
    );
  }
};
