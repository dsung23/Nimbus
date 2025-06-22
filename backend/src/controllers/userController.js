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
    res.status(501).json({ 
      success: false,
      error: 'Not implemented',
      message: 'Change password functionality is not yet implemented'
    });
  },
  
  forgotPassword: async (req, res) => {
    res.status(501).json({ 
      success: false,
      error: 'Not implemented',
      message: 'Forgot password functionality is not yet implemented'
    });
  },
  
  resetPassword: async (req, res) => {
    res.status(501).json({ 
      success: false,
      error: 'Not implemented',
      message: 'Reset password functionality is not yet implemented'
    });
  },
  
  deleteUser: async (req, res) => {
    res.status(501).json({ 
      success: false,
      error: 'Not implemented',
      message: 'Delete user functionality is not yet implemented'
    });
  },
  
  refreshToken: async (req, res) => {
    res.status(501).json({ 
      success: false,
      error: 'Not implemented',
      message: 'Token refresh functionality is not yet implemented'
    });
  }
}; 