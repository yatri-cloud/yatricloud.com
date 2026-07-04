import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LogIn, UserPlus, X, Upload } from "lucide-react";
import { loginUser, registerUser, googleLogin } from "@/lib/yatris-api";
import { sendPasswordReset } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Country } from "country-state-city";
import { parsePhoneNumber } from "libphonenumber-js";
import { sendEmail } from "@/lib/email";
import { getWelcomeEmail } from "@/lib/email-templates";
import { loadGoogleIdentity } from "@/lib/third-party";

/** Google Identity Services script attaches itself to window.google at runtime. */
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          renderButton: (parent: HTMLElement | null, options: Record<string, unknown>) => void;
          prompt: () => void;
        };
      };
    };
  }
}

interface LoginSignupProps {
  onSuccess: (user: any) => void;
}

export const LoginSignup = ({ onSuccess }: LoginSignupProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  // Register form state
  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    linkedinUrl: "",
    photoUrl: "",
    country: "",
    stateProvince: "",
    city: "",
    countryCode: "",
    phoneNumber: "",
  });

  // Photo upload state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Get all countries
  const countries = Country.getAllCountries().map(country => ({
    value: country.isoCode,
    label: country.name,
    phoneCode: country.phonecode
  }));

  // Auto-set country code when country is selected
  useEffect(() => {
    if (registerData.country) {
      const countryData = countries.find(c => c.value === registerData.country);
      if (countryData && countryData.phoneCode) {
        setRegisterData(prev => ({
          ...prev,
          countryCode: `+${countryData.phoneCode}`,
        }));
      }
    }
  }, [registerData.country]);

  // Google Auth Initialization — the GSI client script loads on demand here
  // instead of on every page via index.html.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const client_id = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!client_id || client_id.includes("YOUR_GOOGLE")) {
        console.warn("Google Client ID missing in .env");
        return;
      }
      const ready = await loadGoogleIdentity();
      if (!ready || cancelled || !window.google) return;
      try {
        window.google.accounts.id.initialize({
          client_id: client_id,
          callback: handleGoogleResponse
        });

        window.google.accounts.id.renderButton(
          document.getElementById("googleSignInDiv"),
          { theme: "outline", size: "large" }
        );
      } catch (e) {
        console.error("Google Auth Init Error", e);
      }
    })();
    return () => { cancelled = true; };
  }, [isLogin]);

  const handleGoogleResponse = async (response: any) => {
    try {
      setIsLoading(true);
      // dynamically import jwt-decode to avoid issues if not installed yet
      const { jwtDecode } = await import("jwt-decode");
      const userObject: any = jwtDecode(response.credential);

      console.log("Google User:", userObject);

      const result = await googleLogin({
        email: userObject.email,
        fullName: userObject.name,
        photoUrl: userObject.picture,
        idToken: response.credential, // raw JWT — verified server-side by Supabase
      });

      if (result.success && result.user) {
        onSuccess(result.user);
        toast({
          title: "Welcome!",
          description: `Logged in as ${result.user.fullName}`,
        });
      } else {
        setError(result.error || "Google Login failed");
      }
    } catch (e: any) {
      setError("Google Auth Error: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = loginEmail.trim();
    if (!email || !email.includes("@")) {
      setError("Enter your email above first, then tap “Forgot password”.");
      return;
    }
    setResetting(true);
    setError(null);
    const { error: resetError } = await sendPasswordReset(email);
    setResetting(false);
    if (resetError) {
      setError(resetError);
      return;
    }
    toast({
      title: "Reset link sent 📧",
      description: `Check ${email} for a link to set a new password. (Also check spam.)`,
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await loginUser(loginEmail, loginPassword);
      if (result.success && result.user) {
        onSuccess(result.user);
      } else {
        setError(result.error || "Login failed");
      }
    } catch (error: any) {
      setError(error.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle photo file selection
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Image size should be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      setPhotoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove photo
  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (registerData.password !== registerData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password length
    if (registerData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    // Validate required fields
    if (!registerData.linkedinUrl) {
      setError("LinkedIn Profile URL is required");
      return;
    }

    if (!registerData.linkedinUrl.match(/^https?:\/\/(www\.)?linkedin\.com\/in\/.+/i)) {
      setError("Please enter a valid LinkedIn profile URL");
      return;
    }

    if (!registerData.country) {
      setError("Country is required");
      return;
    }

    if (!registerData.stateProvince) {
      setError("State/Province is required");
      return;
    }

    if (!registerData.city) {
      setError("City is required");
      return;
    }

    if (!registerData.phoneNumber) {
      setError("Phone Number is required");
      return;
    }

    // Validate phone number format if country code is set
    if (registerData.countryCode && registerData.phoneNumber) {
      try {
        const fullNumber = `${registerData.countryCode}${registerData.phoneNumber}`;
        const phoneNumber = parsePhoneNumber(fullNumber);
        if (!phoneNumber.isValid()) {
          setError("Please enter a valid phone number");
          return;
        }
      } catch (error) {
        setError("Please enter a valid phone number");
        return;
      }
    }

    if (!photoFile && !registerData.photoUrl) {
      setError("Photo is required");
      return;
    }

    setIsLoading(true);

    try {
      // Convert photo file to base64 if uploaded
      let photoUrl = registerData.photoUrl;
      if (photoFile) {
        photoUrl = await fileToBase64(photoFile);
      }

      const result = await registerUser({
        email: registerData.email,
        password: registerData.password,
        fullName: registerData.fullName,
        linkedinUrl: registerData.linkedinUrl,
        photoUrl: photoUrl,
        country: registerData.country,
        stateProvince: registerData.stateProvince,
        city: registerData.city,
        countryCode: registerData.countryCode,
        phoneNumber: registerData.phoneNumber,
      });

      if (result.success && result.user) {

        // Send Welcome Email
        try {
          const emailHtml = getWelcomeEmail(registerData.fullName);
          sendEmail({
            to: registerData.email,
            subject: "Welcome to Yatri Cloud!",
            html: emailHtml
          }).catch(err => console.error("Welcome email failed:", err));
        } catch (emailErr) {
          console.error("Failed to prepare welcome email:", emailErr);
        }

        onSuccess(result.user);
      } else {
        setError(result.error || "Registration failed");
      }
    } catch (error: any) {
      setError(error.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-background via-background/95 to-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4"
            >
              <img
                src="https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/Logo/yatricloud-round-transparent.png"
                alt="Yatri Cloud Logo"
                className="w-12 h-12 object-contain"
              />
            </motion.div>
            <h2 className="text-3xl font-bold mb-2">
              {isLogin ? "Welcome Back!" : "Join Yatri Cloud"}
            </h2>
            <p className="text-muted-foreground">
              {isLogin
                ? "Login to submit your certifications and join the Wall of Fame"
                : "Sign up to showcase your certifications on the Wall of Fame"}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Google Sign In - Always visible */}
          <div className="mt-4 mb-6 flex justify-center w-full">
            <div id="googleSignInDiv" className="flex justify-center"></div>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or continue with email</span></div>
          </div>

          {/* Login Form */}
          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  placeholder="your@email.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password">Password</Label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={resetting}
                    className="text-xs font-medium text-primary hover:underline disabled:opacity-60"
                  >
                    {resetting ? "Sending…" : "Forgot password?"}
                  </button>
                </div>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Had an account before our upgrade? Use <span className="font-medium text-foreground">Forgot password</span> to set a new one, or sign in with Google.
              </p>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="your@email.com"
                  value={registerData.email}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, email: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="register-name">Full Name</Label>
                <Input
                  id="register-name"
                  type="text"
                  placeholder="Your Name"
                  value={registerData.fullName}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, fullName: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="register-password">Password</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="••••••••"
                  value={registerData.password}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, password: e.target.value })
                  }
                  required
                  minLength={6}
                />
              </div>

              <div>
                <Label htmlFor="register-confirm-password">Confirm Password</Label>
                <Input
                  id="register-confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={registerData.confirmPassword}
                  onChange={(e) =>
                    setRegisterData({
                      ...registerData,
                      confirmPassword: e.target.value,
                    })
                  }
                  required
                  minLength={6}
                />
              </div>

              <div>
                <Label htmlFor="register-linkedin">LinkedIn Profile URL <span className="text-destructive">*</span></Label>
                <Input
                  id="register-linkedin"
                  type="url"
                  placeholder="https://linkedin.com/in/yourprofile"
                  value={registerData.linkedinUrl}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, linkedinUrl: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="register-photo">Photo <span className="text-destructive">*</span></Label>
                {photoPreview ? (
                  <div className="space-y-2">
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-border">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="absolute top-1 right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {photoFile?.name} ({(photoFile?.size || 0) / 1024} KB)
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      id="register-photo"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    <Label
                      htmlFor="register-photo"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors bg-muted/50"
                    >
                      <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">
                        Click to upload photo
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">
                        PNG, JPG up to 5MB
                      </span>
                    </Label>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="register-country">Country <span className="text-destructive">*</span></Label>
                <Select
                  value={registerData.country}
                  onValueChange={(value) => {
                    setRegisterData({ ...registerData, country: value });
                  }}
                  required
                >
                  <SelectTrigger id="register-country" className="w-full">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {countries.map((country) => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!registerData.country && (
                  <p className="text-sm text-destructive mt-1">Country is required</p>
                )}
              </div>

              <div>
                <Label htmlFor="register-state">State/Province <span className="text-destructive">*</span></Label>
                <Input
                  id="register-state"
                  type="text"
                  placeholder="Your state/province"
                  value={registerData.stateProvince}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, stateProvince: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="register-city">City <span className="text-destructive">*</span></Label>
                <Input
                  id="register-city"
                  type="text"
                  placeholder="Your city"
                  value={registerData.city}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, city: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="register-country-code">Country Code <span className="text-destructive">*</span></Label>
                  <Input
                    id="register-country-code"
                    type="text"
                    value={registerData.countryCode}
                    readOnly
                    className="bg-muted"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="register-phone">Phone Number <span className="text-destructive">*</span></Label>
                  <Input
                    id="register-phone"
                    type="tel"
                    placeholder="Enter phone number"
                    value={registerData.phoneNumber}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, phoneNumber: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Sign Up"}
              </Button>
            </form>
          )}

          {/* Toggle Login/Signup */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                // Reset photo when switching
                setPhotoFile(null);
                setPhotoPreview(null);
              }}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Login"}
            </button>
          </div>
        </div>
      </motion.div >
    </div >
  );
};
