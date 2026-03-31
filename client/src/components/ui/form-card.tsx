import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FormCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  children: React.ReactNode;
}

export const FormCard = React.forwardRef<HTMLDivElement, FormCardProps>(
  ({ className, title, children, ...props }, ref) => (
    <Card
      ref={ref}
      className={cn("bg-white border-gray-200 shadow-sm", className)}
      {...props}
    >
      {title && (
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900">
            {title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={title ? "pt-0" : ""}>
        {children}
      </CardContent>
    </Card>
  )
);
FormCard.displayName = "FormCard";