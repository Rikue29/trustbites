"use client";

import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

interface PieChartProps {
  genuine: number;
  suspicious: number;
  fake: number;
}

export default function PieChart({ genuine, suspicious, fake }: PieChartProps) {
  const data = {
    labels: ["Genuine", "Suspicious", "Fake"],
    datasets: [
      {
        data: [genuine, suspicious, fake],
        backgroundColor: ["#22c55e", "#facc15", "#ef4444"], // green, yellow, red
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-md w-full max-w-sm">
      <h2 className="text-lg font-semibold mb-2">Review Distribution</h2>
      <Pie data={data} />
    </div>
  );
}
