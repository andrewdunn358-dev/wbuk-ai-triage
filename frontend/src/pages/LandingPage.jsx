import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Lock, MessageSquare, FileText, Eye, AlertTriangle } from "lucide-react";
import { createSession } from "@/lib/api";
import { toast } from "sonner";
import { useState } from "react";

export default function LandingPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleStartChat = async () => {
    setIsLoading(true);
    try {
      const session = await createSession();
      navigate(`/chat/${session.session_token}`);
    } catch (error) {
      console.error("Failed to create session:", error);
      toast.error("Failed to start session. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-teal-700" />
            <div>
              <h1 className="font-serif font-bold text-slate-900 text-lg">WBUK</h1>
              <p className="text-xs text-slate-500 -mt-1">AI Triage</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate("/admin")}
            data-testid="admin-login-link"
          >
            Advisor Login
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1710198332438-245579acbb1f?crop=entropy&cs=srgb&fm=jpg&q=85')",
          }}
        />
        <div className="absolute inset-0 hero-overlay" />
        
        <div className="relative max-w-7xl mx-auto px-4 md:px-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-teal-700/20 border border-teal-600/30 rounded-full px-4 py-2 mb-6">
              <Lock className="h-4 w-4 text-teal-400" />
              <span className="text-sm text-teal-300 font-medium">Confidential & Secure</span>
            </div>
            
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-6">
              Speak Freely.<br />
              <span className="text-teal-400">We're Listening.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-300 leading-relaxed mb-8 max-w-xl">
              Our AI-powered triage system helps you understand whether your concern 
              may qualify as a protected disclosure under UK law.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-6 text-lg"
                onClick={handleStartChat}
                disabled={isLoading}
                data-testid="start-chat-button"
              >
                {isLoading ? "Starting..." : "Start Confidential Chat"}
                <MessageSquare className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-slate-400 text-white hover:bg-white/10 px-8 py-6 text-lg"
                onClick={() => window.open("https://wbuk.org", "_blank")}
                data-testid="learn-more-button"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Security Notice */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-start gap-4 p-6 bg-slate-50 rounded-lg border border-slate-200">
            <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Important Information</h3>
              <p className="text-slate-600 leading-relaxed">
                This AI assistant provides guidance, not legal advice. Any assessment is preliminary 
                and subject to review by WBUK's qualified advisors. Your conversation is anonymous 
                and encrypted. We do not log IP addresses or store identifying information.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Our secure triage process guides you through understanding your situation
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-white border-slate-200 hover:shadow-md transition-shadow">
              <CardContent className="pt-8 pb-8 px-6 text-center">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="h-8 w-8 text-teal-700" />
                </div>
                <h3 className="font-serif font-semibold text-xl text-slate-900 mb-3">1. Share Your Concern</h3>
                <p className="text-slate-600">
                  Describe your situation to our AI assistant in a confidential, anonymous chat.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-slate-200 hover:shadow-md transition-shadow">
              <CardContent className="pt-8 pb-8 px-6 text-center">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="h-8 w-8 text-teal-700" />
                </div>
                <h3 className="font-serif font-semibold text-xl text-slate-900 mb-3">2. Get Assessment</h3>
                <p className="text-slate-600">
                  Receive a structured analysis of whether your disclosure may be legally protected.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-slate-200 hover:shadow-md transition-shadow">
              <CardContent className="pt-8 pb-8 px-6 text-center">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Eye className="h-8 w-8 text-teal-700" />
                </div>
                <h3 className="font-serif font-semibold text-xl text-slate-900 mb-3">3. Submit for Review</h3>
                <p className="text-slate-600">
                  Choose to submit your case to WBUK advisors for professional guidance and support.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Legal Framework */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                Protected Under UK Law
              </h2>
              <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                The Public Interest Disclosure Act 1998 (PIDA) provides legal protection for 
                workers who report certain types of wrongdoing. Our AI helps you understand 
                if your situation may qualify.
              </p>
              <ul className="space-y-3 text-slate-600">
                <li className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-teal-600 mt-1 flex-shrink-0" />
                  <span>Criminal offences and legal violations</span>
                </li>
                <li className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-teal-600 mt-1 flex-shrink-0" />
                  <span>Health and safety dangers</span>
                </li>
                <li className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-teal-600 mt-1 flex-shrink-0" />
                  <span>Environmental damage</span>
                </li>
                <li className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-teal-600 mt-1 flex-shrink-0" />
                  <span>Fraud and financial misconduct</span>
                </li>
                <li className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-teal-600 mt-1 flex-shrink-0" />
                  <span>Cover-ups and deliberate concealment</span>
                </li>
              </ul>
            </div>
            <div 
              className="h-80 lg:h-96 rounded-lg bg-cover bg-center"
              style={{ 
                backgroundImage: "url('https://images.unsplash.com/photo-1765375411306-9b19cb5797a3?crop=entropy&cs=srgb&fm=jpg&q=85')",
              }}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Speak Up?
          </h2>
          <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
            Your courage could protect others. Start your confidential triage today.
          </p>
          <Button 
            size="lg" 
            className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-6 text-lg"
            onClick={handleStartChat}
            disabled={isLoading}
            data-testid="cta-start-chat-button"
          >
            {isLoading ? "Starting..." : "Start Confidential Chat"}
            <MessageSquare className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-950 text-slate-400">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-teal-600" />
              <span className="font-semibold text-white">WhistleblowersUK</span>
            </div>
            <p className="text-sm">
              © 2026 WhistleblowersUK. Registered number 09347927.
            </p>
            <div className="flex gap-6 text-sm">
              <a href="https://wbuk.org" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                About WBUK
              </a>
              <a href="https://wbuk.org/contact-us" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
