import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Home, Users, LogOut } from 'lucide-react'; // Added LogOut icon
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button'; // Explicitly import Button

const HairstylistLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('hms_hairstylist_token');
    localStorage.removeItem('hms_hairstylist_id');
    navigate('/hairstylist/login');
  };

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link to="/hairstylist/dashboard" className="flex items-center gap-2 font-semibold">
              <span className="">Hairstylist Panel</span>
            </Link>
          </div>
          <div className="flex-1">
            <ScrollArea className="h-full px-3 py-2">
              <nav className="grid items-start gap-2 text-sm font-medium lg:px-4">
                <Link
                  to="/hairstylist/dashboard/my-members"
                  className={cn(
                    buttonVariants({ variant: 'ghost' }),
                    'w-full justify-start',
                    location.pathname === '/hairstylist/dashboard/my-members' && 'bg-muted hover:bg-muted'
                  )}
                >
                  <Home className="h-4 w-4 mr-2" />
                  Member yang Saya Tangani
                </Link>
                <Link
                  to="/hairstylist/dashboard/all-members"
                  className={cn(
                    buttonVariants({ variant: 'ghost' }),
                    'w-full justify-start',
                    location.pathname === '/hairstylist/dashboard/all-members' && 'bg-muted hover:bg-muted'
                  )}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Semua Biodata Member
                </Link>
              </nav>
            </ScrollArea>
          </div>
          <div className="mt-auto p-4">
            <Button onClick={handleLogout} className="w-full" variant="secondary">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          {/* Mobile sidebar toggle can go here if needed */}
          <h1 className="text-lg font-semibold md:text-2xl">Dashboard Hairstylist</h1>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <Outlet /> {/* This is where nested routes will render */}
        </main>
      </div>
    </div>
  );
};

export default HairstylistLayout;
