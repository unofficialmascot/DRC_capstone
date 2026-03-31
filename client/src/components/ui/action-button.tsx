import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
}

const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const buttonVariant = variant === "primary" ? "default" :
                         variant === "secondary" ? "secondary" :
                         variant === "danger" ? "destructive" : "default";

    const buttonSize = size === "sm" ? "sm" :
                      size === "md" ? "default" :
                      size === "lg" ? "lg" : "default";

    return (
      <Button
        ref={ref}
        variant={buttonVariant}
        size={buttonSize}
        className={cn(
          "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800",
          "text-white font-semibold shadow-md hover:shadow-lg",
          "transform hover:-translate-y-0.5 transition-all duration-200",
          variant === "secondary" && "bg-gray-600 hover:bg-gray-700",
          variant === "danger" && "bg-red-600 hover:bg-red-700",
          className
        )}
        {...props}
      />
    );
  }
);
ActionButton.displayName = "ActionButton";

export { ActionButton };