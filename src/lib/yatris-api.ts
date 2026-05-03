/**
 * Yatris Users API
 * Handles authentication and CRUD operations for certified yatris
 */

// Use proxy API route to avoid CORS issues
// In production, this goes through Vercel serverless function
// Use local proxy server to avoid CORS issues
const API_URL_AUTH = '/api/yatris/auth';
const API_URL_EVENTS = '/api/yatris/events';

interface User {
  email: string;
  fullName: string;
  linkedinUrl?: string;
  photoUrl?: string;
  country?: string;
  stateProvince?: string;
  city?: string;
  countryCode?: string;
  phoneNumber?: string;
}

interface LoginResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
  message?: string;
}

interface RegisterResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
  message?: string;
}

/**
 * Register a new user
 */
export async function registerUser(data: {
  email: string;
  password: string;
  fullName: string;
  linkedinUrl?: string;
  photoUrl?: string;
  country?: string;
  stateProvince?: string;
  city?: string;
  countryCode?: string;
  phoneNumber?: string;
}): Promise<RegisterResponse> {
  try {
    const response = await fetch(API_URL_AUTH, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'register',
        ...data,
      }),
    });

    const result = await response.json();

    // Check if response has an error (even if status is 200)
    if (!response.ok || result.error || !result.success) {
      const errorMessage = result.error || result.message || 'Registration failed';
      console.error('Registration error:', errorMessage, result);
      return {
        success: false,
        error: errorMessage,
      };
    }

    return result;
  } catch (error: any) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: error.message || 'Registration failed. Please check your connection and try again.',
    };
  }
}

/**
 * Login user
 */
export async function loginUser(
  email: string,
  password: string
): Promise<LoginResponse> {
  // Test credentials for development
  const TEST_USER = {
    email: 'test@yatricloud.com',
    password: 'test123',
    user: {
      email: 'test@yatricloud.com',
      fullName: 'Test User',
      linkedinUrl: 'https://linkedin.com/in/testuser',
      photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Test',
      country: 'IN',
      stateProvince: 'Karnataka',
      city: 'Bangalore',
      countryCode: '+91',
      phoneNumber: '9876543210',
    }
  };

  // Check for test credentials first (development only)
  if (email === TEST_USER.email && password === TEST_USER.password) {
    const testToken = 'test_token_' + Date.now();
    localStorage.setItem('yatris_token', testToken);
    localStorage.setItem('yatris_user', JSON.stringify(TEST_USER.user));
    return {
      success: true,
      token: testToken,
      user: TEST_USER.user,
    };
  }

  try {
    const response = await fetch(API_URL_AUTH, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'login',
        email,
        password,
      }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const result = await response.json();

    // Safe storage helper
    const safeSetItem = (key: string, value: string) => {
      try {
        localStorage.setItem(key, value);
      } catch (e: any) {
        if (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014) {
          console.warn('LocalStorage quota exceeded. Clearing old cache...');
          // Clear large items
          // Iterate over all keys and remove certification caches
          Object.keys(localStorage).forEach(k => {
            if (k.startsWith('yatris_user_certifications_')) {
              localStorage.removeItem(k);
            }
          });

          // Try again
          try {
            localStorage.setItem(key, value);
          } catch (retryError) {
            console.error('Failed to save to localStorage even after cleanup', retryError);
          }
        }
      }
    };

    // Store token if login successful
    if (result.success && result.token) {
      safeSetItem('yatris_token', result.token);
      safeSetItem('yatris_user', JSON.stringify(result.user));
    }

    return result;
  } catch (error: any) {
    console.error('Login error:', error);
    return {
      success: false,
      error: error.message || 'Login failed',
    };
  }
}

/**
 * Login or Register with Google
 */
