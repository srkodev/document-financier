
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DataCardProps {
  title: string;
  description?: string;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
}

const DataCard: React.FC<DataCardProps> = ({
  title,
  description,
  className,
  headerClassName,
  contentClassName,
  footerClassName,
  footer,
  children,
  onClick
}) => {
  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all duration-200 animate-scale-in",
        onClick && "cursor-pointer hover:shadow-md transform hover:-translate-y-1",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className={cn("pb-2", headerClassName)}>
        <CardTitle className="text-xl font-medium">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className={cn("pt-2", contentClassName)}>
        {children}
      </CardContent>
      {footer && (
        <CardFooter className={cn("pt-2 flex justify-between items-center", footerClassName)}>
          {footer}
        </CardFooter>
      )}
    </Card>
  );
};

export default DataCard;
