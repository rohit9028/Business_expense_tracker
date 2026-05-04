import React from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
}

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  iconColor,
  bgColor 
}: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">{title}</p>
            <p className="text-2xl">{value}</p>
          </div>
          <div className={`w-12 h-12 ${bgColor} rounded-full flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
