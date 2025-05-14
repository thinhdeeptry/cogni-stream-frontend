"use client";

import {
  Bar,
  BarChart as RechartsBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface BarChartProps {
  data: any[];
  index: string;
  categories: string[];
  colors?: string[];
  valueFormatter?: (value: number) => string;
  className?: string;
  title?: string;
  subtitle?: string;
}

export function BarChart({
  data,
  index,
  categories,
  colors = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"],
  valueFormatter = (value: number) => `${value}`,
  className,
  title,
  subtitle,
}: BarChartProps) {
  return (
    <div
      className="flex flex-col w-full h-full"
      style={{
        backgroundColor: `hsl(var(--chart-background))`,
        borderRadius: "var(--radius)",
        padding: "1rem",
      }}
    >
      {title && <h3 className="text-lg font-medium">{title}</h3>}
      {subtitle && (
        <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>
      )}

      <ResponsiveContainer width="100%" height="100%" className={className}>
        <RechartsBarChart
          data={data}
          margin={{ top: 10, right: 10, left: 10, bottom: 30 }}
        >
          <XAxis
            dataKey={index}
            tickLine={false}
            axisLine={{ stroke: "hsl(var(--muted-foreground) / 0.2)" }}
            tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }}
            tickMargin={12}
            height={40}
            interval={0}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }}
            tickMargin={8}
            tickFormatter={(value) => valueFormatter(value)}
            width={60}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          {index}
                        </span>
                        <span className="font-bold text-muted-foreground">
                          {payload[0].payload[index]}
                        </span>
                      </div>
                      {categories.map((category, i) => (
                        <div key={category} className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            {category}
                          </span>
                          <span
                            className="font-bold"
                            style={{
                              color: `hsl(var(--${colors[i % colors.length]}))`,
                            }}
                          >
                            {valueFormatter(payload[0].payload[category])}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          {categories.map((category, i) => (
            <Bar
              key={category}
              dataKey={category}
              fill={`hsl(12, 76%, 61%)`}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
