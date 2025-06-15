const request = require("supertest");
const app = require("../server");
const { sequelize, User } = require("../src/models");

describe("Authentication Endpoints", () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await User.destroy({ where: {} });
  });

  describe("POST /api/auth/register", () => {
    it("Enregistrer un nouvel utilisateur avec succès", async () => {
      const userData = {
        name: "Harold brian",
        email: "harold.brian@app.com",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.name).toBe(userData.name);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.password).toBeUndefined();
    });

    it("Enregistrer un utilisateur avec un email existant", async () => {
      const userData = {
        name: "Harold brian",
        email: "harold.brian@app.com",
        password: "password123",
      };

      // First registration
      await request(app).post("/api/auth/register").send(userData).expect(201);

      // Second registration with same email
      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("existe déjà");
    });

    it("Enregistrer un utilisateur avec des données manquantes", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      await User.create({
        name: "Harold brian",
        email: "harold.brian@app.com",
        password: "password123",
      });
    });

    it("Essayer de se connecter avec des identifiants corrects", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "harold.brian@app.com",
          password: "password123",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe("harold.brian@app.com");
      expect(response.body.data.token).toBeDefined();
    });

    it("Essayer de se connecter avec des identifiants incorrects", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "harold.brian@app.com",
          password: "wrongpassword",
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("incorrect");
    });

    it("Essayer de se connecter avec un utilisateur inexistant", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "password123",
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
