type BarChartProps = {
  data: Array<{ name: string; value: number }>;
  xAxis: string;
  yAxis: string;
};

const BarChart = ({ data }: BarChartProps) => {
  return (
    <div className="h-full border border-dashed border-gray-300 rounded-md p-4 overflow-y-auto text-sm text-gray-600">
      <p className="font-semibold mb-2">Bar chart preview</p>
      <ul className="space-y-1">
        {data.map((item) => (
          <li key={item.name} className="flex items-center justify-between">
            <span>{item.name}</span>
            <span>{item.value.toLocaleString("vi-VN")}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BarChart;
