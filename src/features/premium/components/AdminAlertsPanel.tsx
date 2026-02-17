import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AdminAlertsPanelProps {
  stalePlacedOrders: number;
  longRunningAssignments: number;
}

const AdminAlertsPanel = ({ stalePlacedOrders, longRunningAssignments }: AdminAlertsPanelProps) => {
  return (
    <div className="space-y-2">
      <Alert>
        <AlertTitle>Order Aging Alert</AlertTitle>
        <AlertDescription>{stalePlacedOrders} placed orders are older than 24 hours.</AlertDescription>
      </Alert>
      <Alert>
        <AlertTitle>Delivery SLA Alert</AlertTitle>
        <AlertDescription>{longRunningAssignments} delivery assignments are active for over 18 hours.</AlertDescription>
      </Alert>
    </div>
  );
};

export default AdminAlertsPanel;
