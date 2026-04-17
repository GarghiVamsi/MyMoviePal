import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "amber";
}

export function Badge({ children, className, variant = "default" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variant === "default" && "bg-gray-700 text-gray-300",
        variant === "amber" && "bg-amber-500/20 text-amber-400",
        className
      )}
    >
      {children}
    </span>
  );
}
