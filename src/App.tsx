import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { AuthProvider } from "./contexts/TokenAuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <div className="absolute top-6 left-6 z-50">
        <button
          onClick={() => {
                 if (window.parent !== window) {
                    window.parent.postMessage({ action: 'exit' }, 'https://web.mantracare.com');
                 } else {
                    window.location.href = 'https://web.mantracare.com';
                 }
                }}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-card border border-input shadow-sm text-muted-foreground hover:text-primary hover:border-primary transition-all active:scale-90"
          title="Back"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      </div>
      <BrowserRouter basename="/mood_tracker">
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
