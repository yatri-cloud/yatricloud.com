import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Save, X, User, Mail, Linkedin, Globe, Upload, Lock, Loader2, AlertTriangle } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getStoredUser, updateProfile, changePassword, changeEmail, logout } from "@/lib/yatris-api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Country } from "country-state-city";

const EditProfile = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isCompleting = searchParams.get('complete') === 'true';
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

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

      // Initialize with stored data immediately
      let userData = storedUser;

      // Try to fetch fresh user data from API to ensure all fields are loaded
      try {
        const { getCurrentUser } = await import("@/lib/yatris-api");
        const freshUser = await getCurrentUser();
        if (freshUser) {
          userData = freshUser;
          setUser(freshUser);
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
    if (!profileData.linkedinUrl?.trim()) {
      toast({ title: "Error", description: "LinkedIn Profile URL is required", variant: "destructive" });
      return;
    }
    if (!profileData.linkedinUrl.match(/^https?:\/\/(www\.)?linkedin\.com\/in\/.+/i)) {
      toast({ title: "Error", description: "Please enter a valid LinkedIn profile URL", variant: "destructive" });
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

    setIsSaving(true);
    try {
      const result = await updateProfile({
        fullName: profileData.fullName,
        linkedinUrl: profileData.linkedinUrl,
        country: profileData.country,
        stateProvince: profileData.stateProvince,
        city: profileData.city,
        countryCode: profileData.countryCode,
        phoneNumber: profileData.phoneNumber,
        photoUrl: profileData.photoUrl,
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
          description: "Email changed successfully. Please sign in with your new email.",
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO />
      <Navbar />

      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-2">
                  {isCompleting ? "Complete Your Profile" : "Edit Profile"}
                </h1>
                <p className="text-muted-foreground text-lg">
                  {isCompleting
                    ? "Please fill in all required fields to continue"
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
              className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-amber-500">Profile Incomplete</p>
                <p className="text-sm text-muted-foreground">
                  You signed in with Google. Please fill in your LinkedIn URL, location, and phone number to complete your profile.
                </p>
              </div>
            </motion.div>
          )}

          <div className="space-y-6">
            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Information
                </CardTitle>
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
                          className="w-24 h-24 rounded-full object-cover border-2 border-border"
                        />
                        <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Upload className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    )}
                    <div>
                      <Label htmlFor="photo-upload" className="cursor-pointer">
                        <div className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted">
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
                      <p className="text-xs text-muted-foreground mt-1">
                        Max size: 5MB
                      </p>
                    </div>
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <Label>Full Name</Label>
                  <Input
                    value={profileData.fullName}
                    onChange={(e) =>
                      setProfileData({ ...profileData, fullName: e.target.value })
                    }
                    placeholder="Your full name"
                  />
                </div>

                {/* Email */}
                <div>
                  <Label>Email</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="email"
                      value={profileData.email}
                      disabled
                      className="bg-muted flex-1"
                    />
                    {!showEmailChange && (
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
                  {showEmailChange && (
                    <div className="mt-4 p-4 border border-border rounded-lg bg-muted/50 space-y-4">
                      <p className="text-sm font-medium">Change Email Address</p>
                      <div>
                        <Label>Current Password</Label>
                        <Input
                          type="password"
                          value={emailData.currentPassword}
                          onChange={(e) =>
                            setEmailData({ ...emailData, currentPassword: e.target.value })
                          }
                          placeholder="Enter your current password"
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
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={handleChangeEmail}
                          disabled={isChangingEmail}
                          variant="default"
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

                {/* LinkedIn URL */}
                <div>
                  <Label>LinkedIn Profile URL <span className="text-destructive">*</span></Label>
                  <Input
                    value={profileData.linkedinUrl || ""}
                    onChange={(e) =>
                      setProfileData({ ...profileData, linkedinUrl: e.target.value })
                    }
                    placeholder={profileData.linkedinUrl ? "" : "https://linkedin.com/in/yourprofile"}
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
                      <SelectTrigger>
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
                      placeholder={profileData.stateProvince ? "" : "Enter state/province"}
                    />
                  </div>
                  <div>
                    <Label>City <span className="text-destructive">*</span></Label>
                    <Input
                      value={profileData.city || ""}
                      onChange={(e) =>
                        setProfileData({ ...profileData, city: e.target.value })
                      }
                      placeholder={profileData.city ? "" : "Enter city"}
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Country Code</Label>
                    <Input
                      value={profileData.countryCode}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div>
                    <Label>Phone Number <span className="text-destructive">*</span></Label>
                    <Input
                      value={profileData.phoneNumber || ""}
                      onChange={(e) =>
                        setProfileData({ ...profileData, phoneNumber: e.target.value })
                      }
                      placeholder={profileData.phoneNumber ? "" : "Enter phone number"}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
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
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Profile
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => navigate("/manage-certifications")}
                    variant="outline"
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Change Password */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Change Password
                </CardTitle>
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
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Change Password
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EditProfile;
