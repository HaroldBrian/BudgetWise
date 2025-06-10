const { Op } = require("sequelize");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const userId = 1; // ID de l'utilisateur de démonstration
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    // Créer les budgets
    await queryInterface.bulkInsert(
      "budgets",
      [
        {
          id: 1,
          user_id: userId,
          month: currentMonth,
          amount: 2000.0,
        },
        {
          id: 2,
          user_id: userId,
          month: new Date(new Date().setMonth(new Date().getMonth() - 1))
            .toISOString()
            .slice(0, 7),
          amount: 1800.0,
        },
      ],
      {}
    );

    // Créer les transactions
    const transactions = await queryInterface.bulkInsert(
      "transactions",
      [
        {
          id: 1,
          user_id: userId,
          type: "income",
          amount: 2500.0,
          description: "Salaire",
          category: "Salaire",
          date: new Date(),
          is_recurring: true,
        },
        {
          id: 2,
          user_id: userId,
          type: "expense",
          amount: 800.0,
          description: "Loyer",
          category: "Logement",
          date: new Date(),
          is_recurring: true,
        },
        {
          id: 3,
          user_id: userId,
          type: "expense",
          amount: 150.0,
          description: "Courses",
          category: "Alimentation",
          date: new Date(),
          is_recurring: false,
        },
        {
          id: 4,
          user_id: userId,
          type: "expense",
          amount: 50.0,
          description: "Transport",
          category: "Transport",
          date: new Date(),
          is_recurring: false,
        },
      ],
      {}
    );

    // Créer les alertes
    await queryInterface.bulkInsert(
      "alerts",
      [
        {
          id: 1,
          transaction_id: 2, // Alerte sur le loyer
          threshold: 1000.0,
          active: true,
        },
        {
          id: 2,
          transaction_id: 3, // Alerte sur les courses
          threshold: 200.0,
          active: true,
        },
      ],
      {}
    );

    // Créer les rapports
    await queryInterface.bulkInsert(
      "reports",
      [
        {
          id: 1,
          user_id: userId,
          month: currentMonth,
          pdf_url: "/reports/monthly-report.pdf",
        },
        {
          id: 2,
          user_id: userId,
          month: new Date(new Date().setMonth(new Date().getMonth() - 1))
            .toISOString()
            .slice(0, 7),
          pdf_url: "/reports/previous-month-report.pdf",
        },
      ],
      {}
    );
  },

  down: async (queryInterface, Sequelize) => {
    // Supprimer les données dans l'ordre inverse de leur création
    await queryInterface.bulkDelete("reports", null, {});
    await queryInterface.bulkDelete("alerts", null, {});
    await queryInterface.bulkDelete("transactions", null, {});
    await queryInterface.bulkDelete("budgets", null, {});
  },
};
