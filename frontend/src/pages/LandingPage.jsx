import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, MessageSquare, FileText, Shield, ChevronRight, Users, Scale, Phone } from "lucide-react";
import { createSession } from "@/lib/api";
import { toast } from "sonner";
import { useState } from "react";

// WBUK Logo Component
const WBUKLogo = ({ className = "" }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <div className="flex flex-col leading-none">
      <span className="font-heading font-extrabold text-2xl tracking-tight text-black">WB</span>
      <span className="font-heading font-extrabold text-2xl tracking-tight text-black">UK</span>
    </div>
    <div className="flex flex-col">
      <span className="font-heading font-bold text-lg text-black">WhistleblowersUK</span>
      <span className="text-xs text-gray-500">educate, support & champion whistleblowing</span>
    </div>
  </div>
);

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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white border-b-4 border-wbuk-red">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <WBUKLogo />
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="https://wbuk.org" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-wbuk-red transition-colors">
              Home
            </a>
            <a href="https://wbuk.org/about-us" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-wbuk-red transition-colors">
              About Us
            </a>
            <a href="https://wbuk.org/services" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-wbuk-red transition-colors">
              Services
            </a>
            <a href="https://wbuk.org/contact-us" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-wbuk-red transition-colors">
              Contact Us
            </a>
            <Button 
              className="bg-wbuk-red hover:bg-red-700 text-white rounded-none px-6"
              onClick={() => navigate("/admin")}
              data-testid="admin-login-link"
            >
              Advisor Login
            </Button>
          </nav>

          <Button 
            className="md:hidden bg-wbuk-red hover:bg-red-700 text-white rounded-none"
            onClick={() => navigate("/admin")}
          >
            Login
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-wbuk-red mb-6">
                AI Triage Service
              </h1>
              <p className="text-lg md:text-xl text-gray-700 leading-relaxed mb-8">
                Our confidential AI-powered service helps you understand whether your concern 
                may qualify as a protected disclosure under UK law. Speak freely - we're here to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-wbuk-red hover:bg-red-700 text-white rounded-none px-8 py-6 text-lg"
                  onClick={handleStartChat}
                  disabled={isLoading}
                  data-testid="start-chat-button"
                >
                  {isLoading ? "Starting..." : "Start Confidential Chat"}
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white p-8 shadow-lg border-l-4 border-wbuk-red">
                <div className="flex items-center gap-3 mb-4">
                  <Lock className="h-8 w-8 text-wbuk-red" />
                  <h3 className="font-heading font-bold text-xl">100% Confidential</h3>
                </div>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start gap-2">
                    <Shield className="h-5 w-5 text-wbuk-red flex-shrink-0 mt-0.5" />
                    <span>Anonymous session - no IP logging</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Shield className="h-5 w-5 text-wbuk-red flex-shrink-0 mt-0.5" />
                    <span>Encrypted conversations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Shield className="h-5 w-5 text-wbuk-red flex-shrink-0 mt-0.5" />
                    <span>No personal data stored unless you choose</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Shield className="h-5 w-5 text-wbuk-red flex-shrink-0 mt-0.5" />
                    <span>Evidence metadata automatically stripped</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-wbuk-red mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-600 mb-12 max-w-3xl">
            Our AI triage service guides you through a structured conversation to assess your situation 
            and provide guidance on next steps.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-none bg-gray-50 rounded-none">
              <CardContent className="pt-8 pb-8 px-6">
                <div className="w-12 h-12 bg-wbuk-red text-white flex items-center justify-center text-xl font-bold mb-4">
                  1
                </div>
                <h3 className="font-heading font-bold text-xl mb-3">Share Your Concern</h3>
                <p className="text-gray-600">
                  Describe your situation to our AI assistant in a confidential, anonymous chat. 
                  Take your time - there's no pressure.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-none bg-gray-50 rounded-none">
              <CardContent className="pt-8 pb-8 px-6">
                <div className="w-12 h-12 bg-wbuk-red text-white flex items-center justify-center text-xl font-bold mb-4">
                  2
                </div>
                <h3 className="font-heading font-bold text-xl mb-3">Get Assessment</h3>
                <p className="text-gray-600">
                  Receive a detailed analysis based on UK whistleblowing law (PIDA 1998) 
                  including risk assessment and legal classification.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-none bg-gray-50 rounded-none">
              <CardContent className="pt-8 pb-8 px-6">
                <div className="w-12 h-12 bg-wbuk-red text-white flex items-center justify-center text-xl font-bold mb-4">
                  3
                </div>
                <h3 className="font-heading font-bold text-xl mb-3">Submit for Review</h3>
                <p className="text-gray-600">
                  Choose to submit your case to WBUK's qualified advisors for professional 
                  guidance and ongoing support.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Legal Framework */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-wbuk-red mb-6">
                Protected Under UK Law
              </h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                The Public Interest Disclosure Act 1998 (PIDA) provides legal protection for 
                workers who report certain types of wrongdoing. Our AI understands this legislation 
                and helps assess your situation.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Scale className="h-6 w-6 text-wbuk-red flex-shrink-0" />
                  <span className="text-gray-700">Criminal offences</span>
                </div>
                <div className="flex items-start gap-3">
                  <Scale className="h-6 w-6 text-wbuk-red flex-shrink-0" />
                  <span className="text-gray-700">Health & safety risks</span>
                </div>
                <div className="flex items-start gap-3">
                  <Scale className="h-6 w-6 text-wbuk-red flex-shrink-0" />
                  <span className="text-gray-700">Environmental damage</span>
                </div>
                <div className="flex items-start gap-3">
                  <Scale className="h-6 w-6 text-wbuk-red flex-shrink-0" />
                  <span className="text-gray-700">Financial misconduct</span>
                </div>
                <div className="flex items-start gap-3">
                  <Scale className="h-6 w-6 text-wbuk-red flex-shrink-0" />
                  <span className="text-gray-700">Legal violations</span>
                </div>
                <div className="flex items-start gap-3">
                  <Scale className="h-6 w-6 text-wbuk-red flex-shrink-0" />
                  <span className="text-gray-700">Cover-ups</span>
                </div>
              </div>
            </div>
            <div className="bg-white p-8 shadow-lg">
              <h3 className="font-heading font-bold text-xl mb-4 text-wbuk-red">Important Notice</h3>
              <p className="text-gray-600 mb-4">
                This AI service provides guidance, not legal advice. Any assessment is preliminary 
                and subject to review by qualified advisors.
              </p>
              <p className="text-gray-600">
                The final determination of whether a disclosure qualifies for protection is a 
                legal matter that may ultimately be decided by an Employment Tribunal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-wbuk-red">
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Speak Up?
          </h2>
          <p className="text-lg text-red-100 mb-8 max-w-2xl mx-auto">
            Your courage could protect others. Start your confidential triage today. 
            We're a not-for-profit organisation here to support you.
          </p>
          <Button 
            size="lg" 
            className="bg-white hover:bg-gray-100 text-wbuk-red rounded-none px-8 py-6 text-lg font-bold"
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
      <footer className="py-12 bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex flex-col leading-none">
                  <span className="font-heading font-extrabold text-xl text-white">WB</span>
                  <span className="font-heading font-extrabold text-xl text-white">UK</span>
                </div>
                <div>
                  <span className="font-heading font-bold text-white">WhistleblowersUK</span>
                </div>
              </div>
              <p className="text-gray-400 max-w-md">
                We're a not-for-profit organisation dedicated to educating, supporting, and championing 
                whistleblowers, working to build a fairer, more transparent society.
              </p>
            </div>
            <div>
              <h4 className="font-heading font-bold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <a href="https://wbuk.org" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    Main Website
                  </a>
                </li>
                <li>
                  <a href="https://wbuk.org/services" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    Our Services
                  </a>
                </li>
                <li>
                  <a href="https://wbuk.org/contact-us" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-bold text-white mb-4">Contact</h4>
              <div className="flex items-center gap-2 text-gray-400">
                <Phone className="h-4 w-4" />
                <span>Via WBUK website</span>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              © 2026 WhistleblowersUK. Registered charity number 09347927.
            </p>
            <p className="text-sm text-gray-500">
              AI Triage Service powered by WBUK
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
