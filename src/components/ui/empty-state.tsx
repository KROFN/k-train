"use client";

import { InboxIcon, AlertTriangleIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
      <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
        {icon ?? <InboxIcon className="h-7 w-7 text-muted-foreground" />}
      </div>
      <div className="space-y-1">
        <h3 className="font-semibold text-sm">{title}</h3>
        {description && (
          <p className="text-xs text-muted-foreground max-w-xs">{description}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Что-то пошло не так",
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
      <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertTriangleIcon className="h-7 w-7 text-destructive" />
      </div>
      <div className="space-y-1">
        <h3 className="font-semibold text-sm">{title}</h3>
        {message && (
          <p className="text-xs text-muted-foreground max-w-xs">{message}</p>
        )}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Попробовать снова
        </button>
      )}
    </div>
  );
}
