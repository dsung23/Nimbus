const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const tellerService = require('../services/tellerService');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Verify webhook signature from Teller
 * Teller signs webhooks with your webhook secret
 */
function verifyWebhookSignature(payload, signature, secret) {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature.replace('sha256=', '')),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Main Teller webhook endpoint
 * Handles all webhook events from Teller
 */
// TODO: Add rate limiting middleware here
router.post('/teller', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    console.log('Teller webhook received');
    console.log('Headers:', req.headers);
    
    const signature = req.headers['teller-signature'];
    const secret = process.env.TELLER_WEBHOOK_SECRET;
    
    if (!signature) {
      return res.status(401).json({ 
        error: 'Missing signature',
        timestamp: new Date().toISOString()
      });
    }
    if (!secret) {
      console.error('TELLER_WEBHOOK_SECRET is not set');
      return res.status(500).json({ 
        error: 'Webhook secret not configured',
        timestamp: new Date().toISOString()
      });
    }
    // Verify webhook authenticity
    if (!verifyWebhookSignature(req.body, signature, secret)) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ 
        error: 'Invalid signature',
        timestamp: new Date().toISOString()
      });
    }
    let webhook;
    try {
      webhook = JSON.parse(req.body);
    } catch (parseError) {
      console.error('Invalid JSON in webhook body:', parseError);
      return res.status(400).json({
        error: 'Invalid JSON',
        timestamp: new Date().toISOString()
      });
    }
    console.log('📋 Webhook event:', webhook.type);
    console.log('📋 Webhook ID:', webhook.id);
    console.log('📋 Timestamp:', webhook.timestamp);
    
    // Handle different webhook event types
    switch (webhook.type) {
      case 'enrollment.disconnected':
        await handleEnrollmentDisconnected(webhook);
        break;
        
      case 'transactions.processed':
        await handleTransactionsProcessed(webhook);
        break;
        
      case 'account.number_verification.processed':
        await handleAccountNumberVerificationProcessed(webhook);
        break;
        
      case 'webhook.test':
        await handleWebhookTest(webhook);
        break;
        
      default:
        console.log('Unhandled webhook event type:', webhook.type);
    }
    
    // Log webhook processing
    await logWebhookEvent(webhook);
    
    res.status(200).json({ 
      received: true,
      webhook_id: webhook.id,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ 
      error: 'Webhook processing failed',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Helper function to determine which accounts need syncing based on webhook payload
 */
function getAccountsToSync(allAccounts, affectedAccountIds) {
  // If webhook doesn't specify affected accounts, sync all accounts
  if (!affectedAccountIds || !Array.isArray(affectedAccountIds) || affectedAccountIds.length === 0) {
    console.log('📋 No specific accounts mentioned in webhook, syncing all accounts');
    return allAccounts;
  }

  // Filter to only sync accounts mentioned in webhook
  const accountsToSync = allAccounts.filter(account => 
    affectedAccountIds.includes(account.teller_account_id)
  );

  if (accountsToSync.length === 0) {
    console.log('⚠️ No matching accounts found for specified account IDs in webhook');
    // Fallback to all accounts if no matches found
    return allAccounts;
  }

  console.log(`🎯 Targeting ${accountsToSync.length} specific accounts from webhook payload`);
  return accountsToSync;
}

/**
 * Smart sync for specific accounts using batch processing
 */
async function syncSpecificAccounts(accounts, accessToken) {
  const batchSize = 3; // Process 3 accounts concurrently
  let totalTransactionsSynced = 0;
  const results = {
    accounts: 0,
    transactions: 0,
    errors: []
  };
  
  console.log(`🔄 Starting smart sync for ${accounts.length} accounts (batch size: ${batchSize})`);
  
  // Process accounts in batches
  for (let i = 0; i < accounts.length; i += batchSize) {
    const batch = accounts.slice(i, i + batchSize);
    
    console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(accounts.length / batchSize)} (${batch.length} accounts)`);
    
    // Process batch concurrently
    const batchPromises = batch.map(async (account) => {
      try {
        const result = await tellerService.syncTransactionsForAccount(
          account.id,
          accessToken,
          account.teller_account_id
        );
        
        return {
          accountId: account.id,
          success: true,
          created: result.created,
          updated: result.updated,
          error: null
        };
      } catch (error) {
        console.error(`❌ Error syncing transactions for account ${account.id}:`, error);
        return {
          accountId: account.id,
          success: false,
          created: 0,
          updated: 0,
          error: error.message
        };
      }
    });
    
    // Wait for all accounts in this batch to complete
    const batchResults = await Promise.all(batchPromises);
    
    // Aggregate results
    for (const result of batchResults) {
      if (result.success) {
        totalTransactionsSynced += result.created + result.updated;
        results.accounts++;
        console.log(`✅ Account ${result.accountId}: ${result.created} created, ${result.updated} updated`);
      } else {
        results.errors.push({
          accountId: result.accountId,
          error: result.error
        });
        console.log(`❌ Account ${result.accountId}: failed - ${result.error}`);
      }
    }
    
    // Small delay between batches to prevent overwhelming the API
    if (i + batchSize < accounts.length) {
      await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay for webhooks
    }
  }
  
  results.transactions = totalTransactionsSynced;
  console.log(`✅ Smart sync completed: ${results.accounts} accounts, ${results.transactions} transactions synced`);
  return results;
}

/**
 * Handle enrollment.disconnected event
 * Sent when an enrollment enters a disconnected state
 */
async function handleEnrollmentDisconnected(webhook) {
  console.log('Processing enrollment.disconnected event');
  
  try {
    const { enrollment_id, reason } = webhook.payload;
    
    console.log('Enrollment ID:', enrollment_id);
    console.log('Disconnection reason:', reason);
    
    // Find accounts associated with this enrollment
    const { data: accounts, error } = await supabase
      .from('accounts')
      .select('id, user_id, name, institution')
      .eq('teller_enrollment_id', enrollment_id);
    
    if (error) {
      console.error('Error finding accounts for enrollment:', error);
      return;
    }
    
    if (!accounts || accounts.length === 0) {
      console.log('⚠️ No accounts found for enrollment:', enrollment_id);
      return;
    }
    
    // Update account status based on disconnection reason
    for (const account of accounts) {
      let syncStatus = 'disconnected';
      let notes = `Disconnected: ${reason}`;
      
      // Handle different disconnection reasons
      switch (reason) {
        case 'disconnected.account_locked':
          notes = 'Account locked by financial institution';
          break;
          
        case 'disconnected.credentials_invalid':
          notes = 'Invalid credentials - user needs to reconnect';
          break;
          
        case 'disconnected.enrollment_inactive':
          notes = 'Enrollment became inactive';
          break;
          
        case 'disconnected.user_action.captcha_required':
          notes = 'CAPTCHA required - user needs to complete verification';
          break;
          
        case 'disconnected.user_action.contact_information_required':
          notes = 'Contact information required - user needs to update details';
          break;
          
        case 'disconnected.user_action.insufficient_permissions':
          notes = 'Insufficient permissions - user needs to grant access';
          break;
          
        case 'disconnected.user_action.mfa_required':
          notes = 'Multi-factor authentication required';
          break;
          
        case 'disconnected.user_action.web_login_required':
          notes = 'Web login required - user needs to authenticate via browser';
          break;
          
        default:
          notes = `Disconnected: ${reason}`;
      }
      
      // Update account status
      const { error: updateError } = await supabase
        .from('accounts')
        .update({
          sync_status: syncStatus,
          is_active: false,
          notes: notes,
          last_sync: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', account.id);
      
      if (updateError) {
        console.error('Error updating account status:', updateError);
      } else {
        console.log(`Updated account ${account.name} (${account.institution})`);
      }
      
      // Notify user about disconnection (optional)
      await notifyUserAboutDisconnection(account.user_id, account.name, reason);
    }
    
  } catch (error) {
    console.error('Error handling enrollment.disconnected:', error);
  }
}

/**
 * Handle transactions.processed event
 * Sent when transactions are categorized by Teller's transaction enrichment
 */
async function handleTransactionsProcessed(webhook) {
  console.log('💰 Processing transactions.processed event');
  
  try {
    const { enrollment_id, accounts: affectedAccounts } = webhook.payload;
    
    console.log('Enrollment ID:', enrollment_id);
    console.log('Affected accounts in webhook:', affectedAccounts ? affectedAccounts.length : 'all');
    
    // Find accounts for this enrollment
    const { data: accounts, error } = await supabase
      .from('accounts')
      .select('id, user_id, teller_account_id, teller_enrollment_id, last_sync')
      .eq('teller_enrollment_id', enrollment_id);
    
    if (error || !accounts || accounts.length === 0) {
      console.log('⚠️ No accounts found for enrollment:', enrollment_id);
      return;
    }

    // Get the access token for this enrollment
    const accessToken = await getAccessTokenForEnrollment(enrollment_id);
    
    if (!accessToken) {
      console.error('❌ No access token found for enrollment:', enrollment_id);
      return;
    }

    // Smart sync: only sync specific accounts if mentioned in webhook
    const accountsToSync = getAccountsToSync(accounts, affectedAccounts);
    
    if (accountsToSync.length === 0) {
      console.log('🔄 No accounts need syncing based on webhook payload');
      return;
    }

    console.log(`🔄 Smart sync: processing ${accountsToSync.length}/${accounts.length} accounts`);

    // Use batch sync with targeted accounts
    const syncResult = await syncSpecificAccounts(accountsToSync, accessToken);
    
    console.log(`✅ Smart sync completed for enrollment ${enrollment_id}:`, syncResult);
    
    // Update sync status for processed accounts
    for (const account of accountsToSync) {
      const { error: updateError } = await supabase
        .from('accounts')
        .update({
          sync_status: 'success',
          last_sync: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', account.id);
      
      if (updateError) {
        console.error('Error updating account sync status:', updateError);
      } else {
        console.log(`Updated sync status for account ${account.id}`);
      }
    }
    
  } catch (error) {
    console.error('Error handling transactions.processed:', error);
    
    // Update accounts to failed status if sync fails
    const { enrollment_id } = webhook.payload;
    await supabase
      .from('accounts')
      .update({
        sync_status: 'failed',
        notes: `Webhook sync failed: ${error.message}`,
        updated_at: new Date().toISOString()
      })
      .eq('teller_enrollment_id', enrollment_id);
  }
}

/**
 * Handle account.number_verification.processed event
 * Sent when account details verification via microdeposit has succeeded or expired
 */
async function handleAccountNumberVerificationProcessed(webhook) {
  console.log('Processing account.number_verification.processed event');
  
  try {
    const { enrollment_id, status } = webhook.payload;
    
    console.log('Enrollment ID:', enrollment_id);
    console.log('Verification status:', status);
    
    // Find accounts for this enrollment
    const { data: accounts, error } = await supabase
      .from('accounts')
      .select('id, user_id, name')
      .eq('teller_enrollment_id', enrollment_id);
    
    if (error || !accounts || accounts.length === 0) {
      console.log('⚠️ No accounts found for enrollment:', enrollment_id);
      return;
    }
    
    // Update account verification status
    for (const account of accounts) {
      const verificationStatus = status === 'succeeded' ? 'verified' : 'failed';
      const notes = status === 'succeeded' 
        ? 'Account number verification successful' 
        : 'Account number verification failed or expired';
      
      const { error: updateError } = await supabase
        .from('accounts')
        .update({
          verification_status: verificationStatus,
          notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', account.id);
      
      if (updateError) {
        console.error('Error updating verification status:', updateError);
      } else {
        console.log(`Updated verification status for account ${account.name}`);
      }
      
      // Notify user about verification result
      await notifyUserAboutVerification(account.user_id, account.name, status);
    }
    
  } catch (error) {
    console.error('Error handling account.number_verification.processed:', error);
  }
}

/**
 * Handle webhook.test event
 * Test event triggered from Teller Dashboard
 */
async function handleWebhookTest(webhook) {
  console.log('Processing webhook.test event');
  console.log('Test webhook ID:', webhook.id);
  console.log('Test timestamp:', webhook.timestamp);
  
  // Log test event
  await logWebhookEvent(webhook);
  
  console.log('Webhook test processed successfully');
}

/**
 * Log webhook events for monitoring and debugging
 */
async function logWebhookEvent(webhook) {
  try {
    // You can store webhook events in your database for monitoring
    const { error } = await supabase
      .from('webhook_events')
      .insert({
        webhook_id: webhook.id,
        event_type: webhook.type,
        payload: webhook.payload,
        timestamp: webhook.timestamp,
        processed_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error logging webhook event:', error);
    }
  } catch (error) {
    console.error('Error in logWebhookEvent:', error);
  }
}

/**
 * Notify user about enrollment disconnection
 */
async function notifyUserAboutDisconnection(userId, accountName, reason) {
  try {
    // Get user information
    const { data: user, error } = await supabase
      .from('users')
      .select('email, first_name')
      .eq('id', userId)
      .single();
    
    if (error || !user) {
      console.error('❌ Error getting user for notification:', error);
      return;
    }
    
    // Create notification record
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'account_disconnected',
        title: 'Bank Account Disconnected',
        message: `Your account "${accountName}" has been disconnected. Reason: ${reason}`,
        data: { account_name: accountName, reason: reason },
        created_at: new Date().toISOString()
      });
    
    if (notificationError) {
      console.error('❌ Error creating notification:', notificationError);
    } else {
      console.log(`Notification created for user ${user.email}`);
    }
    
    // You can also send email notifications here
    // await sendEmailNotification(user.email, 'Account Disconnected', message);
    
  } catch (error) {
    console.error('❌ Error in notifyUserAboutDisconnection:', error);
  }
}

/**
 * Notify user about account verification result
 */
async function notifyUserAboutVerification(userId, accountName, status) {
  try {
    const message = status === 'succeeded' 
      ? `Your account "${accountName}" has been successfully verified.`
      : `Account verification for "${accountName}" failed or expired. Please try again.`;
    
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'account_verification',
        title: status === 'succeeded' ? 'Account Verified' : 'Account Verification Failed',
        message: message,
        data: { account_name: accountName, status: status },
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('❌ Error creating verification notification:', error);
    } else {
      console.log(`Verification notification created for account ${accountName}`);
    }
    
  } catch (error) {
    console.error('❌ Error in notifyUserAboutVerification:', error);
  }
}

/**
 * Health check endpoint for webhook testing
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Teller Webhook Handler',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * Test endpoint for manual webhook testing
 */
router.post('/test', (req, res) => {
  console.log('Test webhook endpoint called');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  
  res.json({
    success: true,
    message: 'Test webhook received successfully',
    timestamp: new Date().toISOString(),
    headers: req.headers,
    body: req.body
  });
});

/**
 * Webhook statistics endpoint
 */
router.get('/stats', async (req, res) => {
  try {
    // Get webhook statistics from database
    const { data: stats, error } = await supabase
      .from('webhook_events')
      .select('event_type, timestamp')
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours
    
    if (error) {
      console.error('❌ Error getting webhook stats:', error);
      return res.status(500).json({ error: 'Failed to get statistics' });
    }
    
    // Calculate statistics
    const eventCounts = {};
    stats.forEach(event => {
      eventCounts[event.event_type] = (eventCounts[event.event_type] || 0) + 1;
    });
    
    res.json({
      success: true,
      stats: {
        total_events_24h: stats.length,
        event_breakdown: eventCounts,
        last_event: stats.length > 0 ? stats[stats.length - 1].timestamp : null
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error in webhook stats:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

/**
 * Manual sync endpoint for testing
 * POST /api/webhooks/sync/:enrollment_id
 */
router.post('/sync/:enrollment_id', async (req, res) => {
  try {
    const { enrollment_id } = req.params;
    const { access_token } = req.body;
    
    if (!access_token) {
      return res.status(400).json({ 
        error: 'Access token is required',
        message: 'Please provide access_token in request body'
      });
    }
    
    console.log(`🔄 Manual sync triggered for enrollment: ${enrollment_id}`);
    
    // Trigger sync using the Teller service
    const syncResult = await tellerService.syncAllAccountsForEnrollment(
      enrollment_id, 
      access_token
    );
    
    res.json({
      success: true,
      message: 'Sync completed successfully',
      results: syncResult,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error in manual sync:', error);
    res.status(500).json({ 
      error: 'Sync failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Helper function to get access token for an enrollment
 * In a real application, you would store access tokens securely
 * and associate them with enrollments
 */
async function getAccessTokenForEnrollment(enrollmentId) {
  try {
    // This is a placeholder - in production, you would:
    // 1. Store access tokens securely (encrypted in database)
    // 2. Associate them with enrollments when users connect accounts
    // 3. Handle token refresh if needed
    
    // For now, check if there's a token stored in the database
    // You would need to create a table to store enrollment tokens
    const { data: enrollment, error } = await supabase
      .from('teller_enrollments')
      .select('access_token')
      .eq('enrollment_id', enrollmentId)
      .single();
    
    if (error || !enrollment) {
      console.error('❌ No enrollment found for ID:', enrollmentId);
      return null;
    }
    
    return enrollment.access_token;
  } catch (error) {
    console.error('❌ Error getting access token:', error);
    return null;
  }
}

/**
 * Helper function to store access token for an enrollment
 * This should be called when a user successfully connects their account
 */
async function storeAccessTokenForEnrollment(enrollmentId, accessToken, userId) {
  try {
    const { error } = await supabase
      .from('teller_enrollments')
      .upsert({
        enrollment_id: enrollmentId,
        access_token: accessToken, // In production, encrypt this
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('❌ Error storing access token:', error);
      return false;
    }
    
    console.log('✅ Access token stored for enrollment:', enrollmentId);
    return true;
  } catch (error) {
    console.error('❌ Error in storeAccessTokenForEnrollment:', error);
    return false;
  }
}

module.exports = router;
