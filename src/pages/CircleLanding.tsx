
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CircleLanding = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white flex flex-col relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-y-12"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/10 to-transparent"></div>
      </div>
      
      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center px-4 relative z-10">
        <div className="text-center max-w-4xl">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 mb-8">
            <span className="text-amber-400 text-sm font-medium tracking-wide uppercase">Exclusive Membership</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-8 leading-tight bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
            Not everyone gets in.<br />
            <span className="text-amber-400">But those who do, never leave.</span>
          </h1>
          
          <div className="mb-12 text-gray-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            <p className="backdrop-blur-sm">
              The Circle is a curated membership program for HMS clients, <br />
              offering elevated experiences and personal privileges. <br /> 
              <span className="text-amber-400 font-medium">This is where precision meets exclusivity.</span>
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
            <Link to="/login">
              <Button 
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-8 py-6 text-lg font-medium rounded-lg border-none shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                size="lg"
              >
                ✨ Access Your Circle
              </Button>
            </Link>
            <a href="https://www.instagram.com/haijoelmenssalon/" target="_blank" rel="noopener noreferrer">
              <Button 
                variant="outline"
                className="text-black px-8 py-6 text-lg font-medium rounded-lg border-2 border-gray-600"
                size="lg"
              >
                📸 Visit Instagram
              </Button>
            </a>
          </div>
          
          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-3xl mx-auto">
            <div className="text-center p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
              <div className="text-3xl mb-3">💎</div>
              <h3 className="text-lg font-semibold text-white mb-2">Premium Services</h3>
              <p className="text-gray-400 text-sm">Exclusive treatments & personalized care</p>
            </div>
            <div className="text-center p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="text-lg font-semibold text-white mb-2">Priority Booking</h3>
              <p className="text-gray-400 text-sm">Skip the wait, book your preferred time</p>
            </div>
            <div className="text-center p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
              <div className="text-3xl mb-3">👑</div>
              <h3 className="text-lg font-semibold text-white mb-2">VIP Experience</h3>
              <p className="text-gray-400 text-sm">Rewards, perks & exclusive events</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="p-6 text-center border-t border-gray-800/50 bg-black/20 backdrop-blur-sm relative z-10">
        <div className="flex items-center justify-center gap-3 text-gray-400">
          <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">H</span>
          </div>
          <span className="text-sm uppercase tracking-wider font-medium">Haijoel Men's Salon</span>
          <div className="h-1 w-1 bg-amber-500 rounded-full"></div>
          <span className="text-xs text-gray-500">The Circle Membership</span>
        </div>
      </footer>
    </div>
  );
};

export default CircleLanding;
