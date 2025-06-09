const request = require('supertest');
const app = require('../server');
const { sequelize, User, Transaction } = require('../src/models');
const jwt = require('jsonwebtoken');

describe('Transaction Endpoints', () => {
  let user;
  let authToken;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await Transaction.destroy({ where: {} });
    await User.destroy({ where: {} });

    user = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123'
    });

    authToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  describe('POST /api/transactions', () => {
    it('should create a new transaction', async () => {
      const transactionData = {
        type: 'expense',
        amount: 50.00,
        description: 'Groceries',
        category: 'Food',
        date: '2024-01-15',
        tags: ['grocery', 'essential']
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transactionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transaction.type).toBe(transactionData.type);
      expect(parseFloat(response.body.data.transaction.amount)).toBe(transactionData.amount);
      expect(response.body.data.transaction.tags).toEqual(transactionData.tags);
    });

    it('should not create transaction without authentication', async () => {
      const transactionData = {
        type: 'expense',
        amount: 50.00,
        date: '2024-01-15'
      };

      const response = await request(app)
        .post('/api/transactions')
        .send(transactionData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/transactions', () => {
    beforeEach(async () => {
      await Transaction.bulkCreate([
        {
          user_id: user.id,
          type: 'income',
          amount: 1000.00,
          description: 'Salary',
          category: 'Work',
          date: '2024-01-01'
        },
        {
          user_id: user.id,
          type: 'expense',
          amount: 50.00,
          description: 'Groceries',
          category: 'Food',
          date: '2024-01-02'
        }
      ]);
    });

    it('should get all transactions for authenticated user', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transactions).toHaveLength(2);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should filter transactions by type', async () => {
      const response = await request(app)
        .get('/api/transactions?type=income')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transactions).toHaveLength(1);
      expect(response.body.data.transactions[0].type).toBe('income');
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/transactions?page=1&limit=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transactions).toHaveLength(1);
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.pagination.totalPages).toBe(2);
    });
  });

  describe('PUT /api/transactions/:id', () => {
    let transaction;

    beforeEach(async () => {
      transaction = await Transaction.create({
        user_id: user.id,
        type: 'expense',
        amount: 50.00,
        description: 'Groceries',
        date: '2024-01-15'
      });
    });

    it('should update transaction', async () => {
      const updateData = {
        amount: 75.00,
        description: 'Updated groceries'
      };

      const response = await request(app)
        .put(`/api/transactions/${transaction.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(parseFloat(response.body.data.transaction.amount)).toBe(updateData.amount);
      expect(response.body.data.transaction.description).toBe(updateData.description);
    });

    it('should not update non-existent transaction', async () => {
      const response = await request(app)
        .put('/api/transactions/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 100 })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});