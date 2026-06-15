"use client";

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStickToBottomScroll } from "@/hooks/use-stick-to-bottom-scroll";

export interface ActivityLogEntry {
  step: string;
  message: string;
  level: "info" | "success" | "warning" | "error";
  timestamp: string;
}

interface ActivityFeedProps {
  logs: ActivityLogEntry[];
  stepLabels: Record<string, string>;
  isRunning?: boolean;
  title: string;
  description?: string;
  emptyMessage: string;
}

const levelConfig = {
  info: {
    icon: Info,
    iconWrap: "bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400",
  },
  success: {
    icon: CheckCircle2,
    iconWrap: "bg-brand-muted text-brand",
  },
  warning: {
    icon: AlertTriangle,
    iconWrap: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
  },
  error: {
    icon: AlertCircle,
    iconWrap: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
  },
} as const;

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function parseMessage(message: string, level: ActivityLogEntry["level"]) {
  const savedMatch = message.match(
    /^Enregistré en base\s*:\s*(.+)$/i
  );
  if (savedMatch && level === "success") {
    return {
      title: "Prospect enregistré",
      subtitle: savedMatch[1],
    };
  }

  return { title: message, subtitle: null as string | null };
}

function ActivityLogRow({
  log,
  stepLabel,
}: {
  log: ActivityLogEntry;
  stepLabel: string;
}) {
  const config = levelConfig[log.level];
  const Icon = config.icon;
  const parsed = parseMessage(log.message, log.level);

  return (
    <li className="flex gap-3 px-4 py-3">
      <div
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          config.iconWrap
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-sm font-medium text-foreground">
            {parsed.title}
          </p>
          <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-muted">
            {stepLabel}
          </span>
          <span className="text-[11px] text-muted-foreground">{formatTime(log.timestamp)}</span>
        </div>
        {parsed.subtitle && (
          <p className="mt-1 text-sm text-muted">
            {parsed.subtitle}
          </p>
        )}
      </div>
    </li>
  );
}

export function ActivityFeed({
  logs,
  stepLabels,
  isRunning = false,
  title,
  description,
  emptyMessage,
}: ActivityFeedProps) {
  const { containerRef, handleScroll } = useStickToBottomScroll(logs);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-border-subtle px-4 py-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            {title}
          </h3>
          {description && (
            <p className="mt-0.5 text-sm text-muted">
              {description}
            </p>
          )}
        </div>
        {isRunning && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-muted px-2.5 py-1 text-xs font-medium text-brand">
            <Radio className="h-3 w-3 animate-pulse" />
            En direct
          </span>
        )}
      </div>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="max-h-80 overflow-y-auto"
      >
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted">
              <Info className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="mt-3 max-w-sm text-sm text-muted">
              {emptyMessage}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {logs.map((log, index) => (
              <ActivityLogRow
                key={`${log.timestamp}-${index}`}
                log={log}
                stepLabel={stepLabels[log.step] ?? log.step}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
