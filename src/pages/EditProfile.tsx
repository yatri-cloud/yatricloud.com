import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Upload, Loader2, AlertTriangle } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { getStoredUser, updateProfile, changePassword, changeEmail, logout, deleteAccount } from "@/lib/yatris-api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Country } from "country-state-city";
import { InterestedCertificationsPicker } from "@/components/certified-yatris/InterestedCertificationsPicker";

const EditProfile = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isCompleting = searchParams.get('complete') === 'true';
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Delete Account State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteCheckboxChecked, setDeleteCheckboxChecked] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    linkedinUrl: "",
    country: "",
    stateProvince: "",
    city: "",
    countryCode: "",
    phoneNumber: "",
    photoUrl: "",
    interestedCertifications: [] as string[],
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [emailData, setEmailData] = useState({
    currentPassword: "",
    newEmail: "",
    confirmEmail: "",
  });
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [showEmailChange, setShowEmailChange] = useState(false);

  const countries = Country.getAllCountries().map(country => ({
    value: country.isoCode,
    label: country.name,
    phoneCode: country.phonecode
  }));

  useEffect(() => {
    const loadUserData = async () => {
      const storedUser = getStoredUser();
      if (!storedUser) {
        navigate("/certifiedyatris");
        return;
      }
      setUser(storedUser);

      // Check if user authenticated via Google
      try {
        const { supabase } = await import("@/lib/supabase");
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const isGoogle = authUser.app_metadata?.provider === "google" ||
                           authUser.app_metadata?.providers?.includes("google") ||
                           authUser.identities?.some((id: any) => id.provider === "google");
          setIsGoogleUser(Boolean(isGoogle));
        }
      } catch (err) {
        console.warn("Could not determine auth provider:", err);
      }

      // Initialize with stored data immediately
      let userData = storedUser;

      // Try to fetch fresh user data from API to ensure all fields are loaded
      try {
        const { getCurrentUser } = await import("@/lib/yatris-api");
        const freshUser = await getCurrentUser();
        if (freshUser) {
          userData = freshUser;
          setUser(freshUser);
          if (freshUser.authProvider === "google") {
            setIsGoogleUser(true);
          }
        }
      } catch (error) {
        console.warn("Error fetching fresh user data, using stored data:", error);
      }

      // Set profile data with user data (either fresh or stored)
      const initialData = {
        fullName: userData.fullName || "",
        email: userData.email || "",
        linkedinUrl: userData.linkedinUrl || "",
        country: userData.country || "",
        stateProvince: userData.stateProvince || "",
        city: userData.city || "",
        countryCode: userData.countryCode || "",
        phoneNumber: userData.phoneNumber || "",
        photoUrl: userData.photoUrl || "",
        interestedCertifications: userData.interestedCertifications || [],
      };

      // Auto-set country code when country is selected
      if (userData.country) {
        const countryData = countries.find(c => c.value === userData.country);
        if (countryData && countryData.phoneCode) {
          initialData.countryCode = `+${countryData.phoneCode}`;
        }
      }

      setProfileData(initialData);
    };

    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Photo size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData({ ...profileData, photoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    // Validate mandatory fields
    if (!profileData.fullName?.trim()) {
      toast({ title: "Error", description: "Full Name is required", variant: "destructive" });
      return;
    }
    // LinkedIn is optional, but if entered it must be valid URL format
    if (profileData.linkedinUrl?.trim() && !profileData.linkedinUrl.match(/^https?:\/\/(www\.)?linkedin\.com\/in\/.+/i)) {
      toast({ title: "Error", description: "Please enter a valid LinkedIn profile URL (e.g. https://linkedin.com/in/yourname)", variant: "destructive" });
      return;
    }
    if (!profileData.country) {
      toast({ title: "Error", description: "Country is required", variant: "destructive" });
      return;
    }
    if (!profileData.stateProvince?.trim()) {
      toast({ title: "Error", description: "State/Province is required", variant: "destructive" });
      return;
    }
    if (!profileData.city?.trim()) {
      toast({ title: "Error", description: "City is required", variant: "destructive" });
      return;
    }
    if (!profileData.phoneNumber?.trim()) {
      toast({ title: "Error", description: "Phone Number is required", variant: "destructive" });
      return;
    }
    if (!profileData.interestedCertifications || profileData.interestedCertifications.length === 0) {
      toast({ title: "Error", description: "Please select or type at least one certification you are interested in", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateProfile({
        fullName: profileData.fullName.trim(),
        linkedinUrl: profileData.linkedinUrl?.trim() || "",
        country: profileData.country,
        stateProvince: profileData.stateProvince.trim(),
        city: profileData.city.trim(),
        countryCode: profileData.countryCode.trim(),
        phoneNumber: profileData.phoneNumber.trim(),
        photoUrl: profileData.photoUrl,
        interestedCertifications: profileData.interestedCertifications,
      });

      if (result.success) {
        toast({
          title: "Success",
          description: isCompleting ? "Profile completed successfully!" : "Profile updated successfully",
        });
        // Update stored user
        const updatedUser = { ...user, ...profileData };
        setUser(updatedUser);
        localStorage.setItem("yatris_user", JSON.stringify(updatedUser));
        // Redirect based on context
        navigate(isCompleting ? "/certifiedyatris" : "/manage-certifications");
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update profile",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword) {
      toast({
        title: "Error",
        description: "Please enter your current password",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const result = await changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );

      if (result.success) {
        toast({
          title: "Success",
          description: "Password changed successfully",
        });
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to change password",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!emailData.currentPassword) {
      toast({
        title: "Error",
        description: "Please enter your current password",
        variant: "destructive",
      });
      return;
    }

    if (emailData.newEmail !== emailData.confirmEmail) {
      toast({
        title: "Error",
        description: "Email addresses do not match",
        variant: "destructive",
      });
      return;
    }

    if (emailData.newEmail === profileData.email) {
      toast({
        title: "Error",
        description: "New email must be different from current email",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(emailData.newEmail)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsChangingEmail(true);
    try {
      const result = await changeEmail(
        emailData.currentPassword,
        emailData.newEmail
      );

      if (result.success) {
        toast({
          title: "Success",
          description: "Email confirmation sent. Please verify your new email.",
        });

        // Log out user and redirect to login
        setTimeout(() => {
          logout();
          navigate("/certifiedyatris");
        }, 2000);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to change email",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to change email",
        variant: "destructive",
      });
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE" || !deleteCheckboxChecked) {
      toast({
        title: "Error",
        description: "Please type DELETE and check the confirmation checkbox.",
        variant: "destructive",
      });
      return;
    }

    setIsDeletingAccount(true);
    try {
      const res = await deleteAccount();
      if (res.success) {
        toast({
          title: "Account Deleted",
          description: "Your account and all associated records have been permanently removed.",
        });
        setShowDeleteModal(false);
        navigate("/certifiedyatris");
      } else {
        toast({
          title: "Error",
          description: res.error || "Failed to delete account",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete account",
        variant: "destructive",
      });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Edit Profile · Yatri Cloud"
        description="Update your Yatri Cloud profile details."
        noindex
      />
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-1.5">
                  {isCompleting ? "Complete Your Profile" : "Edit Profile"}
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                  {isCompleting
                    ? "Please fill in all required fields to continue using Yatri Cloud"
                    : "Update your personal information and account settings"}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Profile Completion Banner */}
          {isCompleting && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-amber-600 dark:text-amber-400">Profile Incomplete</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Please complete your required location, contact number, and interested certifications to unlock full access.
                </p>
              </div>
            </motion.div>
          )}

          <div className="space-y-6">
            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Photo */}
                <div>
                  <Label>Photo</Label>
                  <div className="flex items-center gap-4 mt-2">
                    {profileData.photoUrl && (
                      <div className="relative">
                        <img
                          src={profileData.photoUrl}
                          alt="Profile"
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-border shadow-sm"
                        />
                        <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Upload className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    )}
                    <div>
                      <Label htmlFor="photo-upload" className="cursor-pointer">
                        <div className="flex items-center gap-2 px-3.5 py-1.5 border border-border rounded-lg hover:bg-muted text-xs sm:text-sm font-medium">
                          <Upload className="w-4 h-4" />
                          {profileData.photoUrl ? "Change Photo" : "Upload Photo"}
                        </div>
                        <Input
                          id="photo-upload"
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                      </Label>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Max size: 5MB (JPG, PNG, WebP)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <Label>Full Name <span className="text-destructive">*</span></Label>
                  <Input
                    value={profileData.fullName}
                    onChange={(e) =>
                      setProfileData({ ...profileData, fullName: e.target.value })
                    }
                    placeholder="Your full name"
                    className="mt-1"
                  />
                </div>

                {/* Email */}
                <div>
                  <div className="flex items-center justify-between">
                    <Label>Email</Label>
                    {isGoogleUser && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                        </svg>
                        Signed in via Google
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="email"
                      value={profileData.email}
                      disabled
                      className="bg-muted flex-1"
                    />
                    {!isGoogleUser && !showEmailChange && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowEmailChange(true)}
                      >
                        Change Email
                      </Button>
                    )}
                  </div>
                  {!isGoogleUser && showEmailChange && (
                    <div className="mt-4 p-4 border border-border rounded-xl bg-muted/40 space-y-4">
                      <p className="text-sm font-semibold">Change Email Address</p>
                      <div>
                        <Label>Current Password</Label>
                        <Input
                          type="password"
                          value={emailData.currentPassword}
                          onChange={(e) =>
                            setEmailData({ ...emailData, currentPassword: e.target.value })
                          }
                          placeholder="Enter your current password"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>New Email</Label>
                        <Input
                          type="email"
                          value={emailData.newEmail}
                          onChange={(e) =>
                            setEmailData({ ...emailData, newEmail: e.target.value })
                          }
                          placeholder="Enter new email address"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Confirm New Email</Label>
                        <Input
                          type="email"
                          value={emailData.confirmEmail}
                          onChange={(e) =>
                            setEmailData({ ...emailData, confirmEmail: e.target.value })
                          }
                          placeholder="Confirm new email address"
                          className="mt-1"
                        />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button
                          type="button"
                          onClick={handleChangeEmail}
                          disabled={isChangingEmail}
                          className="flex-1"
                        >
                          {isChangingEmail ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Changing...
                            </>
                          ) : (
                            "Update Email"
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowEmailChange(false);
                            setEmailData({
                              currentPassword: "",
                              newEmail: "",
                              confirmEmail: "",
                            });
                          }}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* LinkedIn URL (Optional) */}
                <div>
                  <Label>LinkedIn Profile URL <span className="text-xs text-muted-foreground font-normal">(Optional)</span></Label>
                  <Input
                    value={profileData.linkedinUrl || ""}
                    onChange={(e) =>
                      setProfileData({ ...profileData, linkedinUrl: e.target.value })
                    }
                    placeholder="https://linkedin.com/in/yourusername"
                    className="mt-1"
                  />
                </div>

                {/* Location Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Country <span className="text-destructive">*</span></Label>
                    <Select
                      value={profileData.country || undefined}
                      onValueChange={(value) => {
                        const countryData = countries.find(c => c.value === value);
                        setProfileData({
                          ...profileData,
                          country: value,
                          countryCode: countryData ? `+${countryData.phoneCode}` : profileData.countryCode,
                        });
                      }}
                    >
                      <SelectTrigger className="mt-1">
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
                  </div>
                  <div>
                    <Label>State/Province <span className="text-destructive">*</span></Label>
                    <Input
                      value={profileData.stateProvince || ""}
                      onChange={(e) =>
                        setProfileData({ ...profileData, stateProvince: e.target.value })
                      }
                      placeholder="e.g. Maharashtra, California"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>City <span className="text-destructive">*</span></Label>
                    <Input
                      value={profileData.city || ""}
                      onChange={(e) =>
                        setProfileData({ ...profileData, city: e.target.value })
                      }
                      placeholder="e.g. Mumbai, New York"
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Country Code</Label>
                    <Input
                      placeholder="+91"
                      value={profileData.countryCode || ""}
                      onChange={(e) =>
                        setProfileData({ ...profileData, countryCode: e.target.value })
                      }
                      className="mt-1 bg-background"
                    />
                  </div>
                  <div>
                    <Label>Phone Number <span className="text-destructive">*</span></Label>
                    <Input
                      value={profileData.phoneNumber || ""}
                      onChange={(e) =>
                        setProfileData({ ...profileData, phoneNumber: e.target.value })
                      }
                      placeholder="9876543210"
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Interested Certifications (Mandatory) */}
                <div className="pt-3 border-t border-border/60">
                  <InterestedCertificationsPicker
                    value={profileData.interestedCertifications}
                    onChange={(items) =>
                      setProfileData({ ...profileData, interestedCertifications: items })
                    }
                    required={true}
                    label="Which certifications are you interested in?"
                    description="Select providers and/or add custom certification names."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="flex-1"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Profile"
                    )}
                  </Button>
                  <Button
                    onClick={() => navigate("/manage-certifications")}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Change Password - ONLY for Email/Password Users */}
            {!isGoogleUser && (
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>
                    Update your account password
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Current Password</Label>
                    <Input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, currentPassword: e.target.value })
                      }
                      placeholder="Enter current password"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>New Password</Label>
                    <Input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, newPassword: e.target.value })
                      }
                      placeholder="Enter new password (min 6 characters)"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Confirm New Password</Label>
                    <Input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                      }
                      placeholder="Confirm new password"
                      className="mt-1"
                    />
                  </div>
                  <Button
                    onClick={handleChangePassword}
                    disabled={isChangingPassword}
                    variant="outline"
                    className="w-full"
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Changing...
                      </>
                    ) : (
                      "Change Password"
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Danger Zone: Delete Account */}
            <Card className="border-destructive/40 bg-destructive/[0.02]">
              <CardHeader>
                <CardTitle className="text-destructive text-lg">
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Permanently delete your account and all associated data.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Deleting your account is permanent and cannot be reversed. All your profile information, certification badges, event registrations, course progress, and mentorship records will be immediately erased.
                </p>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setDeleteConfirmText("");
                    setDeleteCheckboxChecked(false);
                    setShowDeleteModal(true);
                  }}
                >
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Double Confirmation Delete Account Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-[430px] p-5 sm:p-6 rounded-2xl">
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="text-lg sm:text-xl font-bold text-destructive">
              Delete Account Permanently?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              This action is <strong className="text-foreground">irreversible</strong>. You will lose access to all your records, including:
            </DialogDescription>
          </DialogHeader>

          <ul className="text-xs space-y-1 text-muted-foreground list-disc pl-4.5 py-0.5">
            <li>Your certified badges & public Wall of Fame listing</li>
            <li>Your enrolled training courses & progress history</li>
            <li>Your upcoming event passes & registered tickets</li>
            <li>All saved personal profile details & preferences</li>
          </ul>

          <div className="space-y-3 pt-1">
            <div>
              <Label className="text-xs font-semibold text-foreground">
                To confirm, type <span className="font-bold text-destructive">DELETE</span> below:
              </Label>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="mt-1 h-9.5 text-sm border-border/80 focus-visible:ring-destructive rounded-xl"
              />
            </div>

            <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer select-none">
              <Checkbox
                checked={deleteCheckboxChecked}
                onCheckedChange={(checked) => setDeleteCheckboxChecked(Boolean(checked))}
                className="mt-0.5"
              />
              <span className="leading-tight">
                I understand that deleting my account is permanent and all my data will be erased forever.
              </span>
            </label>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeletingAccount}
              className="w-full sm:w-auto h-9.5 rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteConfirmText !== "DELETE" || !deleteCheckboxChecked || isDeletingAccount}
              onClick={handleDeleteAccount}
              className="w-full sm:w-auto h-9.5 font-semibold rounded-xl text-xs"
            >
              {isDeletingAccount ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Permanently Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default EditProfile;
