import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Check user role and redirect accordingly
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .single();

      toast({
        title: "Success",
        description: "Logged in successfully!",
      });

      // Redirect based on role
      if (roleData?.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (roleData?.role === 'showroom') {
        navigate('/showroom-dashboard');
      } else {
        navigate('/');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password || !fullName) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) {
        toast({
          title: "Registration Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Account created! Please check your inbox to confirm your email address.",
      });

      // Show resend verification option
      setShowResendVerification(true);
      setPassword("");
      setFullName("");
      setIsSignUp(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "If an account exists with this email, you will receive a password reset link. Please check your inbox.",
      });

      setEmail("");
      setIsForgotPassword(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Verification email has been resent. Please check your inbox.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>
                {isForgotPassword ? 'Reset Password' : (isSignUp ? 'Create Account' : 'Sign In')}
              </CardTitle>
              <CardDescription>
                {isForgotPassword 
                  ? 'Enter your email to reset your password'
                  : (isSignUp ? 'Create an account to get started' : 'Sign in to your account')
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isForgotPassword && isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {!isForgotPassword && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              )}
              <Button
                onClick={() => {
                  if (isForgotPassword) {
                    handleForgotPassword();
                  } else if (isSignUp) {
                    handleSignUp();
                  } else {
                    handleLogin();
                  }
                }}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Processing...' : (isForgotPassword ? 'Send Reset Link' : (isSignUp ? 'Create Account' : 'Sign In'))}
              </Button>
              {!isForgotPassword && (
                <Button
                  variant="ghost"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="w-full"
                >
                  {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                </Button>
              )}
              {!isSignUp && !isForgotPassword && (
                <Button
                  variant="link"
                  onClick={() => setIsForgotPassword(true)}
                  className="w-full text-sm"
                >
                  Forgot password?
                </Button>
              )}
              {isForgotPassword && (
                <Button
                  variant="ghost"
                  onClick={() => setIsForgotPassword(false)}
                  className="w-full"
                >
                  Back to Sign In
                </Button>
              )}
              {showResendVerification && !isForgotPassword && !isSignUp && (
                <div className="space-y-2 pt-2 border-t">
                  <p className="text-sm text-muted-foreground text-center">
                    Haven't received the verification email?
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleResendVerification}
                    disabled={isLoading}
                    className="w-full"
                  >
                    Resend Verification Email
                  </Button>
                </div>
              )}
              {!isSignUp && !isForgotPassword && (
                <p className="text-xs text-muted-foreground text-center">
                  Admin and showroom accounts use the same login
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;