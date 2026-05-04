import React, { useMemo } from "react";
import { useApp } from "../context/AppContext";
import CategoryPieChart from "../components/CategoryPieChart";
import MonthlyBarChart from "../components/MonthlyBarChart";
import TrendLineChart from "../components/TrendLineChart";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Download, FileText } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function ReportsPage() {
  const { transactions } = useApp();

  // Category-wise data
  const expenseCategoryData = useMemo(() => {
    const categoryMap = new Map<string, number>();
    
    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const current = categoryMap.get(t.category) || 0;
        categoryMap.set(t.category, current + t.amount);
      });

    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const incomeCategoryData = useMemo(() => {
    const categoryMap = new Map<string, number>();
    
    transactions
      .filter((t) => t.type === "income")
      .forEach((t) => {
        const current = categoryMap.get(t.category) || 0;
        categoryMap.set(t.category, current + t.amount);
      });

    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  // Monthly trend data
  const monthlyData = useMemo(() => {
    const monthMap = new Map<string, { income: number; expense: number }>();
    
    transactions.forEach((t) => {
      const month = format(new Date(t.date), "MMM yyyy");
      const current = monthMap.get(month) || { income: 0, expense: 0 };
      
      if (t.type === "income") {
        current.income += t.amount;
      } else {
        current.expense += t.amount;
      }
      
      monthMap.set(month, current);
    });

    return Array.from(monthMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      });
  }, [transactions]);

  // Expense trend
  const expenseTrendData = useMemo(() => {
    return monthlyData.map((d) => ({
      month: d.month,
      amount: d.expense,
    }));
  }, [monthlyData]);

  // Income trend
  const incomeTrendData = useMemo(() => {
    return monthlyData.map((d) => ({
      month: d.month,
      amount: d.income,
    }));
  }, [monthlyData]);

  // Export to CSV
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = ["Date", "Type", "Category", "Amount", "Note"];
    const rows = transactions.map((t) => [
      format(new Date(t.date), "yyyy-MM-dd"),
      t.type,
      t.category,
      t.amount.toString(),
      t.note,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expense-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("Report exported successfully");
  };

  // Export to JSON
  const handleExportJSON = () => {
    if (transactions.length === 0) {
      toast.error("No data to export");
      return;
    }

    const json = JSON.stringify(transactions, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expense-report-${format(new Date(), "yyyy-MM-dd")}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("Report exported successfully");
  };

  // Calculate summary stats
  const stats = useMemo(() => {
    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const avgIncome = transactions.filter((t) => t.type === "income").length
      ? totalIncome / transactions.filter((t) => t.type === "income").length
      : 0;

    const avgExpense = transactions.filter((t) => t.type === "expense").length
      ? totalExpense / transactions.filter((t) => t.type === "expense").length
      : 0;

    return { totalIncome, totalExpense, avgIncome, avgExpense };
  }, [transactions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl">Reports & Analytics</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={handleExportJSON}>
            <FileText className="w-4 h-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl text-green-600">
              ₹{stats.totalIncome.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Total Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl text-red-600">
              ₹{stats.totalExpense.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Avg Income</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl">
              ₹{stats.avgIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Avg Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl">
              ₹{stats.avgExpense.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryPieChart 
          data={expenseCategoryData} 
          title="Expense Distribution" 
        />
        <CategoryPieChart 
          data={incomeCategoryData} 
          title="Income Distribution" 
        />
      </div>

      {/* Monthly Comparison */}
      <MonthlyBarChart data={monthlyData} />

      {/* Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendLineChart 
          data={expenseTrendData} 
          title="Expense Trend" 
          color="#ef4444"
        />
        <TrendLineChart 
          data={incomeTrendData} 
          title="Income Trend" 
          color="#10b981"
        />
      </div>
    </div>
  );
}
