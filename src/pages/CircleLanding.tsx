
import { Button } from "@/components/ui/button";
import { Scissors } from "lucide-react";
import { Link } from "react-router-dom";

const CircleLanding = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-light mb-8 leading-tight">
            Not everyone gets in.<br />
            But those who do, never leave.
          </h1>
          
          <div className="mb-12 text-gray-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            <p>
              The Circle is a curated membership program for HMS clients, offering elevated experiences and personal privileges. 
              This is where precision meets exclusivity.
            </p>
          </div>
          
          <Link to="/circle/login">
            <Button 
              className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-6 text-lg font-medium rounded-none border-none"
              size="lg"
            >
              Log In to Your Circle
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="p-6 text-center border-t border-gray-800">
        <div className="flex items-center justify-center gap-3 text-gray-400">
          <Scissors className="h-5 w-5" />
          <span className="text-sm uppercase tracking-wider">Haijoel Men's Salon</span>
        </div>
      </footer>
    </div>
  );
};

export default CircleLanding;
