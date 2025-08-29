
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MemberData {
  name: string;
  whatsapp: string;
  joinDate: string;
  status: string;
}

const CircleDashboard = () => {
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [comment, setComment] = useState("");
  const [beforePhoto, setBeforePhoto] = useState<string | null>(null);
  const [afterPhoto, setAfterPhoto] = useState<string | null>(null);
  const navigate = useNavigate();

  // Mock last visit data
  const lastVisit = {
    date: "January 15, 2024",
    stylist: "Ahmad Rahman",
    service: "Precision Cut & Beard Sculpting"
  };

  useEffect(() => {
    const storedData = localStorage.getItem("hms_member_data");
    if (storedData) {
      setMemberData(JSON.parse(storedData));
    }

    // Load saved data
    const savedComment = localStorage.getItem("hms_member_comment");
    const savedBeforePhoto = localStorage.getItem("hms_member_before_photo");
    const savedAfterPhoto = localStorage.getItem("hms_member_after_photo");

    if (savedComment) setComment(savedComment);
    if (savedBeforePhoto) setBeforePhoto(savedBeforePhoto);
    if (savedAfterPhoto) setAfterPhoto(savedAfterPhoto);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("hms_member_data");
    navigate("/circle");
  };

  const handleCommentSave = () => {
    localStorage.setItem("hms_member_comment", comment);
  };

  const handlePhotoUpload = (type: 'before' | 'after') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (type === 'before') {
          setBeforePhoto(result);
          localStorage.setItem("hms_member_before_photo", result);
        } else {
          setAfterPhoto(result);
          localStorage.setItem("hms_member_after_photo", result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const firstName = memberData?.name?.split(' ')[0] || '';

  return (
    <div className="min-h-screen text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/hms logo white.svg" alt="HMS Logo" className="h-24 w-24" />
            <span className="text-lg font-medium">The Circle</span>
          </div>
          <Button 
            variant="ghost" 
            onClick={handleLogout}
            className="text-gray-300 hover:text-white"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Exit
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Welcome Section */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-light">Welcome back, {firstName}.</h1>
          <p className="text-gray-300 text-lg">
            Status: {memberData?.status} since {memberData?.joinDate}
          </p>
        </div>

        {/* Last Visit Section */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Your Last Visit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-gray-400 text-sm">Date</p>
                <p className="text-white font-medium">{lastVisit.date}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Stylist</p>
                <p className="text-white font-medium">{lastVisit.stylist}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Service</p>
                <p className="text-white font-medium">{lastVisit.service}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Photo Upload Section */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Upload Your Look</CardTitle>
            <CardDescription className="text-gray-300">
              Share your before and after transformation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Before Photo */}
              <div className="space-y-3">
                <Label className="text-gray-300">Before</Label>
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                  {beforePhoto ? (
                    <img 
                      src={beforePhoto} 
                      alt="Before" 
                      className="max-w-full h-48 object-cover rounded mx-auto"
                    />
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                      <p className="text-gray-400">Upload before photo</p>
                    </div>
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload('before')}
                    className="mt-3"
                  />
                </div>
              </div>

              {/* After Photo */}
              <div className="space-y-3">
                <Label className="text-gray-300">After</Label>
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                  {afterPhoto ? (
                    <img 
                      src={afterPhoto} 
                      alt="After" 
                      className="max-w-full h-48 object-cover rounded mx-auto"
                    />
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                      <p className="text-gray-400">Upload after photo</p>
                    </div>
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload('after')}
                    className="mt-3"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Member Comment Section */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Leave a Comment</CardTitle>
            <CardDescription className="text-gray-300">
              Tell us how your last visit felt — thoughts, preferences, or just a note.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was your experience? Any feedback for your stylist?"
              className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-amber-600 focus:ring-amber-600 min-h-[120px]"
            />
            <Button 
              onClick={handleCommentSave}
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-none border-none"
            >
              Send Feedback to HMS
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-gray-400 text-sm pt-8 border-t border-gray-800">
          <p>Need to update your next session? Contact your stylist directly.</p>
        </div>
      </div>
    </div>
  );
};

export default CircleDashboard;
