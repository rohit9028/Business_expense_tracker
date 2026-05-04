import React, { useMemo } from "react";
import { useApp } from "../context/AppContext";
import StatsCard from "../components/StatsCard";
import CategoryPieChart from "../components/CategoryPieChart";
import MonthlyBarChart from "../components/MonthlyBarChart";
import AddTransactionDialog from "../components/AddTransactionDialog";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { TrendingUp, TrendingDown, Wallet, ArrowRight } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { transactions } = useApp();

  // Calculate stats
  const stats = useMemo(() => {
    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = totalIncome - totalExpense;

    return { totalIncome, totalExpense, balance };
  }, [transactions]);

  // Category-wise expense data
  const categoryData = useMemo(() => {
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

  // Monthly data for bar chart
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
      })
      .slice(-6); // Last 6 months
  }, [transactions]);

  // Recent transactions
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl">Dashboard</h1>
        <AddTransactionDialog />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Total Income"
          value={`₹${stats.totalIncome.toLocaleString()}`}
          icon={TrendingUp}
          iconColor="text-green-600"
          bgColor="bg-green-100"
        />
        <StatsCard
          title="Total Expense"
          value={`₹${stats.totalExpense.toLocaleString()}`}
          icon={TrendingDown}
          iconColor="text-red-600"
          bgColor="bg-red-100"
        />
        <StatsCard
          title="Balance"
          value={`₹${stats.balance.toLocaleString()}`}
          icon={Wallet}
          iconColor={stats.balance >= 0 ? "text-blue-600" : "text-red-600"}
          bgColor={stats.balance >= 0 ? "bg-blue-100" : "bg-red-100"}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryPieChart 
          data={categoryData} 
          title="Expense by Category" 
        />
        <MonthlyBarChart data={monthlyData} />
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === "income"
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      <ArrowRight
                        className={`w-5 h-5 ${
                          transaction.type === "income" ? "rotate-[-45deg]" : "rotate-45"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="font-medium">{transaction.category}</p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(transaction.date), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`${
                      transaction.type === "income" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "-"}₹
                    {transaction.amount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
