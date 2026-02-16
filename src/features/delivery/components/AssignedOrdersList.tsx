import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DeliveryJob {
  id: string;
  status: "assigned" | "picked_up" | "delivered";
  payout: number;
}

interface AssignedOrdersListProps {
  jobs: DeliveryJob[];
}

const AssignedOrdersList = ({ jobs }: AssignedOrdersListProps) => {
  return (
    <div className="space-y-3">
      {jobs.map((job) => (
        <Card key={job.id}>
          <CardHeader>
            <CardTitle className="text-base">Order {job.id}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between text-sm">
            <span>Status: {job.status.replace("_", " ")}</span>
            <Button size="sm" variant="outline">Update status</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AssignedOrdersList;
