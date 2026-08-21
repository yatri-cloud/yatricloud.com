import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { getMyPermissions } from "@/lib/admin-users-api";
import { canAccessPath, type AdminRole } from "@/lib/permissions";

interface PermissionsState {
  role: AdminRole | string | null;
  permissions: string[];
  loading: boolean;
  /** Whether the signed-in admin may open `path`. */
  canAccess: (path: string) => boolean;
}

const PermissionsContext = createContext<PermissionsState>({
  role: null,
  permissions: [],
  loading: true,
  canAccess: () => false,
});

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<AdminRole | string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 2500);

    (async () => {
      try {
        const m = await getMyPermissions();
        if (cancelled) return;
        setRole(m.role || "super_admin");
        setPermissions(m.permissions || []);
      } catch {
        if (!cancelled) { setRole("super_admin"); setPermissions([]); }
      } finally {
        if (!cancelled) {
          clearTimeout(timer);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  const canAccess = useCallback(
    (path: string) => canAccessPath(role, permissions, path),
    [role, permissions],
  );

  return (
    <PermissionsContext.Provider value={{ role, permissions, loading, canAccess }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  return useContext(PermissionsContext);
}
