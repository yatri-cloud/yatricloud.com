import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, UserPlus, X, Upload, Loader2, Globe, MapPin, Phone, Linkedin, ArrowRight, ArrowLeft, UserCheck } from "lucide-react";
import { loginUser, registerUser, googleLogin, updateProfile, isProfileComplete, logout } from "@/lib/yatris-api";
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
import { InterestedCertificationsPicker } from "./InterestedCertificationsPicker";

/** Google Identity Services script attaches itself to window.google at runtime. */
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential: string }) => void; auto_select?: boolean }) => void;
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

  // Step 2 Onboarding state (for Google login & incomplete profiles)
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [onboardingUser, setOnboardingUser] = useState<any>(null);
  const [onboardingData, setOnboardingData] = useState({
    country: "",
    stateProvince: "",
    city: "",
    countryCode: "",
    phoneNumber: "",
    linkedinUrl: "",
    interestedCertifications: [] as string[],
  });

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
    interestedCertifications: [] as string[],
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

  // Auto-set country code when register country is selected
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

  // Auto-set country code when onboarding country is selected
  useEffect(() => {
    if (onboardingData.country) {
      const countryData = countries.find(c => c.value === onboardingData.country);
      if (countryData && countryData.phoneCode) {
        setOnboardingData(prev => ({
          ...prev,
          countryCode: `+${countryData.phoneCode}`,
        }));
      }
    }
  }, [onboardingData.country]);

  // Google Auth Initialization — the GSI client script loads on demand here
  useEffect(() => {
    if (isOnboarding) return;
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
          callback: handleGoogleResponse,
          auto_select: true,
        });

        const btnContainer = document.getElementById("googleSignInDiv");
        if (btnContainer) {
          window.google.accounts.id.renderButton(
            btnContainer,
            { theme: "outline", size: "large" }
          );
        }

        window.google.accounts.id.prompt();
      } catch (e) {
        console.error("Google Auth Init Error", e);
      }
    })();
    return () => { cancelled = true; };
  }, [isLogin, isOnboarding]);

  const handleGoogleResponse = async (response: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const { jwtDecode } = await import("jwt-decode");
      const userObject: any = jwtDecode(response.credential);

      const result = await googleLogin({
        email: userObject.email,
        fullName: userObject.name,
        photoUrl: userObject.picture,
        idToken: response.credential,
      });

      if (result.success && result.user) {
        if (!isProfileComplete(result.user)) {
          // Incomplete profile -> trigger Step 2 Onboarding
          setOnboardingUser(result.user);
          setOnboardingData({
            country: result.user.country || "",
            stateProvince: result.user.stateProvince || "",
            city: result.user.city || "",
            countryCode: result.user.countryCode || "",
            phoneNumber: result.user.phoneNumber || "",
            linkedinUrl: result.user.linkedinUrl || "",
            interestedCertifications: result.user.interestedCertifications || [],
          });
          setIsOnboarding(true);
          toast({
            title: "Almost there! 🎉",
            description: "Please complete your mandatory profile details.",
          });
        } else {
          onSuccess(result.user);
          toast({
            title: "Welcome!",
            description: `Logged in as ${result.user.fullName}`,
          });
        }
      } else {
        setError(result.error || "Google Login failed");
      }
    } catch (e: any) {
      setError("Google Auth Error: " + (e?.message || "Failed to authenticate with Google"));
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
        if (!isProfileComplete(result.user)) {
          setOnboardingUser(result.user);
          setOnboardingData({
            country: result.user.country || "",
            stateProvince: result.user.stateProvince || "",
            city: result.user.city || "",
            countryCode: result.user.countryCode || "",
            phoneNumber: result.user.phoneNumber || "",
            linkedinUrl: result.user.linkedinUrl || "",
            interestedCertifications: result.user.interestedCertifications || [],
          });
          setIsOnboarding(true);
          toast({
            title: "Profile Incomplete",
            description: "Please complete your mandatory profile details to continue.",
          });
        } else {
          onSuccess(result.user);
        }
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
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Image size should be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (registerData.password !== registerData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (registerData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (!registerData.linkedinUrl) {
      setError("LinkedIn Profile URL is required");
      return;
    }

    if (!registerData.linkedinUrl.match(/^https?:\/\/(www\.)?linkedin\.com\/in\/.+/i)) {
      setError("Please enter a valid LinkedIn profile URL (e.g., https://linkedin.com/in/username)");
      return;
    }

    if (!registerData.country) {
      setError("Country is required");
      return;
    }

    if (!registerData.stateProvince.trim()) {
      setError("State/Province is required");
      return;
    }

    if (!registerData.city.trim()) {
      setError("City is required");
      return;
    }

    if (!registerData.phoneNumber.trim()) {
      setError("Phone Number is required");
      return;
    }

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
        interestedCertifications: registerData.interestedCertifications,
      });

      if (result.success && result.user) {
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

  // Step 2 Submission (Onboarding)
  const handleCompleteOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!onboardingData.country) {
      setError("Country is mandatory");
      return;
    }
    if (!onboardingData.stateProvince.trim()) {
      setError("State/Province is mandatory");
      return;
    }
    if (!onboardingData.city.trim()) {
      setError("City is mandatory");
      return;
    }
    if (!onboardingData.phoneNumber.trim()) {
      setError("Contact number is mandatory");
      return;
    }

    if (onboardingData.countryCode && onboardingData.phoneNumber) {
      try {
        const fullNumber = `${onboardingData.countryCode}${onboardingData.phoneNumber}`;
        const phoneNumber = parsePhoneNumber(fullNumber);
        if (!phoneNumber.isValid()) {
          setError("Please enter a valid contact number for the selected country");
          return;
        }
      } catch (err) {
        setError("Please enter a valid contact number");
        return;
      }
    }

    if (!onboardingData.linkedinUrl.trim()) {
      setError("LinkedIn Profile URL is mandatory");
      return;
    }
    if (!onboardingData.linkedinUrl.match(/^https?:\/\/(www\.)?linkedin\.com\/in\/.+/i)) {
      setError("Please enter a valid LinkedIn URL (e.g., https://linkedin.com/in/yourname)");
      return;
    }

    setIsLoading(true);
    try {
      const updateRes = await updateProfile({
        country: onboardingData.country,
        stateProvince: onboardingData.stateProvince.trim(),
        city: onboardingData.city.trim(),
        countryCode: onboardingData.countryCode,
        phoneNumber: onboardingData.phoneNumber.trim(),
        linkedinUrl: onboardingData.linkedinUrl.trim(),
        interestedCertifications: onboardingData.interestedCertifications,
      });

      if (updateRes.success) {
        try {
          const emailHtml = getWelcomeEmail(onboardingUser?.fullName || "Yatri");
          if (onboardingUser?.email) {
            sendEmail({
              to: onboardingUser.email,
              subject: "Welcome to Yatri Cloud!",
              html: emailHtml
            }).catch(err => console.error("Welcome email failed:", err));
          }
        } catch (emailErr) {
          console.error("Failed to prepare welcome email:", emailErr);
        }

        toast({
          title: "Account Ready! 🎉",
          description: `Welcome to Yatri Cloud, ${onboardingUser?.fullName || ""}!`,
        });

        onSuccess(updateRes.user || {
          ...onboardingUser,
          ...onboardingData,
        });
      } else {
        setError(updateRes.error || "Failed to update profile details");
      }
    } catch (err: any) {
      setError(err.message || "Failed to update profile details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOnboarding = () => {
    logout();
    setIsOnboarding(false);
    setOnboardingUser(null);
    setError(null);
  };

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-10 bg-gradient-to-br from-background via-background/95 to-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md max-h-[calc(100vh-4rem)] overflow-hidden"
      >
        <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl overflow-y-auto max-h-[calc(100vh-5rem)]">
          <AnimatePresence mode="wait">
            {isOnboarding ? (
              /* ================= STEP 2: COMPLETE PROFILE ONBOARDING ================= */
              <motion.div
                key="onboarding-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* User avatar & welcome */}
                <div className="text-center mb-6">
                  {onboardingUser?.photoUrl ? (
                    <div className="relative inline-block mb-3">
                      <img
                        src={onboardingUser.photoUrl}
                        alt={onboardingUser.fullName || "User"}
                        className="w-20 h-20 rounded-full object-cover border-4 border-primary/20 shadow-md mx-auto"
                      />
                      <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                        <UserCheck className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                      <UserPlus className="w-8 h-8 text-primary" />
                    </div>
                  )}

                  <div className="inline-block px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs font-semibold text-primary mb-2">
                    Step 2 of 2: Complete Profile
                  </div>

                  <h2 className="text-2xl font-bold mb-1">
                    Welcome, {onboardingUser?.fullName?.split(" ")[0] || "Yatri"}!
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Please provide your mandatory location, contact details and certification interests.
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

                <form onSubmit={handleCompleteOnboarding} className="space-y-4">
                  {/* Email & Name preview */}
                  <div className="bg-muted/40 border border-border/60 rounded-xl p-3 text-xs space-y-1">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Account Email:</span>
                      <span className="font-medium text-foreground">{onboardingUser?.email}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Name:</span>
                      <span className="font-medium text-foreground">{onboardingUser?.fullName}</span>
                    </div>
                  </div>

                  {/* Country */}
                  <div>
                    <Label htmlFor="onboard-country" className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                      Country <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={onboardingData.country}
                      onValueChange={(value) => {
                        setOnboardingData({ ...onboardingData, country: value });
                      }}
                      required
                    >
                      <SelectTrigger id="onboard-country" className="w-full mt-1">
                        <SelectValue placeholder="Select your country" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[250px]">
                        {countries.map((country) => (
                          <SelectItem key={country.value} value={country.value}>
                            {country.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* State & City */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="onboard-state" className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                        State <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="onboard-state"
                        type="text"
                        placeholder="e.g. Maharashtra"
                        value={onboardingData.stateProvince}
                        onChange={(e) =>
                          setOnboardingData({ ...onboardingData, stateProvince: e.target.value })
                        }
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="onboard-city">
                        City <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="onboard-city"
                        type="text"
                        placeholder="e.g. Mumbai"
                        value={onboardingData.city}
                        onChange={(e) =>
                          setOnboardingData({ ...onboardingData, city: e.target.value })
                        }
                        className="mt-1"
                        required
                      />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <Label htmlFor="onboard-phone" className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                      Contact / WhatsApp Number <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex gap-2 mt-1">
                      <div className="w-24 shrink-0">
                        <Input
                          value={onboardingData.countryCode || "+--"}
                          readOnly
                          placeholder="Code"
                          className="bg-muted text-center font-mono text-xs cursor-default"
                        />
                      </div>
                      <Input
                        id="onboard-phone"
                        type="tel"
                        placeholder="9876543210"
                        value={onboardingData.phoneNumber}
                        onChange={(e) =>
                          setOnboardingData({ ...onboardingData, phoneNumber: e.target.value })
                        }
                        className="flex-1"
                        required
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Used for verified certification notifications and training updates.
                    </p>
                  </div>

                  {/* LinkedIn */}
                  <div>
                    <Label htmlFor="onboard-linkedin" className="flex items-center gap-1.5">
                      <Linkedin className="w-3.5 h-3.5 text-muted-foreground" />
                      LinkedIn Profile URL <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="onboard-linkedin"
                      type="url"
                      placeholder="https://linkedin.com/in/username"
                      value={onboardingData.linkedinUrl}
                      onChange={(e) =>
                        setOnboardingData({ ...onboardingData, linkedinUrl: e.target.value })
                      }
                      className="mt-1"
                      required
                    />
                  </div>

                  {/* Which certifications are you interested in */}
                  <div className="pt-1 border-t border-border/50">
                    <InterestedCertificationsPicker
                      value={onboardingData.interestedCertifications}
                      onChange={(items) =>
                        setOnboardingData({ ...onboardingData, interestedCertifications: items })
                      }
                      label="Which certifications are you interested in?"
                      description="Choose providers from the list/checkboxes and/or type custom exam names below."
                    />
                  </div>

                  {/* Actions */}
                  <div className="pt-3 space-y-2">
                    <Button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Completing setup...
                        </>
                      ) : (
                        <>
                          Complete Setup & Continue
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>

                    <button
                      type="button"
                      onClick={handleCancelOnboarding}
                      disabled={isLoading}
                      className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors pt-1 flex items-center justify-center gap-1"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      Sign in with a different account
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : (
              /* ================= STEP 1: LOGIN / SIGNUP ================= */
              <motion.div
                key="auth-step"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Header */}
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4"
                  >
                    <img
                      src="/logo-192.png"
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

                    {/* Interested Certifications / Technologies */}
                    <div className="pt-2 border-t border-border/50">
                      <InterestedCertificationsPicker
                        value={registerData.interestedCertifications}
                        onChange={(items) =>
                          setRegisterData({ ...registerData, interestedCertifications: items })
                        }
                        label="Which certifications are you interested in?"
                        description="Select from top providers and/or type custom exam names below."
                      />
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
