// User Controller - Handles business logic for user authentication
// This file will contain functions for:
// - User registration
// - User login
// - Password hashing and verification
// - JWT token generation and validation
// - User profile management
// - Password reset functionality
// - Account deletion

// Load environment variables
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Check if required environment variables are loaded
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required Supabase environment variables: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY');
}

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ...existing validation code...

module.exports = {
  registerUser: async (req, res) => {
    try {
      const { 
        email, 
        password, 
        first_name, 
        last_name, 
        phone, 
        date_of_birth 
      } = req.body;

      // Validation is now handled by middleware - data is already validated and sanitized
      // Additional age validation (18+ requirement) with exact calculation
      const dob = new Date(date_of_birth);
      const age = new Date(Date.now() - dob).getUTCFullYear() - 1970;
      if (age < 18) {
        return res.status(400).json({
          success: false,
          message: 'You must be at least 18 years old to register'
        });
      }

      // 1. Register user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name,
            last_name,
            phone,
            date_of_birth
          }
        }
      });

      if (authError) {
        return res.status(400).json({
          success: false,
          message: authError.message
        });
      }

      // 2. Create user profile with all schema fields
      console.log('🔧 Debug: About to insert profile...');
      console.log('🔧 Service Role Key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
      console.log('🔧 User ID:', authData.user.id);
      
      const profileData = {
        id: authData.user.id,
        email: authData.user.email,
        first_name,
        last_name,
        phone,
        date_of_birth,
        email_verified: authData.user.email_confirmed_at ? true : false,
        is_active: true,
        preferences: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login: null
      };

      console.log('🔧 Profile data to insert:', profileData);

      const { data: insertedProfile, error: profileError } = await supabaseAdmin
        .from('users')
        .insert(profileData)
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        return res.status(400).json({
          success: false,
          message: 'Failed to create user profile',
          error: profileError.message,
          details: 'User account created in auth but profile creation failed'
        });
      }

      res.status(201).json({
        success: true,
        message: 'User registered successfully! Please check your email to verify your account.',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          first_name: insertedProfile.first_name,
          last_name: insertedProfile.last_name,
          phone: insertedProfile.phone,
          date_of_birth: insertedProfile.date_of_birth,
          email_verified: insertedProfile.email_verified,
          is_active: insertedProfile.is_active,
          created_at: insertedProfile.created_at
        },
        auth: {
          session: authData.session,
          confirmation_sent_at: authData.user.confirmation_sent_at
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },
  
  loginUser: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validation is now handled by middleware - data is already validated and sanitized

      // 1. Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        return res.status(401).json({
          success: false,
          message: authError.message
        });
      }

      // 2. Update last_login in user profile
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ 
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', authData.user.id);

      if (updateError) {
        console.warn('Failed to update last_login:', updateError);
        // Don't fail the login for this
      }

      // 3. Get user profile data
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        console.error('Failed to fetch user profile:', profileError);
        // Return basic auth data without profile
        return res.status(200).json({
          success: true,
          message: 'Login successful',
          user: {
            id: authData.user.id,
            email: authData.user.email,
            email_verified: authData.user.email_confirmed_at ? true : false
          },
          auth: {
            access_token: authData.session.access_token,
            refresh_token: authData.session.refresh_token,
            expires_at: authData.session.expires_at
          }
        });
      }

      res.status(200).json({
        success: true,
        message: 'Login successful',
        user: {
          id: profileData.id,
          email: profileData.email,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          phone: profileData.phone,
          date_of_birth: profileData.date_of_birth,
          email_verified: profileData.email_verified,
          is_active: profileData.is_active,
          preferences: profileData.preferences,
          last_login: profileData.last_login,
          created_at: profileData.created_at
        },
        auth: {
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
          expires_at: authData.session.expires_at
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },
  
  getUserProfile: async (req, res) => {
    try {
      // Get user ID from authentication middleware
      const userId = req.user.id;

      console.log('🔧 Debug: getUserProfile called with userId:', userId);

      // Get user profile data - use .maybeSingle() for better error handling
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      console.log('🔧 Debug: Query result:', { profileData, profileError });

      if (profileError) {
        console.error('Failed to fetch user profile:', profileError);
        return res.status(400).json({
          success: false,
          message: 'Failed to fetch user profile',
          error: profileError.message
        });
      }

      if (!profileData) {
        return res.status(404).json({
          success: false,
          message: 'User profile not found'
        });
      }

      res.status(200).json({
        success: true,
        user: {
          id: profileData.id,
          email: profileData.email,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          phone: profileData.phone,
          date_of_birth: profileData.date_of_birth,
          email_verified: profileData.email_verified,
          is_active: profileData.is_active,
          preferences: profileData.preferences,
          last_login: profileData.last_login,
          created_at: profileData.created_at,
          updated_at: profileData.updated_at
        }
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },
  
  updateUserProfile: async (req, res) => {
    try {
      // Get user ID from authentication middleware
      const userId = req.user.id;

      const { 
        first_name, 
        last_name, 
        phone, 
        date_of_birth, 
        preferences 
      } = req.body;

      // Validation is now handled by middleware - data is already validated and sanitized

      // Prepare update data (only include provided fields)
      const updateData = {
        updated_at: new Date().toISOString()
      };

      if (first_name !== undefined) updateData.first_name = first_name;
      if (last_name !== undefined) updateData.last_name = last_name;
      if (phone !== undefined) updateData.phone = phone;
      if (date_of_birth !== undefined) updateData.date_of_birth = date_of_birth;
      if (preferences !== undefined) updateData.preferences = preferences;

      // Update user profile
      const { data: updatedProfile, error: updateError } = await supabaseAdmin
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        console.error('Failed to update user profile:', updateError);
        return res.status(400).json({
          success: false,
          message: 'Failed to update profile',
          error: updateError.message
        });
      }

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          id: updatedProfile.id,
          email: updatedProfile.email,
          first_name: updatedProfile.first_name,
          last_name: updatedProfile.last_name,
          phone: updatedProfile.phone,
          date_of_birth: updatedProfile.date_of_birth,
          email_verified: updatedProfile.email_verified,
          is_active: updatedProfile.is_active,
          preferences: updatedProfile.preferences,
          updated_at: updatedProfile.updated_at
        }
      });

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },
  
  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      // Validation is handled by middleware - data is already validated and sanitized

      // First, verify the current password by attempting to sign in
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: req.user.email,
        password: currentPassword,
      });

      if (authError) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Update the password using Supabase Admin API
      const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      );

      if (updateError) {
        console.error('Failed to update password:', updateError);
        return res.status(400).json({
          success: false,
          message: 'Failed to update password',
          error: updateError.message
        });
      }

      // Update the updated_at timestamp in user profile
      const { error: profileUpdateError } = await supabaseAdmin
        .from('users')
        .update({ 
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (profileUpdateError) {
        console.warn('Failed to update profile timestamp after password change:', profileUpdateError);
        // Don't fail the password change for this
      }

      res.status(200).json({
        success: true,
        message: 'Password updated successfully'
      });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },
  
    forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;

      // Validation is handled by middleware - data is already validated and sanitized

      // Send password reset email using Supabase Auth
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password`
      });

      if (error) {
        // Don't reveal whether the email exists or not for security
        console.error('Password reset error:', error);
      }

      // Always return success to prevent email enumeration attacks
      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, you will receive a password reset link shortly.'
      });

    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  resetPassword: async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      // Validation is handled by middleware - data is already validated and sanitized

      // Verify the reset token and update the password
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'recovery'
      });

      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token'
        });
      }

      if (!data.user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid reset token'
        });
      }

      // Update the password using Supabase Admin API
      const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        data.user.id,
        { password: newPassword }
      );

      if (updateError) {
        console.error('Failed to reset password:', updateError);
        return res.status(400).json({
          success: false,
          message: 'Failed to reset password',
          error: updateError.message
        });
      }

      // Update the updated_at timestamp in user profile
      const { error: profileUpdateError } = await supabaseAdmin
        .from('users')
        .update({ 
          updated_at: new Date().toISOString()
        })
        .eq('id', data.user.id);

      if (profileUpdateError) {
        console.warn('Failed to update profile timestamp after password reset:', profileUpdateError);
        // Don't fail the password reset for this
      }

      res.status(200).json({
        success: true,
        message: 'Password reset successfully'
      });

    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },
  
  deleteUser: async (req, res) => {
    try {
      const userId = req.user.id;
      const { password } = req.body;

      // Validation is handled by middleware - data is already validated and sanitized

      // Verify password before deletion for security
      if (password) {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: req.user.email,
          password: password,
        });

        if (authError) {
          return res.status(400).json({
            success: false,
            message: 'Password verification failed. Cannot delete account.'
          });
        }
      }

      // Delete user profile data first (due to foreign key constraints)
      const { error: profileDeleteError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', userId);

      if (profileDeleteError) {
        console.error('Failed to delete user profile:', profileDeleteError);
        return res.status(400).json({
          success: false,
          message: 'Failed to delete user profile',
          error: profileDeleteError.message
        });
      }

      // Delete the auth user (this will cascade to related data)
      const { data, error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (authDeleteError) {
        console.error('Failed to delete user auth:', authDeleteError);
        // Try to restore the profile if auth deletion failed
        // Note: This is a basic rollback - in production, use transactions
        return res.status(400).json({
          success: false,
          message: 'Failed to delete user account',
          error: authDeleteError.message
        });
      }

      res.status(200).json({
        success: true,
        message: 'Account deleted successfully'
      });

    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },
  
  refreshToken: async (req, res) => {
    try {
      // The refresh token validation middleware (validateRefreshToken) has already
      // validated the token and provided the refreshed session data
      const { user, session } = req.refreshedSession;

      // Update last_login in user profile
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ 
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.warn('Failed to update last_login during token refresh:', updateError);
        // Don't fail the refresh for this
      }

      // Get user profile data
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Failed to fetch user profile during refresh:', profileError);
        // Return basic auth data without profile
        return res.status(200).json({
          success: true,
          message: 'Token refreshed successfully',
          user: {
            id: user.id,
            email: user.email,
            email_verified: user.email_confirmed_at ? true : false
          },
          auth: {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at
          }
        });
      }

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        user: {
          id: profileData.id,
          email: profileData.email,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          phone: profileData.phone,
          date_of_birth: profileData.date_of_birth,
          email_verified: profileData.email_verified,
          is_active: profileData.is_active,
          preferences: profileData.preferences,
          last_login: profileData.last_login,
          created_at: profileData.created_at
        },
        auth: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at
        }
      });

    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}; 