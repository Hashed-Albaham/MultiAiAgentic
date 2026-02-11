import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import Index from "./pages/Index";
import AgentsPage from "./pages/AgentsPage";
import ChatPage from "./pages/ChatPage";
import PipelinePage from "./pages/PipelinePage";
import ComparePage from "./pages/ComparePage";
import DialoguePage from "./pages/DialoguePage";
import SettingsPage from "./pages/SettingsPage";
import ApiDocsPage from "./pages/ApiDocsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/agents" element={<AgentsPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/pipeline" element={<PipelinePage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/dialogue" element={<DialoguePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/api-docs" element={<ApiDocsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
