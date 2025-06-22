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

// Check if environment variables are loaded
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Missing');
  console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'Set' : 'Missing');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing');
}

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Add this to your .env
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

      // Basic validation
      if (!email || !password || !first_name || !last_name || !phone || !date_of_birth) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required: email, password, first_name, last_name, phone, date_of_birth'
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address'
        });
      }

      // Validate password strength
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters long'
        });
      }

      // Validate phone number format
      if (!/^\+?[\d\s\-\(\)]+$/.test(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid phone number'
        });
      }

      // Validate date of birth format and that it's not in the future
      const dobDate = new Date(date_of_birth);
      if (isNaN(dobDate.getTime()) || dobDate > new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid date of birth (YYYY-MM-DD format, not in future)'
        });
      }
      // 18+
      if (dobDate.getFullYear() + 18 > new Date().getFullYear()) {
        return res.status(400).json({
          success: false,
          message: 'You must be at least 18 years old to register'
        });
      }

      // Validate last name is not empty
      if (last_name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Last name cannot be empty'
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

      // Basic validation
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address'
        });
      }

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

      // Validate inputs
      if (first_name && first_name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'First name cannot be empty'
        });
      }

      if (phone && !/^\+?[\d\s\-\(\)]+$/.test(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number format'
        });
      }

      if (date_of_birth && new Date(date_of_birth) > new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Date of birth cannot be in the future'
        });
      }

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
    console.log('🔧 Change Password endpoint called - DUMMY IMPLEMENTATION');
    console.log('Request body:', req.body);
    res.status(200).json({ 
      success: true,
      message: 'Change password endpoint called successfully (dummy implementation)',
      note: 'This is a placeholder - functionality not yet implemented'
    });
  },
  
  resetPassword: async (req, res) => {
    console.log('🔧 Reset Password endpoint called - DUMMY IMPLEMENTATION');
    console.log('Request body:', req.body);
    res.status(200).json({ 
      success: true,
      message: 'Reset password endpoint called successfully (dummy implementation)',
      note: 'This is a placeholder - functionality not yet implemented'
    });
  },
  
  deleteUser: async (req, res) => {
    console.log('🔧 Delete User endpoint called - DUMMY IMPLEMENTATION');
    console.log('Request body:', req.body);
    res.status(200).json({ 
      success: true,
      message: 'Delete user endpoint called successfully (dummy implementation)',
      note: 'This is a placeholder - functionality not yet implemented'
    });
  },
  
  refreshToken: async (req, res) => {
    console.log('🔧 Refresh Token endpoint called - DUMMY IMPLEMENTATION');
    console.log('Request body:', req.body);
    res.status(200).json({ 
      success: true,
      message: 'Refresh token endpoint called successfully (dummy implementation)',
      note: 'This is a placeholder - functionality not yet implemented'
    });


    //possible implementtation
    // try {
    //   const { refresh_token } = req.body;
  
    //   if (!refresh_token) {
    //     return res.status(400).json({
    //       success: false,
    //       message: 'Refresh token is required'
    //     });
    //   }
  
    //   // Use Supabase to refresh the token
    //   const { data, error } = await supabase.auth.refreshSession({
    //     refresh_token: refresh_token
    //   });
  
    //   if (error) {
    //     return res.status(401).json({
    //       success: false,
    //       message: 'Invalid or expired refresh token'
    //     });
    //   }
  
    //   res.status(200).json({
    //     success: true,
    //     message: 'Token refreshed successfully',
    //     auth: {
    //       access_token: data.session.access_token,
    //       refresh_token: data.session.refresh_token,
    //       expires_at: data.session.expires_at
    //     }
    //   });
  
    // } catch (error) {
    //   console.error('Token refresh error:', error);
    //   res.status(500).json({
    //     success: false,
    //     message: 'Internal server error',
    //     error: error.message
    //   });
  }
}; 