export async function googleLogin(userProfile: {
  email: string;
  fullName: string;
  photoUrl: string;
}): Promise<LoginResponse> {
  try {
    const response = await fetch(API_URL_AUTH, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'googleLogin',
        email: userProfile.email,
        fullName: userProfile.fullName,
        photoUrl: userProfile.photoUrl
      }),
    });

    if (!response.ok) {
      throw new Error("Google login failed");
    }

    const result = await response.json();
    if (result.success && result.token) {
      localStorage.setItem("yatris_token", result.token);
      localStorage.setItem("yatris_user", JSON.stringify(result.user));
    }
    return result;
  } catch (error: any) {
    return { success: false, error: error.message || "Network error" };
  }
}

/**
 * Get current user from token
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const token = localStorage.getItem('yatris_token');
    if (!token) return null;

    const response = await fetch(`${API_URL_AUTH}?action=getUser&token=${token}`);

    if (!response.ok) {
      // Token might be invalid, clear it
      localStorage.removeItem('yatris_token');
      localStorage.removeItem('yatris_user');
      return null;
    }

    const result = await response.json();
    if (result.success && result.user) {
      localStorage.setItem('yatris_user', JSON.stringify(result.user));
      return result.user;
    }

    return null;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

/**
 * Get user certifications from all provider sheets
 * Fetches from separate provider sheets (AWS, Azure, GCP, etc.) and filters by user email
 * Uses caching for immediate loading
 */
export async function getUserCertifications(): Promise<any[]> {
  try {
    const user = getStoredUser();
    if (!user || !user.email) {
      return [];
    }

    // Load from cache immediately for instant display
    const cacheKey = `yatris_user_certifications_${user.email}`;
    const cacheTimestampKey = `yatris_user_certifications_timestamp_${user.email}`;
    const cacheMaxAge = 10 * 60 * 1000; // 10 minutes (increased for better persistence)

    try {
      const cachedData = localStorage.getItem(cacheKey);
      const cachedTimestamp = localStorage.getItem(cacheTimestampKey);

      if (cachedData) {
        try {
          const parsedData = JSON.parse(cachedData);
          if (parsedData && Array.isArray(parsedData) && parsedData.length > 0) {
            const age = cachedTimestamp ? (Date.now() - parseInt(cachedTimestamp, 10)) : Infinity;
            if (age < cacheMaxAge) {
              // Return cached data immediately, but fetch fresh data in background
              fetchFreshCertifications(user.email, cacheKey, cacheTimestampKey);
              return parsedData;
            }
          }
        } catch (parseError) {
          console.warn("Error parsing cached data:", parseError);
        }
      }
    } catch (cacheError) {
      console.warn("Error loading from cache:", cacheError);
    }

    // Fetch fresh data if no valid cache
    return await fetchFreshCertifications(user.email, cacheKey, cacheTimestampKey);
  } catch (error) {
    console.error('Get user certifications error:', error);
    return [];
  }
}

/**
 * Fetch fresh certifications and cache them
 */
