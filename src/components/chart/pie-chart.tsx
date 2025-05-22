"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface PieChartProps {
  data: any[];
  index: string;
  category: string;
  colors?: string[];
  valueFormatter?: (value: number) => string;
  className?: string;
}

export function PieChart({
  data,
  index,
  category,
  colors = ["blue", "green", "yellow", "red", "purple", "indigo"],
  valueFormatter = (value: number) => `${value}`,
  className,
}: PieChartProps) {
  // Custom chart colors from HSL variables
  const chartColors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  return (
    <ResponsiveContainer width="100%" height="100%" className={className}>
      <RechartsPieChart>
        <Pie
          data={data}
          dataKey={category}
          nameKey={index}
          cx="50%"
          cy="50%"
          outerRadius={80}
          label={({ name, percent }) =>
            `${name}: ${(percent * 100).toFixed(0)}%`
          }
          labelLine={true}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={
                chartColors[index % chartColors.length] ||
                `hsl(var(--${colors[index % colors.length]}-9))`
              }
            />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                      {payload[0].name}
                    </span>
                    <span className="font-bold">
                      {valueFormatter(payload[0].value as number)}
                    </span>
                  </div>
                </div>
              );
            }
            return null;
          }}
        />
        <Legend />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}
