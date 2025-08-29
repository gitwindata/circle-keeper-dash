import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  Settings as SettingsIcon, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  Download, 
  Upload,
  Database,
  Scissors,
  Clock,
  DollarSign,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { dataService } from "@/services/dataService";
import { Service, ServiceCategory } from "@/types";
import { formatCurrency, getCategoryColor } from "@/utils/dataUtils";
import { serviceFormSchema, ServiceFormData, validateFormData } from "@/schemas/validation";

const Settings = () => {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [isAddServiceDialogOpen, setIsAddServiceDialogOpen] = useState(false);
  const [isEditServiceDialogOpen, setIsEditServiceDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  
  // Form states
  const [newService, setNewService] = useState<ServiceFormData>({
    name: "",
    description: "",
    duration: 60,
    basePrice: 150000,
    category: "haircut"
  });

  const [editService, setEditService] = useState<ServiceFormData>({
    name: "",
    description: "",
    duration: 60,
    basePrice: 150000,
    category: "haircut"
  });

  // Business settings
  const [businessSettings, setBusinessSettings] = useState({
    businessName: "Hair Management System",
    address: "Jakarta, Indonesia",
    phone: "+62 812 3456 7890",
    email: "info@hms.com",
    currency: "IDR",
    timezone: "Asia/Jakarta"
  });

  const [dataStats, setDataStats] = useState({
    totalUsers: 0,
    totalAppointments: 0,
    totalServices: 0,
    storageUsed: 0
  });

  useEffect(() => {
    loadServices();
    loadDataStats();
  }, []);

  const loadServices = () => {
    const servicesData = dataService.getServices();
    setServices(servicesData);
  };

  const loadDataStats = () => {
    const users = dataService.getUsers();
    const appointments = dataService.getAppointments();
    const services = dataService.getServices();
    
    // Calculate storage usage (rough estimate)
    const storageData = {
      users: JSON.stringify(users).length,
      appointments: JSON.stringify(appointments).length,
      services: JSON.stringify(services).length
    };
    const totalBytes = Object.values(storageData).reduce((sum, size) => sum + size, 0);

    setDataStats({
      totalUsers: users.length,
      totalAppointments: appointments.length,
      totalServices: services.length,
      storageUsed: Math.round(totalBytes / 1024) // KB
    });
  };

  const handleAddService = () => {
    const validation = validateFormData(serviceFormSchema, newService);
    
    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: "Please check your input and try again.",
        variant: "destructive",
      });
      return;
    }

    const result = dataService.createService({
      name: newService.name,
      description: newService.description,
      duration: newService.duration,
      basePrice: newService.basePrice,
      category: newService.category,
      isActive: true
    });

    if (result.success) {
      loadServices();
      setIsAddServiceDialogOpen(false);
      setNewService({
        name: "",
        description: "",
        duration: 60,
        basePrice: 150000,
        category: "haircut"
      });

      toast({
        title: "Service Added",
        description: `${newService.name} has been added successfully.`,
      });
    } else {
      toast({
        title: "Error",
        description: result.message || "Failed to add service.",
        variant: "destructive",
      });
    }
  };

  const handleEditService = () => {
    if (!selectedService) return;

    const validation = validateFormData(serviceFormSchema, editService);
    
    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: "Please check your input and try again.",
        variant: "destructive",
      });
      return;
    }

    const result = dataService.updateService(selectedService.id, {
      name: editService.name,
      description: editService.description,
      duration: editService.duration,
      basePrice: editService.basePrice,
      category: editService.category
    });

    if (result.success) {
      loadServices();
      setIsEditServiceDialogOpen(false);
      setSelectedService(null);

      toast({
        title: "Service Updated",
        description: `${editService.name} has been updated successfully.`,
      });
    } else {
      toast({
        title: "Error",
        description: result.message || "Failed to update service.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (service: Service) => {
    setSelectedService(service);
    setEditService({
      name: service.name,
      description: service.description || "",
      duration: service.duration,
      basePrice: service.basePrice,
      category: service.category
    });
    setIsEditServiceDialogOpen(true);
  };

  const toggleServiceStatus = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      dataService.updateService(serviceId, { isActive: !service.isActive });
      loadServices();
      
      toast({
        title: "Service Updated",
        description: `${service.name} has been ${service.isActive ? 'deactivated' : 'activated'}.`,
      });
    }
  };

  const exportData = () => {
    const allData = {
      users: dataService.getUsers(),
      appointments: dataService.getAppointments(),
      services: dataService.getServices(),
      exportedAt: new Date().toISOString()
    };

    const dataStr = JSON.stringify(allData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `hms_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Data Exported",
      description: "All HMS data has been exported successfully.",
    });
  };

  const clearAllData = () => {
    if (confirm("Are you sure you want to clear all data? This action cannot be undone.")) {
      dataService.clearAllData();
      loadServices();
      loadDataStats();
      
      toast({
        title: "Data Cleared",
        description: "All HMS data has been cleared.",
        variant: "destructive",
      });
    }
  };

  const saveLegacyData = () => {
    // Migrate legacy data to new structure
    const legacyMembers = dataService.getLegacyMembers();
    const legacyHairstylists = dataService.getLegacyHairstylists();
    
    let migratedCount = 0;
    
    // Migrate legacy members
    legacyMembers.forEach(member => {
      const existingUser = dataService.getUserByEmail(`${member.whatsapp}@member.hms`);
      if (!existingUser) {
        dataService.createUser({
          email: `${member.whatsapp}@member.hms`,
          role: 'member',
          profile: {
            fullName: member.fullName,
            whatsappNumber: member.whatsapp,
            instagramHandle: member.instagram,
            joinDate: new Date().toISOString().split('T')[0],
            preferences: {
              preferredServices: [member.service],
              notes: member.memberComment
            },
            photos: {
              beforePhotos: [],
              afterPhotos: []
            }
          }
        });
        migratedCount++;
      }
    });

    loadDataStats();
    
    toast({
      title: "Legacy Data Migrated",
      description: `${migratedCount} records have been migrated to the new data structure.`,
    });
  };

  const serviceCategories: { value: ServiceCategory; label: string }[] = [
    { value: 'haircut', label: 'Haircut' },
    { value: 'styling', label: 'Hair Styling' },
    { value: 'treatment', label: 'Hair Treatment' },
    { value: 'coloring', label: 'Hair Coloring' },
    { value: 'beard', label: 'Beard Care' },
    { value: 'wash', label: 'Hair Wash' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage HMS configuration, services, and data
          </p>
        </div>
      </div>

      <Tabs defaultValue="services" className="space-y-4">
        <TabsList>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="data">Data Management</TabsTrigger>
        </TabsList>

        {/* Services Management Tab */}
        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Services Management</CardTitle>
                  <CardDescription>
                    Manage available services, pricing, and categories
                  </CardDescription>
                </div>
                <Button onClick={() => setIsAddServiceDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Base Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{service.name}</div>
                            {service.description && (
                              <div className="text-sm text-muted-foreground">
                                {service.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getCategoryColor(service.category)}>
                            {service.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {service.duration}m
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(service.basePrice)}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={service.isActive}
                            onCheckedChange={() => toggleServiceStatus(service.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(service)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Settings Tab */}
        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>
                Configure your business details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={businessSettings.businessName}
                    onChange={(e) => setBusinessSettings(prev => ({
                      ...prev,
                      businessName: e.target.value
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessPhone">Phone</Label>
                  <Input
                    id="businessPhone"
                    value={businessSettings.phone}
                    onChange={(e) => setBusinessSettings(prev => ({
                      ...prev,
                      phone: e.target.value
                    }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessAddress">Address</Label>
                <Textarea
                  id="businessAddress"
                  value={businessSettings.address}
                  onChange={(e) => setBusinessSettings(prev => ({
                    ...prev,
                    address: e.target.value
                  }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessEmail">Email</Label>
                  <Input
                    id="businessEmail"
                    type="email"
                    value={businessSettings.email}
                    onChange={(e) => setBusinessSettings(prev => ({
                      ...prev,
                      email: e.target.value
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={businessSettings.currency} onValueChange={(value) => 
                    setBusinessSettings(prev => ({ ...prev, currency: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IDR">Indonesian Rupiah (IDR)</SelectItem>
                      <SelectItem value="USD">US Dollar (USD)</SelectItem>
                      <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button className="w-full md:w-auto">
                <Save className="h-4 w-4 mr-2" />
                Save Business Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Management Tab */}
        <TabsContent value="data" className="space-y-4">
          {/* Data Statistics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dataStats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Across all roles
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Appointments</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dataStats.totalAppointments}</div>
                <p className="text-xs text-muted-foreground">
                  All time records
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Services</CardTitle>
                <Scissors className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dataStats.totalServices}</div>
                <p className="text-xs text-muted-foreground">
                  Available services
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dataStats.storageUsed} KB</div>
                <p className="text-xs text-muted-foreground">
                  Local storage
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Data Operations */}
          <Card>
            <CardHeader>
              <CardTitle>Data Operations</CardTitle>
              <CardDescription>
                Backup, restore, and manage your HMS data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button onClick={exportData} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export All Data
                </Button>
                
                <Button onClick={saveLegacyData} variant="outline">
                  <Database className="h-4 w-4 mr-2" />
                  Migrate Legacy Data
                </Button>
                
                <Button onClick={clearAllData} variant="destructive">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Clear All Data
                </Button>
              </div>
              
              <div className="p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">Data Structure Information</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  HMS now uses a centralized data structure with the following features:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Normalized data relationships</li>
                  <li>• Type-safe validation with Zod schemas</li>
                  <li>• Centralized data service with API-like interface</li>
                  <li>• Backward compatibility with legacy data</li>
                  <li>• Enhanced business analytics and reporting</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Service Dialog */}
      <Dialog open={isAddServiceDialogOpen} onOpenChange={setIsAddServiceDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Service</DialogTitle>
            <DialogDescription>
              Create a new service offering for HMS.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Service Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Premium Haircut"
                  value={newService.name}
                  onChange={(e) => setNewService(prev => ({...prev, name: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={newService.category} onValueChange={(value: ServiceCategory) => 
                  setNewService(prev => ({...prev, category: value}))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceCategories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the service..."
                value={newService.description}
                onChange={(e) => setNewService(prev => ({...prev, description: e.target.value}))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="60"
                  value={newService.duration}
                  onChange={(e) => setNewService(prev => ({...prev, duration: parseInt(e.target.value) || 0}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="basePrice">Base Price (IDR)</Label>
                <Input
                  id="basePrice"
                  type="number"
                  placeholder="150000"
                  value={newService.basePrice}
                  onChange={(e) => setNewService(prev => ({...prev, basePrice: parseInt(e.target.value) || 0}))}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddServiceDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddService}>
              Add Service
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Service Dialog */}
      <Dialog open={isEditServiceDialogOpen} onOpenChange={setIsEditServiceDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>
              Update service information for {selectedService?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Service Name</Label>
                <Input
                  id="edit-name"
                  placeholder="e.g. Premium Haircut"
                  value={editService.name}
                  onChange={(e) => setEditService(prev => ({...prev, name: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select value={editService.category} onValueChange={(value: ServiceCategory) => 
                  setEditService(prev => ({...prev, category: value}))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceCategories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Describe the service..."
                value={editService.description}
                onChange={(e) => setEditService(prev => ({...prev, description: e.target.value}))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-duration">Duration (minutes)</Label>
                <Input
                  id="edit-duration"
                  type="number"
                  placeholder="60"
                  value={editService.duration}
                  onChange={(e) => setEditService(prev => ({...prev, duration: parseInt(e.target.value) || 0}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-basePrice">Base Price (IDR)</Label>
                <Input
                  id="edit-basePrice"
                  type="number"
                  placeholder="150000"
                  value={editService.basePrice}
                  onChange={(e) => setEditService(prev => ({...prev, basePrice: parseInt(e.target.value) || 0}))}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditServiceDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditService}>
              Update Service
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;