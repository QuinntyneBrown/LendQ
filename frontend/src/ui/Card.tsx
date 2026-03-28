import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`bg-surface rounded-card border border-border ${className}`}>
      {children}
    </div>
  );
}

export default Card;
