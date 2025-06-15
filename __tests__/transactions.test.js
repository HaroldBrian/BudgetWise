/* eslint-disable no-unused-vars */
const request = require("supertest");
const app = require("../server");
const { sequelize, User, Transaction } = require("../src/models");

describe("Transactions Endpoints", () => {
  let user;
  let sessionCookie;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    user = await User.create({
      name: "Harold brian",
      email: "harold.brian@app.com",
      password: "password123",
    });

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "harold.brian@app.com",
      password: "password123",
    });
    sessionCookie = loginResponse.headers["set-cookie"];
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await Transaction.destroy({ where: {} });
    await User.destroy({ where: {} });
  });

  describe("POST /api/transactions", () => {
    it("ne devrait pas créer de transaction sans authentification", async () => {
      const transactionData = {
        type: "expense",
        amount: 50.0,
        date: "2024-01-15",
      };

      const response = await request(app)
        .post("/api/transactions")
        .send(transactionData)
        .expect(401 || 302);

      expect(response.body.success).toBe(false);
    });
  });
});
