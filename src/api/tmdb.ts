import { env } from "@/utils/env";
import { isEmpty } from "@/utils/helpers";
import { TMDB } from "tmdb-ts";

const token = env.NEXT_PUBLIC_TMDB_ACCESS_TOKEN;

if (isEmpty(token)) {
  console.warn("TMDB_ACCESS_TOKEN is not defined. TMDB requests will fail until configured.");
}

export const tmdb = new TMDB(token ?? "");
