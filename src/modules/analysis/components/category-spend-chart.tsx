"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatBRL } from "@/core/domain/money";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";

interface CategoryPoint {
  categoryId: string | null;
  name: string | null;
  spentCents: number;
}

export function CategorySpendChart({ data }: { data: CategoryPoint[] }) {
  const reducedMotion = usePrefersReducedMotion();

  if (data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
        Sem gastos para mostrar ainda.
      </div>
    );
  }

  const chartData = data.map((point) => ({
    label: point.name ?? "Sem categoria",
    spentCents: point.spentCents,
    uncategorized: point.categoryId === null,
  }));
  const height = Math.max(160, chartData.length * 44 + 24);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        layout="vertical"
        data={chartData}
        margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
      >
        <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis
          type="number"
          tickFormatter={(value: number) => formatBRL(value)}
          tickLine={false}
          axisLine={false}
          stroke="var(--muted-foreground)"
          fontSize={12}
        />
        <YAxis
          type="category"
          dataKey="label"
          width={130}
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
          radius={[0, 6, 6, 0]}
          maxBarSize={28}
          isAnimationActive={!reducedMotion}
          animationDuration={600}
          animationEasing="ease-out"
        >
          {chartData.map((point) => (
            <Cell
              key={point.label}
              fill={point.uncategorized ? "var(--muted-foreground)" : "var(--chart-1)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
