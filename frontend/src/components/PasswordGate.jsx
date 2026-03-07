import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Shield } from "lucide-react";

// Site access password - change this to your desired password
const SITE_PASSWORD = "WBUK2026";

export default function PasswordGate({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if already authenticated
    const auth = localStorage.getItem("wbuk_site_access");
    if (auth === "granted") {
      setIsAuthenticated(true);
    }
    setIsChecking(false);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === SITE_PASSWORD) {
      localStorage.setItem("wbuk_site_access", "granted");
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("Incorrect password. Please contact WBUK for access.");
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse">
          <Shield className="h-12 w-12 text-wbuk-red" />
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return children;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-none border-t-4 border-t-wbuk-red">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <Lock className="h-8 w-8 text-wbuk-red" />
          </div>
          <CardTitle className="font-heading text-2xl text-gray-900">
            WBUK AI Triage
          </CardTitle>
          <p className="text-gray-600 mt-2">
            This is a confidential whistleblower support platform.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Access Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="rounded-none"
                data-testid="site-password-input"
              />
            </div>
            
            {error && (
              <p className="text-sm text-red-600" data-testid="password-error">
                {error}
              </p>
            )}

            <Button 
              type="submit" 
              className="w-full bg-wbuk-red hover:bg-red-700 rounded-none"
              data-testid="site-password-submit"
            >
              Access Platform
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t text-center">
            <p className="text-sm text-gray-500">
              If you need access, please contact Whistleblower UK.
            </p>
            <a 
              href="https://wbuk.org" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-wbuk-red hover:underline"
            >
              Visit wbuk.org
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
