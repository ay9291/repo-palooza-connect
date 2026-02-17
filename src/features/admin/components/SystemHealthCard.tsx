import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SystemHealthCardProps {
  apiLatencyMs: number;
  errorRate: number;
  uptimePercent: number;
}

const SystemHealthCard = ({ apiLatencyMs, errorRate, uptimePercent }: SystemHealthCardProps) => {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle>System Health</CardTitle>
      </CardHeader>
      <CardContent className="grid sm:grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">API Latency</p>
          <p className="font-semibold">{apiLatencyMs}ms</p>
        </div>
        <div>
          <p className="text-muted-foreground">Error Rate</p>
          <p className="font-semibold">{errorRate}%</p>
        </div>
        <div>
          <p className="text-muted-foreground">Uptime</p>
          <p className="font-semibold">{uptimePercent}%</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemHealthCard;