async function fetchFreshCertifications(
  userEmail: string,
  cacheKey: string,
  cacheTimestampKey: string
): Promise<any[]> {
  // Import fetchCertifications dynamically to avoid circular dependency
  const { fetchCertifications } = await import('./google-sheets');

  // Fetch all certifications from all provider sheets
  const allCertifications = await fetchCertifications();

  // Filter by user's email (case-insensitive, trim whitespace)
  const userCerts = allCertifications.filter(cert => {
    if (!cert.email) return false;
    const certEmail = cert.email.toLowerCase().trim();
    const userEmailLower = userEmail.toLowerCase().trim();
    const matches = certEmail === userEmailLower;
    if (!matches && allCertifications.length < 50) {
      // Debug: log mismatches for first few certs
      console.log(`🔍 Email mismatch: cert="${certEmail}" vs user="${userEmailLower}"`);
    }
    return matches;
  });

  console.log(`🔍 Filtering certifications for email: ${userEmail}`);
  console.log(`📊 Total certifications fetched: ${allCertifications.length}`);
  console.log(`📊 User certifications found: ${userCerts.length}`);
  if (userCerts.length > 0) {
    console.log(`✅ Sample certification:`, {
      name: userCerts[0].certificationName,
      provider: userCerts[0].certificationProvider,
      email: userCerts[0].email,
    });
  } else if (allCertifications.length > 0) {
    // Show sample of all certs to debug
    console.log(`⚠️ No matches found. Sample certifications:`, allCertifications.slice(0, 3).map(c => ({
      name: c.certificationName,
      email: c.email,
      provider: c.certificationProvider
    })));
  }

  // Add a unique ID for each certification
  const result = userCerts.map((cert, index) => ({
    ...cert,
    id: `${cert.certificationProvider}-${cert.examCode}-${cert.email}-${index}`,
    _originalIndex: index,
  }));

  // Cache the result
  try {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(result));
      localStorage.setItem(cacheTimestampKey, Date.now().toString());
    } catch (e: any) {
      if (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014) {
        console.warn('LocalStorage quota exceeded while caching certs. Clearing old cache...');
        // Clear ALL certification caches to make space
        Object.keys(localStorage).forEach(k => {
          if (k.startsWith('yatris_user_certifications_')) {
            localStorage.removeItem(k);
          }
        });
        // Try one more time, but only for this key
        try {
          localStorage.setItem(cacheKey, JSON.stringify(result));
          localStorage.setItem(cacheTimestampKey, Date.now().toString());
        } catch (retryError) {
          console.warn('Could not cache certifications even after cleanup. Proceeding without cache.');
        }
      }
    }
  } catch (cacheError) {
    console.warn("Error caching certifications:", cacheError);
  }

  return result;
}

/**
 * Submit certification
 */
export async function submitCertification(data: {
  certificationProvider: string;
  certificationName: string;
  examCode: string;
  certificationDate: string;
  verifiedCredential?: string;
  additionalNotes?: string;
}): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const token = localStorage.getItem('yatris_token');
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(API_URL_AUTH, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'submitCertification',
        token,
        ...data,
      }),
    });

    if (!response.ok) {
      throw new Error('Submission failed');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Submit certification error:', error);
    return {
      success: false,
      error: error.message || 'Submission failed',
    };
  }
}

/**
 * Update user profile
 */
export async function updateProfile(data: {
  fullName?: string;
  linkedinUrl?: string;
  photoUrl?: string;
  country?: string;
  stateProvince?: string;
  city?: string;
  countryCode?: string;
  phoneNumber?: string;
}): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const token = localStorage.getItem('yatris_token');
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(API_URL_AUTH, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'updateProfile',
        token,
        ...data,
      }),
    });

    if (!response.ok) {
      throw new Error('Update failed');
    }

    const result = await response.json();

    // Update stored user data
    if (result.success) {
      const currentUser = JSON.parse(localStorage.getItem('yatris_user') || '{}');
      const updatedUser = { ...currentUser, ...data };
      try {
        localStorage.setItem('yatris_user', JSON.stringify(updatedUser));
      } catch (e) {
        console.warn('Could not update stored user profile due to storage limits', e);
      }
    }

    return result;
  } catch (error: any) {
    console.error('Update profile error:', error);
    return {
      success: false,
      error: error.message || 'Update failed',
    };
  }
}

/**
 * Logout user
 */
export function logout(): void {
  localStorage.removeItem('yatris_token');
  localStorage.removeItem('yatris_user');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const token = localStorage.getItem('yatris_token');
  return !!token;
}

/**
 * Update certification
 */
export async function updateCertification(
  certificationId: number,
  data: {
    certificationProvider?: string;
    certificationName?: string;
    examCode?: string;
    certificationDate?: string;
    verifiedCredential?: string;
    additionalNotes?: string;
  }
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const token = localStorage.getItem('yatris_token');
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(API_URL_AUTH, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'updateCertification',
        token,
        certificationId,
        ...data,
      }),
    });

    if (!response.ok) {
      throw new Error('Update failed');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Update certification error:', error);
    return {
      success: false,
      error: error.message || 'Update failed',
    };
  }
}

/**
 * Delete certification
 */
