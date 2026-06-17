"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatBRL, formatCompactBRL } from "@/core/domain/money";
import { formatMonthLabel } from "@/lib/format";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";

interface Point {
  month: string;
  cashCents: number;
  investmentsCents: number;
}

const LABELS: Record<string, string> = { caixa: "Caixa", investimentos: "Investimentos" };

export function NetWorthChart({ data }: { data: Point[] }) {
  const reducedMotion = usePrefersReducedMotion();

  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
        Sem histórico para mostrar ainda.
      </div>
    );
  }

  const chartData = data.map((point) => ({
    label: formatMonthLabel(point.month),
    caixa: point.cashCents,
    investimentos: point.investmentsCents,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
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
          width={56}
          tickFormatter={(value: number) => formatCompactBRL(value)}
          tickLine={false}
          axisLine={false}
          stroke="var(--muted-foreground)"
          fontSize={12}
        />
        <Tooltip
          cursor={{ stroke: "var(--border)" }}
          formatter={(value, name) => [formatBRL(Number(value)), LABELS[String(name)] ?? name]}
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            color: "var(--popover-foreground)",
            fontSize: 13,
          }}
          labelStyle={{ color: "var(--muted-foreground)" }}
        />
        <Legend formatter={(value) => LABELS[String(value)] ?? value} wrapperStyle={{ fontSize: 12 }} />
        <Area
          type="monotone"
          dataKey="caixa"
          stackId="nw"
          stroke="var(--muted-foreground)"
          fill="var(--muted)"
          fillOpacity={0.7}
          isAnimationActive={!reducedMotion}
          animationDuration={600}
        />
        <Area
          type="monotone"
          dataKey="investimentos"
          stackId="nw"
          stroke="var(--chart-1)"
          fill="var(--chart-1)"
          fillOpacity={0.5}
          isAnimationActive={!reducedMotion}
          animationDuration={600}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
