import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TechnicianDashboardLayout } from '@/components/dashboard/TechnicianDashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { 
  User, 
  Clock, 
  History, 
  Bell, 
  LogOut,
  ChevronRight,
  Moon,
  Sun
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';

const settingsLinks = [
  { icon: User, label: 'Profile', path: '/technician/profile', description: 'Update your personal info' },
  { icon: Clock, label: 'Availability', path: '/technician/availability', description: 'Set your working hours' },
  { icon: History, label: 'Job History', path: '/technician/history', description: 'View completed jobs' },
];

export default function TechnicianSettings() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = React.useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <TechnicianDashboardLayout>
      <div className="p-4 md:p-6 space-y-6">
        <h1 className="text-2xl font-bold">Settings</h1>

        {/* Navigation Links */}
        <div className="space-y-2">
          {settingsLinks.map((item) => (
            <Link key={item.path} to={item.path}>
              <Card className="hover:bg-muted/50 transition-colors">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Preferences */}
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide px-1">
            Preferences
          </h2>
          
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-muted-foreground">Get notified about new jobs</p>
              </div>
              <Switch defaultChecked />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                {darkMode ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
              </div>
              <div className="flex-1">
                <p className="font-medium">Dark Mode</p>
                <p className="text-sm text-muted-foreground">Toggle dark theme</p>
              </div>
              <Switch checked={darkMode} onCheckedChange={setDarkMode} />
            </CardContent>
          </Card>
        </div>

        {/* Sign Out */}
        <Button 
          variant="destructive" 
          className="w-full"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </TechnicianDashboardLayout>
  );
}
