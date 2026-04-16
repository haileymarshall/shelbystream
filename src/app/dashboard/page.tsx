import DashboardPage from "@/components/dashboard/DashboardPage";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

export default function Dashboard() {
  return <DashboardPage />;
}
