import Chart_data_resort from "./Chart_data_resort";
import ChartCircle from "./Chart_cirlce";

export default function ChartDataDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 mb-4">
      <Chart_data_resort />
      <ChartCircle />
    </div>
  );
}
