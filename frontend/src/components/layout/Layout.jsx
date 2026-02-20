import { Outlet } from "react-router-dom";
import { Header } from "@/components/layout/Navbar";

export function RootLayout() {
  return (
    <div className="min-h-dvh flex flex-col bg-warm-100">
      <Header />
      <Outlet />
    </div>
  );
}
