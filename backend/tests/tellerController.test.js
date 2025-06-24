const request = require('supertest');
const express = require('express');
const tellerController = require('../src/controllers/tellerController');
const tellerService = require('../src/services/tellerService');
const cryptoService = require('../src/utils/crypto');

// Fix: mock getClient before requiring it
jest.mock('../src/utils/database', () => ({
  getClient: jest.fn()
}));
const { getClient } = require('../src/utils/database');

jest.mock('../src/services/tellerService');
jest.mock('../src/utils/crypto');

const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  upsert: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis()
};
getClient.mockReturnValue(mockSupabase);

// Helper to set req.user
const setUser = (req, res, next) => {
  req.user = { id: 'user_123' };
  next();
};

const app = express();
app.use(express.json());
app.use(setUser);
app.post('/api/teller/connect', (req, res) => tellerController.connectAccount(req, res));
app.get('/api/teller/accounts', (req, res) => tellerController.getAccounts(req, res));
app.get('/api/teller/accounts/:accountId/transactions', (req, res) => tellerController.getTransactions(req, res));
app.post('/api/teller/accounts/:accountId/sync', (req, res) => tellerController.syncAccount(req, res));
app.delete('/api/teller/accounts/:accountId', (req, res) => tellerController.disconnectAccount(req, res));
app.get('/api/teller/link', (req, res) => tellerController.createConnectLink(req, res));
app.post('/api/teller/exchange', (req, res) => tellerController.exchangeToken(req, res));

