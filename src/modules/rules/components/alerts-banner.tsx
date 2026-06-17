import Link from "next/link";

import { TriangleAlert } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

/** Triggered-alert banner for the dashboard; renders nothing when all clear. */
export function AlertsBanner({ count, names }: { count: number; names: string[] }) {
  if (count === 0) return null;

  return (
    <Card className="bg-destructive/5 ring-destructive/20">
      <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div className="flex items-center gap-2 text-sm">
          <TriangleAlert className="size-4 shrink-0 text-destructive" />
          <span className="font-medium text-destructive">
            {count} alerta{count === 1 ? "" : "s"}
          </span>
          <span className="text-muted-foreground">{names.join(" · ")}</span>
        </div>
        <Link href="/rules" className="text-sm text-primary hover:underline">
          Ver regras
        </Link>
      </CardContent>
    </Card>
  );
}
