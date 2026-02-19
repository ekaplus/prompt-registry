"use client";

import { Copy, Download, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface UsageMetricsBadgeProps {
  copiedCount?: number;
  downloadCount?: number;
  runCount?: number;
  className?: string;
  showLabels?: boolean;
}

export function UsageMetricsBadge({
  copiedCount = 0,
  downloadCount = 0,
  runCount = 0,
  className = "",
  showLabels = false,
}: UsageMetricsBadgeProps) {
  const t = useTranslations("prompts");

  // Don't render if all counts are zero
  if (copiedCount === 0 && downloadCount === 0 && runCount === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-3 text-xs text-muted-foreground ${className}`}>
      {copiedCount > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 cursor-default">
              <Copy className="h-3 w-3" />
              <span>{copiedCount}</span>
              {showLabels && <span className="hidden sm:inline">{t("copied")}</span>}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("copiedTimes", { count: copiedCount })}</p>
          </TooltipContent>
        </Tooltip>
      )}
      
      {downloadCount > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 cursor-default">
              <Download className="h-3 w-3" />
              <span>{downloadCount}</span>
              {showLabels && <span className="hidden sm:inline">{t("downloaded")}</span>}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("downloadedTimes", { count: downloadCount })}</p>
          </TooltipContent>
        </Tooltip>
      )}
      
      {runCount > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 cursor-default">
              <Play className="h-3 w-3" />
              <span>{runCount}</span>
              {showLabels && <span className="hidden sm:inline">{t("run")}</span>}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("runTimes", { count: runCount })}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
