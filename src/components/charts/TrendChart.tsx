"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface TrendChartProps {
  labels: string[];
  dataPoints: number[];
}

export default function TrendChart({ labels, dataPoints }: TrendChartProps) {
  const data = {
    labels,
    datasets: [
      {
        label: "Fake Reviews Trend",
        data: dataPoints,
        borderColor: "#ef4444",
        backgroundColor: "rgba(239, 68, 68, 0.3)",
        tension: 0.3,
        fill: true,
      },
    ],
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-md w-full max-w-xl">
      <h2 className="text-lg font-semibold mb-2">Fake Reviews Over Time</h2>
      <Line data={data} />
    </div>
  );
}
