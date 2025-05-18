"use client";

import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface LineChartProps {
  data: any[];
  index: string;
  categories: string[];
  colors?: string[];
  valueFormatter?: (value: number) => string;
  className?: string;
}

export function LineChart({
  data,
  index,
  categories,
  colors = ["blue"],
  valueFormatter = (value: number) => `${value}`,
  className,
}: LineChartProps) {
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
      <RechartsLineChart
        data={data}
        margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey={index}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
          tickMargin={8}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
          tickMargin={8}
          tickFormatter={(value) => valueFormatter(value)}
        />
        <Tooltip
          cursor={false}
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
                            color:
                              chartColors[i % chartColors.length] ||
                              `hsl(var(--${colors[i % colors.length]}-9))`,
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
          <Line
            key={category}
            type="natural"
            dataKey={category}
            stroke={
              chartColors[i % chartColors.length] ||
              `hsl(var(--${colors[i % colors.length]}-9))`
            }
            strokeWidth={2}
            dot={{ r: 3, strokeWidth: 2, fill: "#fff" }}
            activeDot={{ r: 5, strokeWidth: 2 }}
            connectNulls={true}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
