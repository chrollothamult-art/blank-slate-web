import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Lock } from "lucide-react";

export const AdminAuth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if already logged in
    const adminId = localStorage.getItem("admin_id");
    if (adminId) {
      navigate("/admin");
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Query admin table to verify credentials
      const { data: admins, error } = await supabase
        .from("admin")
        .select("id, email, password_hash")
        .eq("email", email);

      if (error) {
        throw error;
      }

      if (!admins || admins.length === 0) {
        toast({
          title: "Login Failed",
          description: "Invalid email or password",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const admin = admins[0];

      // Verify password using pgcrypto's crypt function
      const { data: passwordMatch, error: cryptError } = await supabase
        .rpc('verify_password', { 
          stored_hash: admin.password_hash, 
          input_password: password 
        })
        .single();

      if (cryptError || !passwordMatch) {
        toast({
          title: "Login Failed",
          description: "Invalid email or password",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Store admin session in localStorage
      localStorage.setItem("admin_id", admin.id);
      localStorage.setItem("admin_email", admin.email);

      toast({
        title: "Welcome Admin",
        description: "Successfully logged in.",
      });
      
      navigate("/admin");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-2">
            <Lock className="h-6 w-6 text-accent" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Admin Access</CardTitle>
          <CardDescription className="text-center">
            Enter your admin credentials to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAuth;
