// Database Schemas for CoFund Personal Finance App
// These schemas define the structure for Supabase PostgreSQL tables

const userSchema = require('./userSchema');
const accountSchema = require('./accountSchema');
const transactionSchema = require('./transactionSchema');
const chatSessionSchema = require('./chatSessionSchema');
const chatMessageSchema = require('./chatMessageSchema');

module.exports = {
  userSchema,
  accountSchema,
  transactionSchema,
  chatSessionSchema,
  chatMessageSchema
}; 