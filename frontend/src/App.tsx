import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "./components/Navigation";
import Dashboard from "./pages/Dashboard";
import Fonti from "./pages/Fonti";
import NuovaEntrata from "./pages/NuovaEntrata";
import NuovaSpesa from "./pages/NuovaSpesa";
import Trasferimenti from "./pages/Trasferimenti";
import Report from "./pages/Report";
import Storico from "./pages/Storico";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/fonti" element={<Fonti />} />
          <Route path="/entrata" element={<NuovaEntrata />} />
          <Route path="/spesa" element={<NuovaSpesa />} />
          <Route path="/trasferimenti" element={<Trasferimenti />} />
          <Route path="/report" element={<Report />} />
          <Route path="/storico" element={<Storico />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
