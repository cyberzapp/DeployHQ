import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', ...props }) => {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-border/40 ${className}`}
      {...props}
    />
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-main text-text-primary flex">
      {/* Skeleton Sidebar */}
      <div className="w-64 bg-sidebar border-r border-border p-4 hidden lg:flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-lg bg-primary/20" />
          <Skeleton className="w-24 h-5" />
        </div>
        <div className="space-y-2 pt-4">
          <Skeleton className="w-full h-8 rounded-lg" />
          <Skeleton className="w-full h-8 rounded-lg" />
          <Skeleton className="w-full h-8 rounded-lg" />
          <Skeleton className="w-full h-8 rounded-lg" />
          <Skeleton className="w-full h-8 rounded-lg" />
        </div>
        <div className="mt-auto space-y-2">
          <Skeleton className="w-full h-10 rounded-lg" />
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 flex flex-col">
        {/* Top Navbar Skeleton */}
        <div className="h-14 border-b border-border bg-sidebar px-6 flex items-center justify-between">
          <Skeleton className="w-32 h-5" />
          <div className="flex items-center gap-3">
            <Skeleton className="w-48 h-8 rounded-lg hidden sm:block" />
            <Skeleton className="w-8 h-8 rounded-full" />
          </div>
        </div>

        {/* Content Body Skeleton */}
        <div className="p-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton className="w-48 h-7" />
              <Skeleton className="w-72 h-4" />
            </div>
            <Skeleton className="w-32 h-9 rounded-lg" />
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>

          {/* Main Chart Area */}
          <div className="grid lg:grid-cols-3 gap-6">
            <Skeleton className="h-80 rounded-xl lg:col-span-2" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
};

