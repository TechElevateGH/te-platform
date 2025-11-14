/**
 * Get the appropriate user endpoint based on user role
 * 
 * @param {number} userRole - The user's role (1=Member, 2=Referrer, 3=Volunteer, 4=Lead, 5=Admin)
 * @param {string} userId - The user's ID
 * @returns {string} The appropriate API endpoint path with query parameters
 */
export const getUserEndpoint = (userRole, userId) => {
    // Coerce role to number to ensure switch matches numeric cases
    const storedRole = sessionStorage.getItem('userRole');
    const effectiveRoleRaw = userRole ?? (storedRole ? parseInt(storedRole) : undefined);
    const effectiveRole = Number(effectiveRoleRaw);

    // Fallback to member (1) if coercion produced NaN or 0
    const role = [1,2,3,4,5].includes(effectiveRole) ? effectiveRole : 1;

    switch (role) {
        case 1: // Member
            return `/users/${userId}`;
        case 2: // Referrer (query param on /users)
            return `/users?referrer_id=${userId}`;
        case 3: // Volunteer
            return `/users?volunteer_id=${userId}`;
        case 4: // Lead
        case 5: // Admin
            return `/users?lead_id=${userId}`;
        default:
            return `/users/${userId}`; // Defensive fallback
    }
};

/**
 * Get the base user endpoint prefix based on user role
 * For endpoints like /users/{userId}/resumes, we still use /users
 * Only the profile endpoint needs the role-specific path
 * 
 * @param {number} userRole - The user's role
 * @returns {string} The base endpoint prefix
 */
export const getUserBaseEndpoint = (userRole) => {
    // For now, all sub-endpoints (resumes, essay, cover-letter, applications)
    // still use the /users/{userId} pattern
    // Only the profile fetch uses role-specific endpoints
    return '/users';
};
