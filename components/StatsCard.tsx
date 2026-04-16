
interface Props {
  title: string;
  count: number;
  icon: React.ReactNode;
  color?: string;
}

export default function StatsCard({ title, count, icon, color = "bg-white" }: Props) {
  return (
    <div className={`${color} p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4`}>
      <div className="p-4 bg-gray-50 rounded-xl text-gray-600">
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{count}</p>
      </div>
    </div>
  )
}