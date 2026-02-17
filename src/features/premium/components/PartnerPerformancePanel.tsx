interface PartnerStat {
  id: string;
  full_name: string;
  assignedOrders: number;
  deliveredOrders: number;
}

const PartnerPerformancePanel = ({ stats }: { stats: PartnerStat[] }) => {
  return (
    <div className="space-y-2">
      {stats.map((stat) => (
        <div key={stat.id} className="border rounded p-3 flex items-center justify-between">
          <p className="font-medium">{stat.full_name}</p>
          <div className="text-sm text-muted-foreground flex gap-4">
            <span>Assigned: {stat.assignedOrders}</span>
            <span>Delivered: {stat.deliveredOrders}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PartnerPerformancePanel;
