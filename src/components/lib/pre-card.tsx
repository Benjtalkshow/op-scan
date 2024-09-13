import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

const PreCard = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) => (
  <Card className="w-full bg-background">
    <CardContent className="p-4">
      <pre className={cn("font-mono text-sm", className)}>{children}</pre>
    </CardContent>
  </Card>
);

export default PreCard;
