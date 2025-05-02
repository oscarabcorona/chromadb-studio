"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepProps {
  icon: LucideIcon;
  title: string;
  description: string;
  status?: "pending" | "current" | "complete";
}

export function Step({
  icon: Icon,
  title,
  description,
  status = "pending",
}: StepProps) {
  return (
    <div className="flex items-start gap-4">
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          status === "complete" && "bg-primary text-primary-foreground",
          status === "current" && "bg-primary/20 text-primary",
          status === "pending" && "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div className="grid gap-1">
        <h3
          className={cn(
            "text-base font-medium leading-none",
            status === "complete" && "text-primary",
            status === "current" && "text-primary",
            status === "pending" && "text-muted-foreground"
          )}
        >
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

interface StepsProps {
  children: React.ReactNode;
  className?: string;
}

export function Steps({ children, className }: StepsProps) {
  return <div className={cn("grid gap-4", className)}>{children}</div>;
}
