import { createClient } from "@/lib/supabase/server";

/**
 * Check if the current user is an admin
 * @returns true if user is admin, false otherwise
 */
export async function isAdmin(): Promise<boolean> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return false;
    }

    const { data: userData } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single();

    return userData?.is_admin ?? false;
}

/**
 * Get the current user's admin status
 * Throws an error if user is not authenticated
 */
export async function requireAdmin(): Promise<void> {
    const adminStatus = await isAdmin();

    if (!adminStatus) {
        throw new Error('Unauthorized: Admin access required');
    }
}

/**
 * Check if a specific user ID is an admin
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
    const supabase = await createClient();

    const { data: userData } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', userId)
        .single();

    return userData?.is_admin ?? false;
}
