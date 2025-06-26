// Environment Variables Template for CoFund Backend
// Copy this to a .env file in the backend root directory

module.exports = {
  // Server Configuration
  PORT: process.env.PORT || 4000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Supabase Configuration
  SUPABASE_URL: process.env.SUPABASE_URL || 'your_supabase_project_url',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || 'your_supabase_anon_key',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_supabase_service_role_key',

  // Plaid API Configuration
  PLAID_CLIENT_ID: process.env.PLAID_CLIENT_ID || 'your_plaid_client_id',
  PLAID_SECRET: process.env.PLAID_SECRET || 'your_plaid_secret_key',
  PLAID_ENV: process.env.PLAID_ENV || 'sandbox', // sandbox, development, or production

  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'your_jwt_secret_key_here_make_it_long_and_random',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // LLM API Configuration (Choose one based on your preference)
  // OpenAI Configuration
  GROQ_API_KEY: process.env.GROQ_API_KEY || 'your_groq_api_key',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'your_openai_api_key',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4', // or gpt-3.5-turbo

  // Anthropic Configuration (Alternative to OpenAI)
  // ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || 'your_anthropic_api_key',
  // ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',

  // Redis Configuration (for caching)
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || 'your_redis_password',

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || 900000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS || 100,

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info', // error, warn, info, debug

  // CORS Configuration
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:19006',

  // Security
  BCRYPT_ROUNDS: process.env.BCRYPT_ROUNDS || 12
}; 