export const ADMIN_AUTH_URL = import.meta.env.VITE_ADMIN_AUTH_SCRIPT_URL || '';

export async function loginAdmin(email, password) {
    if (!ADMIN_AUTH_URL) {
        console.warn('VITE_ADMIN_AUTH_SCRIPT_URL is not set');
        // For now, fail if not set, or maybe allow a dev bypass?
        return { success: false, message: 'Admin API not configured' };
    }

    try {
        const response = await fetch(ADMIN_AUTH_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ email, password })
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Admin login error:', error);
        return { success: false, message: error.message || 'Login failed' };
    }
}