export async function deleteCertification(
  certificationId: number
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const token = localStorage.getItem('yatris_token');
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(API_URL_AUTH, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'deleteCertification',
        token,
        certificationId,
      }),
    });

    if (!response.ok) {
      throw new Error('Delete failed');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Delete certification error:', error);
    return {
      success: false,
      error: error.message || 'Delete failed',
    };
  }
}

/**
 * Change password
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const token = localStorage.getItem('yatris_token');
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(API_URL_AUTH, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'changePassword',
        token,
        currentPassword,
        newPassword,
      }),
    });

    if (!response.ok) {
      throw new Error('Password change failed');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Change password error:', error);
    return {
      success: false,
      error: error.message || 'Password change failed',
    };
  }
}

/**
 * Change email
 */
export async function changeEmail(
  currentPassword: string,
  newEmail: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const token = localStorage.getItem('yatris_token');
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(API_URL_AUTH, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'changeEmail',
        token,
        currentPassword,
        newEmail,
      }),
    });

    if (!response.ok) {
      throw new Error('Email change failed');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Change email error:', error);
    return {
      success: false,
      error: error.message || 'Email change failed',
    };
  }
}

/**
 * Get stored user
 */
export function getStoredUser(): User | null {
  try {
    const userStr = localStorage.getItem('yatris_user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}

/**
 * Check if user profile has all mandatory fields filled
 * Google login users will have incomplete profiles (missing linkedin, country, phone, etc.)
 */
export function isProfileComplete(user: User | null): boolean {
  if (!user) return false;
  return !!(
    user.linkedinUrl &&
    user.country &&
    user.stateProvince &&
    user.city &&
    user.phoneNumber
  );
}

// Event Registration Types
export interface Attendee {
  name: string;
  email: string;
  phone?: string;
  ticketId: string;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  eventSlug?: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  eventImage: string;
  registrationDate: string;
  attendees: Attendee[];
  totalAmount: number;
  status: 'confirmed' | 'cancelled';
}

/**
 * Register for an event
 * Stores registration in localStorage for persistence
 */
export async function registerForEvent(
  event: { id: string; name: string; date: string; location: any; imageUrl: string },
  attendees: Omit<Attendee, 'ticketId'>[]
): Promise<{ success: boolean; message?: string; registrationId?: string }> {
  try {
    const user = getStoredUser();
    if (!user) {
      return { success: false, message: 'You must be logged in to register.' };
    }

    // Get current token
    const token = localStorage.getItem('yatris_token');

    const response = await fetch(API_URL_EVENTS, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'registerEvent',
        token: token, // Send token for auth validation if needed by script, or just user email
        email: user.email,
        userName: user.fullName,
        phone: user.phoneNumber,
        eventId: event.id,
        eventName: event.name,
        tickets: 1, // Default to 1 for now, or sum from attendees
        totalAmount: 0,
        attendees: attendees
      })
    });

    const result = await response.json();

    if (result.success) {
      // Optimistically update local cache if we want, but for now just return success
      // We can invalidate cache here
      localStorage.removeItem(`yatris_registrations_${user.email}`);
    }

    return result;

  } catch (error: any) {
    console.error('Registration error:', error);
    return { success: false, message: error.message || 'Registration failed' };
  }
}

/**
 * Get registered events for current user
 */
export async function getRegisteredEvents(): Promise<EventRegistration[]> {
  try {
    const user = getStoredUser();
    if (!user) return [];

    // Try to fetch from API
    try {
      const response = await fetch(`${API_URL_EVENTS}?action=getRegisteredEvents&email=${encodeURIComponent(user.email)}`);
      const result = await response.json();
      if (result.success && result.data) {
        return result.data;
      }
    } catch (e) {
      console.warn("Failed to fetch events from API, falling back to empty", e);
    }

    return [];
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return [];
  }
}

/**
 * Fetch all published events from Google Sheets API
 */
export async function fetchPublishedEvents(): Promise<any[]> {
  try {
    const response = await fetch(API_URL_EVENTS, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action: 'getEvents' })
    });
    const result = await response.json();
    if (result.success && result.data) {
      return result.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching published events:', error);
    return [];
  }
}
