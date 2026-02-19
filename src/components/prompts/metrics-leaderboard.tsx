"use client";

import { useState, useEffect } from "react";
import { Copy, Download, Play, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PromptCard } from "@/components/prompts/prompt-card";
import { Masonry } from "@/components/ui/masonry";

interface MetricsLeaderboardProps {
  translations: {
    mostCopied: string;
    mostDownloaded: string;
    mostRun: string;
    allTime: string;
    thisMonth: string;
    thisWeek: string;
    noData: string;
    loading: string;
  };
}

interface PromptMetric {
  promptId: string;
  title: string;
  slug: string | null;
  description: string | null;
  type: string;
  authorId: string;
  authorUsername: string;
  authorName: string | null;
  authorAvatar: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  copiedCount?: number;
  downloadCount?: number;
  runCount?: number;
  usageCount?: number;
  voteCount: number;
  isPrivate: boolean;
  isUnlisted: boolean;
}

export function MetricsLeaderboard({ translations }: MetricsLeaderboardProps) {
  const [metricType, setMetricType] = useState<'copy' | 'download' | 'run'>('copy');
  const [period, setPeriod] = useState<'all' | 'month' | 'week'>('all');
  const [prompts, setPrompts] = useState<PromptMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/prompts/metrics?type=${metricType}&period=${period}&limit=20`
        );
        
        if (response.ok) {
          const data = await response.json();
          setPrompts(data.prompts || []);
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [metricType, period]);

  const getUsageCount = (prompt: PromptMetric) => {
    if (period === 'all') {
      return metricType === 'copy' 
        ? prompt.copiedCount 
        : metricType === 'download' 
        ? prompt.downloadCount 
        : prompt.runCount;
    }
    return prompt.usageCount;
  };

  const getUsageLabel = () => {
    if (metricType === 'copy') return translations.mostCopied;
    if (metricType === 'download') return translations.mostDownloaded;
    return translations.mostRun;
  };

  const getIcon = () => {
    if (metricType === 'copy') return Copy;
    if (metricType === 'download') return Download;
    return Play;
  };

  const Icon = getIcon();

  return (
    <div className="space-y-6">
      {/* Metric Type Tabs */}
      <Tabs value={metricType} onValueChange={(v) => setMetricType(v as typeof metricType)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="copy" className="gap-1.5">
            <Copy className="h-4 w-4" />
            <span className="hidden sm:inline">{translations.mostCopied}</span>
          </TabsTrigger>
          <TabsTrigger value="download" className="gap-1.5">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">{translations.mostDownloaded}</span>
          </TabsTrigger>
          <TabsTrigger value="run" className="gap-1.5">
            <Play className="h-4 w-4" />
            <span className="hidden sm:inline">{translations.mostRun}</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Time Period Tabs */}
      <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">{translations.allTime}</TabsTrigger>
          <TabsTrigger value="month">{translations.thisMonth}</TabsTrigger>
          <TabsTrigger value="week">{translations.thisWeek}</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Results */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          {translations.loading}
        </div>
      ) : prompts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {translations.noData}
        </div>
      ) : (
        <Masonry columnCount={{ default: 1, md: 2, lg: 3 }} gap={16}>
          {prompts.map((prompt, index) => {
            const usageCount = getUsageCount(prompt);
            
            return (
              <div key={prompt.promptId} className="relative">
                {/* Rank Badge */}
                {index < 3 && (
                  <div className="absolute -top-2 -left-2 z-10">
                    <Badge 
                      variant={index === 0 ? "default" : "secondary"}
                      className={`
                        h-8 w-8 rounded-full flex items-center justify-center font-bold
                        ${index === 0 ? 'bg-yellow-500 text-yellow-950 border-yellow-600' : ''}
                        ${index === 1 ? 'bg-gray-400 text-gray-900 border-gray-500' : ''}
                        ${index === 2 ? 'bg-amber-600 text-amber-950 border-amber-700' : ''}
                      `}
                    >
                      {index + 1}
                    </Badge>
                  </div>
                )}
                
                <PromptCard
                  prompt={{
                    id: prompt.promptId,
                    slug: prompt.slug,
                    title: prompt.title,
                    description: prompt.description,
                    type: prompt.type as any,
                    content: '', // Not needed for card display
                    isPrivate: prompt.isPrivate,
                    isUnlisted: prompt.isUnlisted,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    author: {
                      id: prompt.authorId,
                      username: prompt.authorUsername,
                      name: prompt.authorName,
                      avatar: prompt.authorAvatar,
                    },
                    category: prompt.categoryId ? {
                      id: prompt.categoryId,
                      name: prompt.categoryName!,
                      slug: prompt.categorySlug!,
                    } : null,
                    tags: [],
                    _count: {
                      votes: prompt.voteCount,
                    },
                    mediaUrl: null,
                    requiresMediaUpload: false,
                    requiredMediaType: null,
                    requiredMediaCount: null,
                    structuredFormat: null,
                    userExamples: [],
                  }}
                />
                
                {/* Usage Count Badge */}
                <div className="absolute top-2 right-2 z-10">
                  <Badge variant="secondary" className="gap-1.5 bg-background/95 backdrop-blur">
                    <Icon className="h-3 w-3" />
                    <span className="font-semibold">{usageCount || 0}</span>
                  </Badge>
                </div>
              </div>
            );
          })}
        </Masonry>
      )}
    </div>
  );
}
