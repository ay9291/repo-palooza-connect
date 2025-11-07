import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ShowroomManagement from "@/components/ShowroomManagement";

const Showrooms = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Showroom Management</h1>
        <p className="text-muted-foreground">Manage showroom accounts and bulk orders</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Showroom Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <ShowroomManagement />
        </CardContent>
      </Card>
    </div>
  );
};

export default Showrooms;