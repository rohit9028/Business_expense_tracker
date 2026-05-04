import React, { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../components/ui/alert-dialog";
import { Progress } from "../components/ui/progress";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { EXPENSE_CATEGORIES } from "../types";
import { toast } from "sonner";
import { format } from "date-fns";

export default function BudgetsPage() {
  const { budgets, transactions, addBudget, deleteBudget } = useApp();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState("");
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));

  // Calculate spending for each budget
  const budgetData = useMemo(() => {
    return budgets.map((budget) => {
      const spent = transactions
        .filter(
          (t) =>
            t.type === "expense" &&
            t.category === budget.category &&
            format(new Date(t.date), "yyyy-MM") === budget.month
        )
        .reduce((sum, t) => sum + t.amount, 0);

      const percentage = (spent / budget.limit) * 100;
      const remaining = budget.limit - spent;

      return {
        ...budget,
        spent,
        percentage: Math.min(percentage, 100),
        remaining,
        isOverBudget: spent > budget.limit,
      };
    });
  }, [budgets, transactions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!category || !limit) {
      toast.error("Please fill all fields");
      return;
    }

    // Check if budget already exists for this category and month
    const exists = budgets.some(
      (b) => b.category === category && b.month === month
    );

    if (exists) {
      toast.error("Budget already exists for this category and month");
      return;
    }

    addBudget({
      category,
      limit: parseFloat(limit),
      month,
    });

    toast.success("Budget created successfully");
    setCategory("");
    setLimit("");
    setMonth(format(new Date(), "yyyy-MM"));
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteBudget(id);
    toast.success("Budget deleted");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl">Budget Management</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Set Budget
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set Budget</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="limit">Budget Limit (₹) *</Label>
                <Input
                  id="limit"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="month">Month</Label>
                <Input
                  id="month"
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Set Budget
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Budgets List */}
      {budgetData.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-400">
              <p>No budgets set yet</p>
              <p className="text-sm mt-2">
                Create a budget to track your spending limits
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {budgetData.map((budget) => (
            <Card key={budget.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{budget.category}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {format(new Date(budget.month + "-01"), "MMMM yyyy")}
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Budget</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this budget?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(budget.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Spent</span>
                    <span className={budget.isOverBudget ? "text-red-600" : ""}>
                      ₹{budget.spent.toLocaleString()} / ₹
                      {budget.limit.toLocaleString()}
                    </span>
                  </div>
                  <Progress
                    value={budget.percentage}
                    className={
                      budget.isOverBudget
                        ? "[&>div]:bg-red-500"
                        : budget.percentage > 80
                        ? "[&>div]:bg-amber-500"
                        : ""
                    }
                  />
                  <p className="text-xs text-gray-500">
                    {budget.percentage.toFixed(1)}% used
                  </p>
                </div>

                {budget.isOverBudget ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-red-900 font-medium">Over Budget!</p>
                      <p className="text-red-700">
                        Exceeded by ₹{Math.abs(budget.remaining).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-900">
                      <span className="font-medium">
                        ₹{budget.remaining.toLocaleString()}
                      </span>{" "}
                      remaining
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
