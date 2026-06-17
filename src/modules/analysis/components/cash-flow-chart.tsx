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

import { formatBRL, formatCompactBRL } from "@/core/domain/money";
import { formatMonthLabel } from "@/lib/format";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";

interface CashFlowPoint {
  month: string;
  incomeCents: number;
  expenseCents: number;
}

const LABELS: Record<string, string> = { receita: "Receita", despesa: "Despesa" };

export function CashFlowChart({ data }: { data: CashFlowPoint[] }) {
  const reducedMotion = usePrefersReducedMotion();

  if (data.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
        Sem dados para mostrar ainda.
      </div>
    );
  }

  const chartData = data.map((point) => ({
    label: formatMonthLabel(point.month),
    receita: point.incomeCents,
    despesa: point.expenseCents,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }} barGap={4}>
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
        <Legend
          formatter={(value) => LABELS[String(value)] ?? value}
          wrapperStyle={{ fontSize: 12 }}
        />
        <Bar
          dataKey="receita"
          fill="var(--positive)"
          radius={[6, 6, 0, 0]}
          maxBarSize={28}
          isAnimationActive={!reducedMotion}
          animationDuration={600}
          animationEasing="ease-out"
        />
        <Bar
          dataKey="despesa"
          fill="var(--chart-1)"
          radius={[6, 6, 0, 0]}
          maxBarSize={28}
          isAnimationActive={!reducedMotion}
          animationDuration={600}
          animationEasing="ease-out"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
