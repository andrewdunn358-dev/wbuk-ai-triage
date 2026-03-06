import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, ArrowLeft } from "lucide-react";
import { adminLogin } from "@/lib/api";
import { toast } from "sonner";

// WBUK Logo Component
const WBUKLogo = ({ className = "" }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <div className="flex flex-col leading-none">
      <span className="font-heading font-extrabold text-2xl tracking-tight text-wbuk-red">WB</span>
      <span className="font-heading font-extrabold text-2xl tracking-tight text-wbuk-red">UK</span>
    </div>
    <div>
      <span className="font-heading font-bold text-lg text-gray-800">Advisor Portal</span>
    </div>
  </div>
);

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setIsLoading(true);
    try {
      const response = await adminLogin(email, password);
      localStorage.setItem("adminToken", response.token);
      localStorage.setItem("adminInfo", JSON.stringify({
        email: response.email,
        name: response.name,
        role: response.role,
      }));
      toast.success("Login successful");
      navigate("/admin/dashboard");
    } catch (error) {
      console.error("Login failed:", error);
      if (error.response?.status === 401) {
        toast.error("Invalid credentials");
      } else {
        toast.error("Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <WBUKLogo className="justify-center" />
        </div>

        <Card className="border-t-4 border-wbuk-red rounded-none shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="font-heading text-gray-900">Advisor Login</CardTitle>
            <CardDescription className="text-gray-600">
              Access the case management dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="advisor@wbuk.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-none border-gray-300 focus:border-wbuk-red focus:ring-wbuk-red"
                  data-testid="admin-email-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-none border-gray-300 focus:border-wbuk-red focus:ring-wbuk-red"
                  data-testid="admin-password-input"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-wbuk-red hover:bg-red-700 rounded-none"
                disabled={isLoading}
                data-testid="admin-login-button"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Lock className="h-4 w-4 mr-2" />
                )}
                Sign In
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <Button 
                variant="ghost" 
                className="w-full text-gray-600 hover:text-wbuk-red hover:bg-red-50"
                onClick={() => navigate("/")}
                data-testid="back-to-public-button"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Public Site
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-500 mt-6">
          Authorized personnel only. All access is logged.
        </p>
      </div>
    </div>
  );
}
