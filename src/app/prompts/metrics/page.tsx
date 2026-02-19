import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { TrendingUp } from "lucide-react";
import { MetricsLeaderboard } from "@/components/prompts/metrics-leaderboard";

export const metadata: Metadata = {
  title: "Prompt Usage Metrics",
  description: "Discover the most used prompts in the community",
};

export default async function MetricsPage() {
  const t = await getTranslations("metrics");

  const translations = {
    mostCopied: t("mostCopied"),
    mostDownloaded: t("mostDownloaded"),
    mostRun: t("mostRun"),
    allTime: t("allTime"),
    thisMonth: t("thisMonth"),
    thisWeek: t("thisWeek"),
    noData: t("noData"),
    loading: t("loading"),
  };

  return (
    <div className="container py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">{t("title")}</h1>
          </div>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>

        <MetricsLeaderboard translations={translations} />
      </div>
    </div>
  );
}
