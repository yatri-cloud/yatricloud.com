import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { isAuthenticated, isProfileComplete } from "@/lib/yatris-api";
import { fetchMyProfile } from "@/lib/auth";
import { LoginModal } from "@/components/LoginModal";

export const ProfileCompletionGuard = () => {
  const [showModal, setShowModal] = useState(false);
  const [incompleteUser, setIncompleteUser] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    const checkProfile = async () => {
      try {
        if (!isAuthenticated()) {
          if (mounted) {
            setShowModal(false);
            setIncompleteUser(null);
          }
          return;
        }

        const profile = await fetchMyProfile();
        if (!mounted) return;

        if (profile && !isProfileComplete(profile)) {
          setIncompleteUser(profile);
          setShowModal(true);
        } else {
          setShowModal(false);
          setIncompleteUser(null);
        }
      } catch (err) {
        console.error("ProfileCompletionGuard error:", err);
      }
    };

    // Initial check
    checkProfile();

    // Listen to live auth changes (e.g. login, signout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_OUT") {
        if (mounted) {
          setShowModal(false);
          setIncompleteUser(null);
        }
      } else if (event === "SIGNED_IN") {
        await checkProfile();
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  if (!showModal || !incompleteUser) return null;

  return (
    <LoginModal
      isOpen={showModal}
      onClose={() => {}}
      forceOnboarding={true}
      initialUser={incompleteUser}
      onSuccess={() => {
        setShowModal(false);
        setIncompleteUser(null);
      }}
    />
  );
};
