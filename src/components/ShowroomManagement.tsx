import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2 } from "lucide-react";

interface Showroom {
  id: string;
  business_name: string;
  contact_person: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  gst_number: string | null;
  is_active: boolean;
  created_at: string;
}

const ShowroomManagement = () => {
  const [showrooms, setShowrooms] = useState<Showroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    business_name: "",
    contact_person: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    gst_number: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    loadShowrooms();
  }, []);

  const loadShowrooms = async () => {
    try {
      const { data, error } = await supabase
        .from('showrooms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShowrooms(data || []);
    } catch (error) {
      console.error('Error loading showrooms:', error);
      toast({
        title: "Error",
        description: "Failed to load showrooms",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('create-showroom', {
        body: {
          email: formData.email,
          password: formData.password,
          business_name: formData.business_name,
          contact_person: formData.contact_person,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          gst_number: formData.gst_number || null,
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (response.error) throw new Error(response.error.message);
      
      const result = await response.data;
      if (result.error) throw new Error(result.error);

      toast({
        title: "Success",
        description: "Showroom created successfully",
      });

      setIsOpen(false);
      setFormData({
        email: "",
        password: "",
        business_name: "",
        contact_person: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        gst_number: "",
      });
      loadShowrooms();
    } catch (error: any) {
      console.error('Error creating showroom:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create showroom",
        variant: "destructive",
      });
    }
  };

  const toggleShowroomStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('showrooms')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Showroom ${!currentStatus ? 'activated' : 'deactivated'}`,
      });

      loadShowrooms();
    } catch (error) {
      console.error('Error updating showroom:', error);
      toast({
        title: "Error",
        description: "Failed to update showroom status",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Showroom Management</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Showroom
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Showroom</DialogTitle>
              <DialogDescription>
                Enter showroom details and login credentials
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business_name">Business Name *</Label>
                  <Input
                    id="business_name"
                    required
                    value={formData.business_name}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_person">Contact Person *</Label>
                  <Input
                    id="contact_person"
                    required
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gst_number">GST Number</Label>
                  <Input
                    id="gst_number"
                    value={formData.gst_number}
                    onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Textarea
                  id="address"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full">Create Showroom</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Business Name</TableHead>
            <TableHead>Contact Person</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>City</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {showrooms.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No showrooms yet
              </TableCell>
            </TableRow>
          ) : (
            showrooms.map((showroom) => (
              <TableRow key={showroom.id}>
                <TableCell className="font-medium">{showroom.business_name}</TableCell>
                <TableCell>{showroom.contact_person}</TableCell>
                <TableCell>{showroom.phone}</TableCell>
                <TableCell>{showroom.city}</TableCell>
                <TableCell>
                  <Badge variant={showroom.is_active ? "default" : "secondary"}>
                    {showroom.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleShowroomStatus(showroom.id, showroom.is_active)}
                  >
                    {showroom.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ShowroomManagement;