import React from "react";
import { createBrowserRouter } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import Layout from "./pages/Layout";
import Dashboard from "./pages/Dashboard";
import TransactionsPage from "./pages/TransactionsPage";
import ReportsPage from "./pages/ReportsPage";
import BudgetsPage from "./pages/BudgetsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "transactions",
        element: <TransactionsPage />,
      },
      {
        path: "reports",
        element: <ReportsPage />,
      },
      {
        path: "budgets",
        element: <BudgetsPage />,
      },
    ],
  },
]);
