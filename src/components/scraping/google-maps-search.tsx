"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { searchGoogleMapsAction } from "@/actions/scraping";
import type { GoogleMapsPlaceResult } from "@/types/scraping";
import { Card, CardHeader } from "@/components/ui/card";
import { getScoreBgColor, getScoreColor } from "@/lib/utils";
import { Loader2, MapPin, Search } from "lucide-react";

export function GoogleMapsSearchPanel() {
  const [ville, setVille] = useState("");
  const [enrichEmails, setEnrichEmails] = useState(true);
  const [results, setResults] = useState<GoogleMapsPlaceResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isSearching, startSearch] = useTransition();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaveMessage(null);

    startSearch(async () => {
      const response = await searchGoogleMapsAction({
        ville,
        maxResults: 20,
        enrichEmails,
      });

      if (!response.success) {
        setError(response.error);
        setResults([]);
        return;
      }

      setResults(response.results);
      setSaveMessage(
        `${response.savedCount} prospect(s) enregistré(s) automatiquement en base` +
          (response.skippedCount > 0
            ? ` (${response.skippedCount} ignoré(s))`
            : "")
      );
    });
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Recherche Google Maps"
          description="Trouve des entreprises du paysage par ville — enregistrement automatique en base"
        />

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Ville
              </label>
              <input
                required
                value={ville}
                onChange={(e) => setVille(e.target.value)}
                disabled={isSearching}
                className={inputClass}
                placeholder="Ex : Tours, Lyon, Nantes..."
              />
            </div>
            <button
              type="submit"
              disabled={isSearching || !ville.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {isSearching ? "Recherche..." : "Rechercher"}
            </button>
          </div>

          <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={enrichEmails}
              onChange={(e) => setEnrichEmails(e.target.checked)}
              disabled={isSearching}
              className="rounded border-zinc-300"
            />
            Extraire les emails depuis les sites web (plus lent)
          </label>
        </form>

        <p className="mt-3 flex items-start gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Chaque entreprise trouvée est enregistrée en base dès qu&apos;elle est
          analysée. Google Maps fournit nom, téléphone, site et avis.
        </p>
      </Card>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {saveMessage && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          {saveMessage}{" "}
          <Link href="/prospects" className="underline">
            Voir les prospects →
          </Link>
        </p>
      )}

      {results.length > 0 && (
        <Card>
          <div className="mb-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {results.length} entreprise(s) trouvée(s) et enregistrée(s)
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50">
                <tr>
                  <th className="px-3 py-3 font-medium text-zinc-600 dark:text-zinc-400">
                    Nom
                  </th>
                  <th className="px-3 py-3 font-medium text-zinc-600 dark:text-zinc-400">
                    Téléphone
                  </th>
                  <th className="px-3 py-3 font-medium text-zinc-600 dark:text-zinc-400">
                    Email
                  </th>
                  <th className="px-3 py-3 font-medium text-zinc-600 dark:text-zinc-400">
                    Site
                  </th>
                  <th className="px-3 py-3 font-medium text-zinc-600 dark:text-zinc-400">
                    Ville
                  </th>
                  <th className="px-3 py-3 font-medium text-zinc-600 dark:text-zinc-400">
                    Avis Google
                  </th>
                  <th className="px-3 py-3 font-medium text-zinc-600 dark:text-zinc-400">
                    Score IA
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {results.map((place) => (
                  <tr
                    key={place.placeId}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <td className="px-3 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                      {place.nomEntreprise}
                    </td>
                    <td className="px-3 py-3 text-zinc-600 dark:text-zinc-400">
                      {place.telephone ?? "—"}
                    </td>
                    <td className="max-w-[160px] truncate px-3 py-3 text-zinc-600 dark:text-zinc-400">
                      {place.email ?? "—"}
                    </td>
                    <td className="max-w-[140px] truncate px-3 py-3">
                      {place.siteWeb ? (
                        <a
                          href={place.siteWeb}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-600 hover:underline dark:text-emerald-400"
                        >
                          {place.siteWeb.replace(/^https?:\/\/(www\.)?/, "")}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-3 text-zinc-600 dark:text-zinc-400">
                      {place.ville ?? "—"}
                    </td>
                    <td className="px-3 py-3 text-zinc-600 dark:text-zinc-400">
                      {place.avisGoogle > 0 ? (
                        <>
                          {place.avisGoogle}
                          {place.noteGoogle ? (
                            <span className="ml-1 text-xs text-zinc-400">
                              ({place.noteGoogle}/5)
                            </span>
                          ) : null}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${getScoreBgColor(null)} ${getScoreColor(null)}`}
                      >
                        —
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
