import { cn } from "@/lib/utils";

interface DotsLoaderProps {
  type?: "bounce" | "pulse";
  color?: string;
  className?: string;
}

export function DotsLoader({
  type = "bounce",
  color = "bg-blue-500",
  className,
}: DotsLoaderProps) {
  return (
    <div className={cn("flex space-x-2", className)}>
      {type === "bounce" ? (
        <>
          <div
            className={cn(
              "h-2 w-2 animate-bounce rounded-full",
              color,
              "animation-delay-0"
            )}
          />
          <div
            className={cn(
              "h-2 w-2 animate-bounce rounded-full",
              color,
              "animation-delay-150"
            )}
          />
          <div
            className={cn(
              "h-2 w-2 animate-bounce rounded-full",
              color,
              "animation-delay-300"
            )}
          />
        </>
      ) : (
        <>
          <div className={cn("h-2 w-2 animate-pulse rounded-full", color)} />
          <div
            className={cn(
              "h-2 w-2 animate-pulse rounded-full",
              color,
              "animation-delay-150"
            )}
          />
          <div
            className={cn(
              "h-2 w-2 animate-pulse rounded-full",
              color,
              "animation-delay-300"
            )}
          />
        </>
      )}
    </div>
  );
}
