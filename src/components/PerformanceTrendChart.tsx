import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type TrendPoint = {
  match: string;
  score: number;
};

export default function PerformanceTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data}>
        <XAxis dataKey="match" interval={0} angle={-25} textAnchor="end" height={60} tickMargin={12} />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="score" stroke="#b8ff2c" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