describe('TellerController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getClient.mockReturnValue(mockSupabase);
  });

  describe('connectAccount', () => {
    it('should connect account and sync successfully', async () => {
      cryptoService.encrypt.mockReturnValue('encrypted_token');
      mockSupabase.upsert.mockResolvedValue({ error: null });
      tellerService.syncAccountsForUser.mockResolvedValue({ created: 1 });

      const res = await request(app)
        .post('/api/teller/connect')
        .send({ enrollment_id: 'enr1', access_token: 'tok', institution_name: 'Bank', institution_id: 'bank1' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockSupabase.upsert).toHaveBeenCalled();
      expect(tellerService.syncAccountsForUser).toHaveBeenCalled();
    });
    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/teller/connect')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Missing required fields');
    });
    it('should return 500 if upsert fails', async () => {
      cryptoService.encrypt.mockReturnValue('encrypted_token');
      mockSupabase.upsert.mockResolvedValue({ error: { message: 'fail' } });
      const res = await request(app)
        .post('/api/teller/connect')
        .send({ enrollment_id: 'enr1', access_token: 'tok' });
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to store enrollment');
    });
    it('should return 500 if sync fails', async () => {
      cryptoService.encrypt.mockReturnValue('encrypted_token');
      mockSupabase.upsert.mockResolvedValue({ error: null });
      tellerService.syncAccountsForUser.mockRejectedValue(new Error('sync fail'));
      const res = await request(app)
        .post('/api/teller/connect')
        .send({ enrollment_id: 'enr1', access_token: 'tok' });
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to connect account');
    });
  });

  describe('getAccounts', () => {
    it('should return accounts', async () => {
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.order.mockResolvedValue({ data: [{ id: 'a1' }], error: null });
      const res = await request(app).get('/api/teller/accounts');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.accounts)).toBe(true);
    });
    it('should handle db error', async () => {
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.order.mockResolvedValue({ data: null, error: { message: 'fail' } });
      const res = await request(app).get('/api/teller/accounts');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to fetch accounts');
    });
  });

  describe('getTransactions', () => {
    it('should return transactions', async () => {
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.single.mockResolvedValue({ data: { id: 'a1' }, error: null });
      mockSupabase.from.mockReturnThis();
      mockSupabase.order.mockReturnThis();
      mockSupabase.range.mockResolvedValue({ data: [{ id: 't1' }], error: null });
      const res = await request(app).get('/api/teller/accounts/a1/transactions');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.transactions)).toBe(true);
    });
    it('should 404 if account not found', async () => {
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.single.mockResolvedValue({ data: null, error: { message: 'not found' } });
      const res = await request(app).get('/api/teller/accounts/a1/transactions');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Account not found');
    });
    it('should handle db error', async () => {
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.single.mockResolvedValue({ data: { id: 'a1' }, error: null });
      mockSupabase.from.mockReturnThis();
      mockSupabase.order.mockReturnThis();
      mockSupabase.range.mockResolvedValue({ data: null, error: { message: 'fail' } });
      const res = await request(app).get('/api/teller/accounts/a1/transactions');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to fetch transactions');
    });
  });

  describe('syncAccount', () => {
    it('should sync account successfully', async () => {
      // First query: get account
      const mockAccountQuery = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 'a1', teller_account_id: 'tacc1', teller_enrollment_id: 'enr1' }, error: null })
      };
      
      // Second query: get enrollment
      const mockEnrollmentQuery = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { access_token: 'encrypted' }, error: null })
      };
      
      // Update query
      const mockUpdateQuery = {
        from: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null })
      };
      
      getClient.mockReturnValue(mockAccountQuery)
        .mockReturnValueOnce(mockAccountQuery)
        .mockReturnValueOnce(mockEnrollmentQuery)
        .mockReturnValueOnce(mockUpdateQuery);
      
      cryptoService.decrypt.mockReturnValue('decrypted_token');
      tellerService.syncTransactionsForAccount.mockResolvedValue({ synced: true });
      
      const res = await request(app).post('/api/teller/accounts/a1/sync');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
    it('should 404 if account not found', async () => {
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });
      const res = await request(app).post('/api/teller/accounts/a1/sync');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Account not found');
    });
    it('should 400 if account not connected to Teller', async () => {
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.single.mockResolvedValueOnce({ data: { id: 'a1' }, error: null });
      const res = await request(app).post('/api/teller/accounts/a1/sync');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Account not connected to Teller');
    });
    it('should 400 if enrollment not found', async () => {
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.single.mockResolvedValueOnce({ data: { id: 'a1', teller_account_id: 'tacc1', teller_enrollment_id: 'enr1' }, error: null });
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });
      const res = await request(app).post('/api/teller/accounts/a1/sync');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Enrollment not found');
    });
    it('should 500 if sync fails', async () => {
      // First query: get account
      const mockAccountQuery = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 'a1', teller_account_id: 'tacc1', teller_enrollment_id: 'enr1' }, error: null })
      };
      
      // Second query: get enrollment
      const mockEnrollmentQuery = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { access_token: 'encrypted' }, error: null })
      };
      
      // Update queries
      const mockUpdateQuery1 = {
        from: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null })
      };
      
      const mockUpdateQuery2 = {
        from: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null })
      };
      
      getClient.mockReturnValue(mockAccountQuery)
        .mockReturnValueOnce(mockAccountQuery)
        .mockReturnValueOnce(mockEnrollmentQuery)
        .mockReturnValueOnce(mockUpdateQuery1)
        .mockReturnValueOnce(mockUpdateQuery2);
      
      cryptoService.decrypt.mockReturnValue('decrypted_token');
      tellerService.syncTransactionsForAccount.mockRejectedValue(new Error('fail'));
      
      const res = await request(app).post('/api/teller/accounts/a1/sync');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Sync failed');
    });
  });

  describe('disconnectAccount', () => {
    it('should disconnect account successfully', async () => {
      // Mock call 1: Get account
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.single.mockResolvedValueOnce({ data: { id: 'a1', name: 'Test Account', teller_enrollment_id: 'enr1' }, error: null });
      
      // Mock call 2: Update account (deactivate)
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockResolvedValueOnce({ error: null });
      
      // Mock call 3: Get remaining accounts
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.eq.mockResolvedValueOnce({ data: [], error: null });
      
      // Mock call 4: Update enrollment
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockResolvedValueOnce({ error: null });
      
      const res = await request(app).delete('/api/teller/accounts/a1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
    it('should 404 if account not found', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.single.mockResolvedValue({ data: null, error: { message: 'not found' } });
      const res = await request(app).delete('/api/teller/accounts/a1');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Account not found');
    });
    it('should 500 if update fails', async () => {
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.single.mockResolvedValue({ data: { id: 'a1' }, error: null });
      mockSupabase.from.mockReturnThis();
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockResolvedValue({ error: { message: 'fail' } });
      const res = await request(app).delete('/api/teller/accounts/a1');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to disconnect account');
    });
  });

  describe('createConnectLink', () => {
    it('should create connect link', async () => {
      tellerService.createConnectLink.mockResolvedValue({ connect_url: 'url', enrollment_id: 'enr1' });
      const res = await request(app).get('/api/teller/link');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.connect_url).toBe('url');
    });
    it('should 500 if service fails', async () => {
      tellerService.createConnectLink.mockRejectedValue(new Error('fail'));
      const res = await request(app).get('/api/teller/link');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to create connect link');
    });
  });

  describe('exchangeToken', () => {
    it('should exchange token successfully', async () => {
      tellerService.exchangeToken.mockResolvedValue({ 
        access_token: 'tok',
        enrollment_id: 'enr1',
        institution: { id: 'bank1', name: 'Bank' }
      });
      
      // Mock enrollment upsert
      const mockEnrollmentUpsert = {
        from: jest.fn().mockReturnThis(),
        upsert: jest.fn().mockResolvedValue({ error: null })
      };
      
      getClient.mockReturnValue(mockEnrollmentUpsert);
      cryptoService.encrypt.mockReturnValue('encrypted_token');
      tellerService.syncAccountsForUser.mockResolvedValue({ created: 1 });
      
      const res = await request(app)
        .post('/api/teller/exchange')
        .send({ public_token: 'pub' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
    it('should 500 if service fails', async () => {
      tellerService.exchangeToken.mockRejectedValue(new Error('fail'));
      const res = await request(app)
        .post('/api/teller/exchange')
        .send({ public_token: 'pub' });
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to exchange token');
    });
  });
}); 