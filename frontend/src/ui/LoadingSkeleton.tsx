interface LoadingSkeletonProps {
  className?: string;
  count?: number;
}

export function LoadingSkeleton({
  className = "",
  count = 1,
}: LoadingSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          data-testid="skeleton"
          className={`animate-pulse bg-border rounded-card h-4 ${className}`}
        />
      ))}
    </>
  );
}

export default LoadingSkeleton;
