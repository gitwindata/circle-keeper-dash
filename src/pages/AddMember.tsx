
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";

const AddMember = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fullName: "",
    whatsapp: "",
    instagram: "",
    lastVisit: "",
    stylist: "",
    service: "",
    stylistComment: "",
    memberComment: ""
  });

  const stylists = ["Ahmad Rahman", "Sarah Johnson", "Michael Brown"];
  const services = ["Haircut", "Beard Trim", "Hair Wash", "Styling", "Shampoo & Blow Dry"];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate saving to backend
    console.log("Saving member:", formData);
    
    toast({
      title: "Member Added",
      description: `${formData.fullName} has been added to The Circle successfully.`,
    });

    // Reset form
    setFormData({
      fullName: "",
      whatsapp: "",
      instagram: "",
      lastVisit: "",
      stylist: "",
      service: "",
      stylistComment: "",
      memberComment: ""
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard/members">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Members
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Add New Member</h2>
          <p className="text-muted-foreground">
            Add a new member to The Circle
          </p>
        </div>
      </div>

            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>Member Information</CardTitle>
                <CardDescription>
                  Fill in the details for the new Circle member
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        placeholder="Enter full name"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange("fullName", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp Number *</Label>
                      <Input
                        id="whatsapp"
                        placeholder="+6281234567890"
                        value={formData.whatsapp}
                        onChange={(e) => handleInputChange("whatsapp", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="instagram">Instagram Handle</Label>
                      <Input
                        id="instagram"
                        placeholder="@username"
                        value={formData.instagram}
                        onChange={(e) => handleInputChange("instagram", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastVisit">Last Visit Date</Label>
                      <Input
                        id="lastVisit"
                        type="date"
                        value={formData.lastVisit}
                        onChange={(e) => handleInputChange("lastVisit", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stylist">Hairstylist</Label>
                      <Select value={formData.stylist} onValueChange={(value) => handleInputChange("stylist", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select stylist" />
                        </SelectTrigger>
                        <SelectContent>
                          {stylists.map(stylist => (
                            <SelectItem key={stylist} value={stylist}>{stylist}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="service">Service Received</Label>
                      <Select value={formData.service} onValueChange={(value) => handleInputChange("service", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select service" />
                        </SelectTrigger>
                        <SelectContent>
                          {services.map(service => (
                            <SelectItem key={service} value={service}>{service}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stylistComment">Stylist Comment</Label>
                    <Textarea
                      id="stylistComment"
                      placeholder="Internal notes about client preferences..."
                      value={formData.stylistComment}
                      onChange={(e) => handleInputChange("stylistComment", e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="memberComment">Member Comment</Label>
                    <Textarea
                      id="memberComment"
                      placeholder="Member feedback or comments..."
                      value={formData.memberComment}
                      onChange={(e) => handleInputChange("memberComment", e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button type="submit" className="flex-1">
                      Add Member
                    </Button>
                    <Button type="button" variant="outline" asChild>
                      <Link to="/dashboard/members">Cancel</Link>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
    </div>
  );
};

export default AddMember;
