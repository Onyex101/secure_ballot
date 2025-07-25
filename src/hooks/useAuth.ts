import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useUIStore } from '@/store/useStore';
import { authAPI, adminAPI } from '@/services/api';

export const useAuth = () => {
  const router = useRouter();
  const { 
    token, 
    user, 
    isAuthenticated, 
    requiresMfa,
    setAuth, 
    logout: logoutStore, 
    updateUser,
    setMfaRequired 
  } = useAuthStore();
  
  const { setLoading, setError, addNotification } = useUIStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [otpState, setOtpState] = useState<{
    userId: string | null;
    email: string | null;
    expiresAt: string | null;
  }>({ userId: null, email: null, expiresAt: null });

  // NEW: Voter login with OTP flow - Step 1: Request login
  const requestVoterLogin = async (nin: string, vin: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authAPI.requestVoterLogin(nin, vin);
      
      if (response.success) {
        const { userId, email, expiresAt } = response.data;
        
        // Store OTP state for step 2
        setOtpState({ userId, email, expiresAt });
        
        addNotification({
          type: 'success',
          message: response.message || 'OTP sent successfully! Check your email.',
        });
        
        return response.data;
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login request failed';
      setError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // NEW: Voter login with OTP flow - Step 2: Verify OTP
  const verifyVoterOTP = async (otpCode: string) => {
    if (!otpState.userId) {
      throw new Error('No OTP session found. Please request login again.');
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await authAPI.verifyVoterOTP(otpState.userId, otpCode);
      
      if (response.success) {
        const { token, user: voter } = response.data;
        
        // Set auth data
        setAuth(token, { ...voter, role: 'voter' });
        
        // Clear OTP state
        setOtpState({ userId: null, email: null, expiresAt: null });
        
        addNotification({
          type: 'success',
          message: 'Login successful!',
        });
        
        router.push('/dashboard');
        return response.data;
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'OTP verification failed';
      setError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // NEW: Resend OTP
  const resendVoterOTP = async () => {
    if (!otpState.userId) {
      throw new Error('No OTP session found. Please request login again.');
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await authAPI.resendVoterOTP(otpState.userId);
      
      if (response.success) {
        const { userId, email, expiresAt } = response.data;
        
        // Update OTP state
        setOtpState({ userId, email, expiresAt });
        
        addNotification({
          type: 'success',
          message: 'New OTP sent successfully!',
        });
        
        return response.data;
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to resend OTP';
      setError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // NEW: Admin login with NIN and password (no OTP required)
  const adminLogin = async (nin: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authAPI.adminLogin(nin, password);
      
      if (response.success) {
        const { token, user: admin } = response.data;
        
        // Set auth data
        setAuth(token, { ...admin, role: 'admin' });
        
        addNotification({
          type: 'success',
          message: 'Admin login successful!',
        });
        
        router.push('/admin/dashboard');
        return response.data;
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Admin login failed';
      setError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // DEPRECATED: Legacy login function (keeping for backward compatibility)
  const login = async (identifier: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authAPI.login(identifier, password);
      
      if (response.success) {
        const { token, voter, requiresMfa } = response.data;
        
        // Set auth data
        setAuth(token, { ...voter, role: 'voter' }, requiresMfa);
        
        if (requiresMfa) {
          // Redirect to MFA verification page
          router.push('/auth/verify-mfa');
        } else {
          addNotification({
            type: 'success',
            message: 'Login successful!',
          });
          router.push('/dashboard');
        }
        
        return response.data;
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      setError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (data: {
    nin: string;
    vin: string;
    phoneNumber: string;
    dateOfBirth: string;
    password: string;
    fullName: string;
    pollingUnitCode: string;
    state: string;
    gender: string;
    lga: string;
    ward: string;
  }) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authAPI.register(data);
      
      if (response.success) {
        addNotification({
          type: 'success',
          message: 'Registration successful! Please login to continue.',
        });
        router.push('/auth/login');
        return response.data;
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Verify MFA
  const verifyMFA = async (userId: string, token: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authAPI.verifyMFA(userId, token);
      
      if (response.success) {
        setMfaRequired(false);
        addNotification({
          type: 'success',
          message: 'MFA verification successful!',
        });
        
        // Redirect based on user role
        if (user?.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/dashboard');
        }
        
        return response.data;
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'MFA verification failed';
      setError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Setup MFA
  const setupMFA = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authAPI.setupMFA();
      
      if (response.success) {
        return response.data;
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to setup MFA';
      setError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Enable MFA
  const enableMFA = async (token: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authAPI.enableMFA(token);
      
      if (response.success) {
        addNotification({
          type: 'success',
          message: 'MFA enabled successfully!',
        });
        return response.data;
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to enable MFA';
      setError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Disable MFA
  const disableMFA = async (token: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authAPI.disableMFA(token);
      
      if (response.success) {
        addNotification({
          type: 'success',
          message: 'MFA disabled successfully!',
        });
        return response.data;
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to disable MFA';
      setError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Generate backup codes
  const generateBackupCodes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authAPI.generateBackupCodes();
      
      if (response.success) {
        addNotification({
          type: 'success',
          message: 'Backup codes generated successfully!',
        });
        return response.data;
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to generate backup codes';
      setError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Verify backup code
  const verifyBackupCode = async (code: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authAPI.verifyBackupCode(code);
      
      if (response.success) {
        setMfaRequired(false);
        addNotification({
          type: 'success',
          message: 'Backup code verification successful!',
        });
        
        // Redirect based on user role
        if (user?.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
        
        return response.data;
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Backup code verification failed';
      setError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh token
  const refreshToken = async () => {
    try {
      const response = await authAPI.refreshToken();
      
      if (response.success) {
        const { token, user: updatedUser } = response.data;
        setAuth(token, updatedUser, requiresMfa);
        return response.data;
      }
    } catch (error: any) {
      // If refresh fails, logout user
      logout();
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      // Use admin logout endpoint for admin users, regular logout for others
      if (user?.role === 'admin') {
        await adminAPI.logout();
      } else {
        await authAPI.logout();
      }
    } catch (error) {
      // Even if logout API fails, clear local state
      console.error('Logout API failed:', error);
    } finally {
      logoutStore();
      addNotification({
        type: 'success',
        message: 'Logged out successfully!',
      });
      // Redirect admin users to admin login, others to home
      if (user?.role === 'admin') {
        router.push('/admin/login');
      } else {
        router.push('/');
      }
      setIsLoading(false);
    }
  };

  // Forgot password
  const forgotPassword = async (identifier: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authAPI.forgotPassword(identifier);
      
      if (response.success) {
        addNotification({
          type: 'success',
          message: 'Password reset instructions sent to your phone/email!',
        });
        return response.data;
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to send reset instructions';
      setError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (token: string, newPassword: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authAPI.resetPassword(token, newPassword);
      
      if (response.success) {
        addNotification({
          type: 'success',
          message: 'Password reset successful! Please login with your new password.',
        });
        router.push('/auth/login');
        return response.data;
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Password reset failed';
      setError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // USSD Authentication
  const ussdAuthenticate = async (nin: string, vin: string, phoneNumber: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authAPI.ussdAuthenticate(nin, vin, phoneNumber);
      
      if (response.success) {
        addNotification({
          type: 'success',
          message: 'USSD authentication initiated! Check your phone for the session code.',
        });
        return response.data;
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'USSD authentication failed';
      setError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Verify USSD session
  const ussdVerifySession = async (sessionCode: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authAPI.ussdVerifySession(sessionCode);
      
      if (response.success) {
        const { token, voter } = response.data;
        setAuth(token, { ...voter, role: 'voter' });
        
        addNotification({
          type: 'success',
          message: 'USSD session verified successfully!',
        });
        router.push('/dashboard');
        return response.data;
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'USSD session verification failed';
      setError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // State
    token,
    user,
    isAuthenticated,
    requiresMfa,
    isLoading,
    otpState,

    // NEW: OTP Authentication Actions
    requestVoterLogin,
    verifyVoterOTP,
    resendVoterOTP,

    // Actions
    login,
    adminLogin,
    register,
    logout,
    verifyMFA,
    setupMFA,
    enableMFA,
    disableMFA,
    generateBackupCodes,
    verifyBackupCode,
    refreshToken,
    forgotPassword,
    resetPassword,
    ussdAuthenticate,
    ussdVerifySession,
    updateUser,

    // Computed values
    isVoter: user?.role === 'voter',
    isAdmin: user?.role === 'admin',
    isVerified: user?.isVerified || false,
    isActive: user?.isActive || false,
  };
}; 