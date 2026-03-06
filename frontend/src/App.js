import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import LandingPage from "@/pages/LandingPage";
import ChatPage from "@/pages/ChatPage";
import SummaryPage from "@/pages/SummaryPage";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminCaseDetail from "@/pages/AdminCaseDetail";

function App() {
  return (
    <div className="App min-h-screen bg-background">
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:sessionToken" element={<ChatPage />} />
          <Route path="/summary/:sessionToken" element={<SummaryPage />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/cases/:caseReference" element={<AdminCaseDetail />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
