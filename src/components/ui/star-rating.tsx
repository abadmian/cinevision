import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value?: number;
  onChange?: (rating: number) => void;
  max?: number;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
  className?: string;
}

export function StarRating({
  value = 0,
  onChange,
  max = 5,
  size = "md",
  readonly = false,
  className,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = React.useState(0);

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const handleClick = (rating: number) => {
    if (!readonly && onChange) {
      onChange(rating);
    }
  };

  const handleMouseEnter = (rating: number) => {
    if (!readonly) {
      setHoverValue(rating);
    }
  };

  const handleMouseLeave = () => {
    setHoverValue(0);
  };

  return (
    <div
      className={cn("flex gap-0.5", className)}
      onMouseLeave={handleMouseLeave}
    >
      {Array.from({ length: max }, (_, i) => {
        const rating = i + 1;
        const filled = rating <= (hoverValue || value);

        return (
          <button
            key={i}
            type="button"
            onClick={() => handleClick(rating)}
            onMouseEnter={() => handleMouseEnter(rating)}
            disabled={readonly}
            className={cn(
              "transition-colors focus:outline-none",
              !readonly && "hover:scale-110 focus:scale-110",
              readonly && "cursor-default"
            )}
          >
            <Star
              className={cn(
                sizeClasses[size],
                filled ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}