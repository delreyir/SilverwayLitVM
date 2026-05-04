import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "./components/dex/Layout";
import SwapPage from "./pages/SwapPage";
import PoolsPage from "./pages/PoolsPage";
import BridgePage from "./pages/BridgePage";
import StatsPage from "./pages/StatsPage";
import DashboardPage from "./pages/DashboardPage";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<SwapPage />} />
            <Route path="/pools" element={<PoolsPage />} />
            <Route path="/bridge" element={<BridgePage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
