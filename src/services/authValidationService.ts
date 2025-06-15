
import { checkRegistrationStatus } from './userService';
import { getAppSettings } from './configurationService';
import { validateSignupCode } from './signupCodeService';

interface ValidationResult {
  valid: boolean;
  message: string;
}

/**
 * Centralized service to validate all prerequisites for a new user signup.
 * This includes checking for existing registration and validating signup codes if required.
 * @param email The user's email.
 * @param code The user's signup code (can be an empty string).
 * @returns A promise that resolves to a validation result object.
 */
export const validateSignupPrerequisites = async (
  email: string,
  code: string,
): Promise<ValidationResult> => {
  // 1. Check if user is already registered.
  const registrationCheck = await checkRegistrationStatus(email);
  if (registrationCheck.error) {
    return { valid: false, message: registrationCheck.error };
  }
  if (registrationCheck.isRegistered) {
    return {
      valid: false,
      message: 'An account with this email already exists. Please sign in.',
    };
  }

  // 2. Check if signup codes are required by the application settings.
  try {
    const settings = await getAppSettings();
    const requireCodes = settings?.require_signup_code || false;

    if (requireCodes) {
      if (!code || !email) {
        return { valid: false, message: 'Email and signup code are required' };
      }

      // 3. Validate the signup code.
      const validation = await validateSignupCode(code, email);
      if (!validation.valid) {
        return { valid: false, message: validation.message };
      }
    }
  } catch (err) {
    console.error('Error during signup prerequisite validation:', err);
    // This is a system/config error, not a user input error.
    return { valid: false, message: 'Could not verify signup requirements. Please try again later.' };
  }

  // All checks passed.
  return { valid: true, message: 'Validation successful.' };
};
