// Webhook Event Schema for CoFund Personal Finance App
// This schema defines the structure for logging webhook events
// -- Created: 2025-01-15
// -- Author: Suhaib Aden

const webhookEventSchema = {
  tableName: 'webhook_events',
  
  // SQL for creating the webhook_events table
  createTableSQL: `
    CREATE TABLE IF NOT EXISTS webhook_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      
      -- Webhook Information
      webhook_id VARCHAR(255) NOT NULL,
      event_type VARCHAR(100) NOT NULL,
      source VARCHAR(50) DEFAULT 'teller' CHECK (source IN ('teller', 'plaid', 'other')),
      
      -- Event Data
      payload JSONB NOT NULL,
      headers JSONB,
      
      -- Processing Information
      processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      processing_status VARCHAR(20) DEFAULT 'success' CHECK (processing_status IN ('success', 'failed', 'skipped')),
      error_message TEXT,
      retry_count INTEGER DEFAULT 0,
      
      -- Timestamps
      timestamp TIMESTAMP WITH TIME ZONE,
      received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,
  
  // Indexes for better query performance
  indexes: [
    'CREATE INDEX IF NOT EXISTS idx_webhook_events_webhook_id ON webhook_events(webhook_id);',
    'CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON webhook_events(event_type);',
    'CREATE INDEX IF NOT EXISTS idx_webhook_events_source ON webhook_events(source);',
    'CREATE INDEX IF NOT EXISTS idx_webhook_events_timestamp ON webhook_events(timestamp);',
    'CREATE INDEX IF NOT EXISTS idx_webhook_events_received_at ON webhook_events(received_at);',
    'CREATE INDEX IF NOT EXISTS idx_webhook_events_processing_status ON webhook_events(processing_status);',
    'CREATE INDEX IF NOT EXISTS idx_webhook_events_type_timestamp ON webhook_events(event_type, timestamp DESC);'
  ],
  
  // Row Level Security (RLS) policies for Supabase
  // Note: Webhook events are system-level, so we'll allow service role access
  rlsPolicies: [
    'ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;',
    '-- Service role can manage all webhook events',
    'CREATE POLICY "Service role can manage webhook events" ON webhook_events FOR ALL USING (current_setting(\'request.jwt.claims\', true)::json->>\'role\' = \'service_role\');',
    '-- Admin users can view webhook events',
    'CREATE POLICY "Admin users can view webhook events" ON webhook_events FOR SELECT USING (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.role = \'admin\'));'
  ],
  
  // Validation rules
  validation: {
    webhook_id: {
      required: true,
      type: 'string',
      maxLength: 255
    },
    event_type: {
      required: true,
      type: 'string',
      maxLength: 100
    },
    source: {
      required: false,
      type: 'string',
      enum: ['teller', 'plaid', 'other']
    },
    payload: {
      required: true,
      type: 'object'
    },
    headers: {
      required: false,
      type: 'object'
    },
    processing_status: {
      required: false,
      type: 'string',
      enum: ['success', 'failed', 'skipped']
    },
    error_message: {
      required: false,
      type: 'string'
    },
    retry_count: {
      required: false,
      type: 'integer',
      min: 0,
      max: 10
    },
    timestamp: {
      required: false,
      type: 'date'
    }
  }
};

module.exports = webhookEventSchema;