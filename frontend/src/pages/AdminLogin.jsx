import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Lock, Loader2, ArrowLeft } from "lucide-react";
import { adminLogin } from "@/lib/api";
import { toast } from "sonner";

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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <ShieldCheck className="h-10 w-10 text-teal-500" />
            <div className="text-left">
              <h1 className="font-serif font-bold text-white text-2xl">WBUK</h1>
              <p className="text-sm text-slate-400">Advisor Portal</p>
            </div>
          </div>
        </div>

        <Card className="border-slate-800 bg-slate-800/50">
          <CardHeader className="text-center">
            <CardTitle className="font-serif text-white">Advisor Login</CardTitle>
            <CardDescription className="text-slate-400">
              Access the case management dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="advisor@wbuk.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                  data-testid="admin-email-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                  data-testid="admin-password-input"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-teal-600 hover:bg-teal-700"
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

            <div className="mt-6 pt-6 border-t border-slate-700">
              <Button 
                variant="ghost" 
                className="w-full text-slate-400 hover:text-white hover:bg-slate-700"
                onClick={() => navigate("/")}
                data-testid="back-to-public-button"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Public Site
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-500 mt-6">
          Authorized personnel only. All access is logged.
        </p>
      </div>
    </div>
  );
}
