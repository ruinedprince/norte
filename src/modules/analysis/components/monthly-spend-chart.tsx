"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatBRL } from "@/core/domain/money";
import { formatMonthLabel } from "@/lib/format";

interface MonthlyPoint {
  month: string;
  spentCents: number;
}

/** Respect the user's reduced-motion preference (escopo §5 motion limits). */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = () => setReduced(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export function MonthlySpendChart({ data }: { data: MonthlyPoint[] }) {
  const reducedMotion = usePrefersReducedMotion();

  if (data.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
        Sem gastos para mostrar ainda.
      </div>
    );
  }

  const chartData = data.map((point) => ({
    label: formatMonthLabel(point.month),
    spentCents: point.spentCents,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          stroke="var(--muted-foreground)"
          fontSize={12}
        />
        <YAxis
          width={88}
          tickFormatter={(value: number) => formatBRL(value)}
          tickLine={false}
          axisLine={false}
          stroke="var(--muted-foreground)"
          fontSize={12}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)" }}
          formatter={(value) => [formatBRL(Number(value)), "Gasto"]}
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            color: "var(--popover-foreground)",
            fontSize: 13,
          }}
          labelStyle={{ color: "var(--muted-foreground)" }}
        />
        <Bar
          dataKey="spentCents"
          fill="var(--chart-1)"
          radius={[6, 6, 0, 0]}
          maxBarSize={56}
          isAnimationActive={!reducedMotion}
          animationDuration={600}
          animationEasing="ease-out"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
