import slugify from "slugify";

const SLUG_SUFFIX_PATTERN = /^(.*?)-(\d+)$/;

export function normalizeSlug(value: string) {
  return slugify(value, {
    lower: true,
    strict: true,
    trim: true,
  });
}

function getSlugBase(value: string) {
  const normalized = normalizeSlug(value);
  return normalized || "plant";
}

export function buildSlugCandidate(base: string, suffix: number) {
  if (suffix <= 1) {
    return base;
  }

  return `${base}-${suffix}`;
}

type SlugQueryResult = {
  data: Array<{ slug: string }> | null;
  error: { message: string } | null;
};

type SlugQuery = Promise<SlugQueryResult> & {
  neq: (column: string, value: string) => SlugQuery;
};

type SlugClient = {
  from: (table: string) => {
    select: (columns: string) => {
      ilike: (column: string, pattern: string) => {
        is: (column: string, value: null) => SlugQuery;
      };
    };
  };
};

export async function ensureUniqueSlug(supabaseClient: unknown, value: string, existingPlantId?: string) {
  const supabase = supabaseClient as SlugClient;
  const base = getSlugBase(value);

  let query = supabase
    .from("plants")
    .select("slug")
    .ilike("slug", `${base}%`)
    .is("deleted_at", null);

  if (existingPlantId) {
    query = query.neq("id", existingPlantId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return pickFirstFreeSlug(base, (data ?? []).map((row: { slug: string }) => row.slug));
}

export function pickFirstFreeSlug(base: string, existingSlugs: string[]) {
  const taken = new Set(existingSlugs.map((slug) => slug.toLowerCase()));
  if (!taken.has(base)) {
    return base;
  }

  let maxSuffix = 1;

  for (const existing of taken) {
    if (existing === base) {
      continue;
    }

    const match = existing.match(SLUG_SUFFIX_PATTERN);
    if (!match) {
      continue;
    }

    if (match[1] === base) {
      const suffix = Number.parseInt(match[2], 10);
      if (suffix > maxSuffix) {
        maxSuffix = suffix;
      }
    }
  }

  return buildSlugCandidate(base, maxSuffix + 1);
}
