
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const CircleLogin = () => {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Store member data locally
    const memberData = {
      name,
      whatsapp,
      joinDate: "March 2024",
      status: "Inner Circle Member"
    };
    
    localStorage.setItem("hms_member_data", JSON.stringify(memberData));
    
    // Simulate loading
    setTimeout(() => {
      navigate("/circle/dashboard");
    }, 1000);
  };

  return (
    <div className="min-h-screen text-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-black-600/20 rounded-full">
              <img src="/hms logo white.svg" alt="HMS Logo" className="h-36 w-36" />
            </div>
          </div>
          <CardTitle className="text-2xl font-light text-white">The Circle</CardTitle>
          <CardDescription className="text-gray-300 mt-4">
            This space is reserved. If you were invited, you already know.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-300">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-amber-600 focus:ring-amber-600"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp" className="text-gray-300">WhatsApp Number</Label>
              <Input
                id="whatsapp"
                type="tel"
                placeholder="+62 812 3456 7890"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                required
                className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-amber-600 focus:ring-amber-600"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-amber-600 hover:bg-amber-700 text-white py-6 rounded-none border-none font-medium"
              disabled={isLoading}
            >
              {isLoading ? "Entering..." : "Enter The Circle"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CircleLogin;
