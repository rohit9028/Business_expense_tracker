import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import { useApp } from "../context/AppContext";
import { Button } from "../components/ui/button";
import { 
  LayoutDashboard, 
  Receipt, 
  BarChart3, 
  Wallet, 
  LogOut,
  PiggyBank
} from "lucide-react";

export default function Layout() {
  const { user, logout } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!user) {
    return null;
  }

  const navItems = [
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/transactions", icon: Receipt, label: "Transactions" },
    { path: "/reports", icon: BarChart3, label: "Reports" },
    { path: "/budgets", icon: PiggyBank, label: "Budgets" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Wallet className="w-8 h-8 text-indigo-600" />
              <span className="text-xl">Expense Tracker</span>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Welcome, {user.name}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 md:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Button
                key={item.path}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => navigate(item.path)}
                className="whitespace-nowrap"
              >
                <Icon className="w-4 h-4 mr-2" />
                {item.label}
              </Button>
            );
          })}
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-2 mb-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Button
                key={item.path}
                variant={isActive ? "default" : "outline"}
                onClick={() => navigate(item.path)}
              >
                <Icon className="w-4 h-4 mr-2" />
                {item.label}
              </Button>
            );
          })}
        </div>

        {/* Page Content */}
        <Outlet />
      </div>
    </div>
  );
}
