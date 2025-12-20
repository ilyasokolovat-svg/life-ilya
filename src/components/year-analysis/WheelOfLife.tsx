import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

interface WheelOfLifeProps {
  data: { category: string; rating: number; fullMark: number }[];
  colors: Record<string, string>;
}

const WheelOfLife = ({ data, colors }: WheelOfLifeProps) => {
  return (
    <div className="w-full h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.2)" />
          <PolarAngleAxis 
            dataKey="category" 
            tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 12 }}
            tickLine={false}
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 10]} 
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
            tickCount={6}
          />
          <Radar
            name="Your Year"
            dataKey="rating"
            stroke="#fbbf24"
            fill="#fbbf24"
            fillOpacity={0.4}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WheelOfLife;
