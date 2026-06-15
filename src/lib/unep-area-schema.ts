import { z } from "zod";
import { UNEP_SEARCH_AREA_IDS } from "@/modules/scraping/unep-areas";

export const unepSearchAreaSchema = z.enum(UNEP_SEARCH_AREA_IDS);
