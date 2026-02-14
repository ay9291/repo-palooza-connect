import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import ShowroomManagement from "@/components/ShowroomManagement";

const Showrooms = () => {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-gradient-to-r from-background via-background to-accent/5 p-6">
        <h1 className="text-3xl font-bold tracking-tight">Showroom Management</h1>
        <p className="text-muted-foreground">Manage partner accounts and wholesale network operations.</p>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Showroom Accounts</CardTitle>
          <CardDescription>Track onboarding, communication details and partner activity.</CardDescription>
        </CardHeader>
        <CardContent>
          <ShowroomManagement />
        </CardContent>
      </Card>
    </div>
  );
};

export default Showrooms;
