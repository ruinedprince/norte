"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatBRL } from "@/core/domain/money";
import { formatMonthLabel } from "@/lib/format";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";

interface Point {
  month: string;
  activeCents: number;
  passiveCents: number;
}

const LABELS: Record<string, string> = { ativa: "Renda ativa", passiva: "Dividendos" };

export function IncomeMixChart({ data }: { data: Point[] }) {
  const reducedMotion = usePrefersReducedMotion();

  if (data.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
        Sem renda registrada ainda.
      </div>
    );
  }

  const chartData = data.map((point) => ({
    label: formatMonthLabel(point.month),
    ativa: point.activeCents,
    passiva: point.passiveCents,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
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
        <Bar
          dataKey="ativa"
          stackId="inc"
          fill="var(--chart-1)"
          maxBarSize={48}
          isAnimationActive={!reducedMotion}
          animationDuration={600}
          animationEasing="ease-out"
        />
        <Bar
          dataKey="passiva"
          stackId="inc"
          fill="var(--positive)"
          radius={[6, 6, 0, 0]}
          maxBarSize={48}
          isAnimationActive={!reducedMotion}
          animationDuration={600}
          animationEasing="ease-out"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
