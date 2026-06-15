export interface WebsiteAnalysis {
  url: string;
  title: string | null;
  metaDescription: string | null;
  headings: string[];
  textContent: string;
  emails: string[];
  phones: string[];
  wordCount: number;
}

function extractMeta(html: string, name: string): string | null {
  const patterns = [
    new RegExp(
      `<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+property=["']og:${name}["'][^>]+content=["']([^"']+)["']`,
      "i"
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtmlEntities(match[1].trim());
  }
  return null;
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1] ? decodeHtmlEntities(match[1].trim()) : null;
}

function extractHeadings(html: string): string[] {
  const headings: string[] = [];
  const regex = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi;
  let match;
  while ((match = regex.exec(html)) !== null && headings.length < 12) {
    const text = match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (text.length > 2) headings.push(decodeHtmlEntities(text));
  }
  return headings;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&([a-z]+);/gi, " ");
}

function extractEmails(text: string): string[] {
  const matches = text.match(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  );
  return [...new Set(matches ?? [])]
    .filter((e) => !e.endsWith(".png") && !e.endsWith(".jpg"))
    .slice(0, 5);
}

function extractPhones(text: string): string[] {
  const matches = text.match(
    /(?:\+33|0)[1-9](?:[\s.-]*\d{2}){4}/g
  );
  return [...new Set(matches ?? [])].slice(0, 5);
}

export async function analyzeWebsite(
  url: string | null | undefined
): Promise<WebsiteAnalysis | null> {
  if (!url?.trim()) return null;

  const normalized = url.startsWith("http") ? url : `https://${url}`;

  try {
    const response = await fetch(normalized, {
      signal: AbortSignal.timeout(12_000),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; MatoFlow-Prospection/1.0; +https://matoflow.fr)",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "fr-FR,fr;q=0.9",
      },
      redirect: "follow",
      next: { revalidate: 0 },
    });

    if (!response.ok) return null;

    const html = await response.text();
    const textContent = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 6000);

    const combined = `${html} ${textContent}`;

    return {
      url: response.url || normalized,
      title: extractTitle(html),
      metaDescription:
        extractMeta(html, "description") ?? extractMeta(html, "Description"),
      headings: extractHeadings(html),
      textContent,
      emails: extractEmails(combined),
      phones: extractPhones(combined),
      wordCount: textContent.split(/\s+/).filter(Boolean).length,
    };
  } catch {
    return null;
  }
}

export function formatWebsiteAnalysisForAI(
  analysis: WebsiteAnalysis | null
): string {
  if (!analysis) {
    return "Site web inaccessible ou sans contenu exploitable.";
  }

  return [
    `URL analysée : ${analysis.url}`,
    analysis.title ? `Titre : ${analysis.title}` : null,
    analysis.metaDescription
      ? `Description : ${analysis.metaDescription}`
      : null,
    analysis.headings.length
      ? `Rubriques : ${analysis.headings.join(" | ")}`
      : null,
    analysis.emails.length ? `Emails trouvés : ${analysis.emails.join(", ")}` : null,
    analysis.phones.length
      ? `Téléphones trouvés : ${analysis.phones.join(", ")}`
      : null,
    `Contenu (${analysis.wordCount} mots) :\n${analysis.textContent.slice(0, 3500)}`,
  ]
    .filter(Boolean)
    .join("\n");
}
