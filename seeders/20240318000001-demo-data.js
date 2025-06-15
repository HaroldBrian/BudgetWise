module.exports = {
  up: async (queryInterface) => {
    const userId = 1;
<<<<<<< HEAD
<<<<<<< HEAD
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
=======
    const currentMonth = new Date().toISOString().slice(0, 7);
>>>>>>> 96b1fd7 (update)
=======
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
>>>>>>> 08099d2 (updateé)

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

    // Créer les alertes
    await queryInterface.bulkInsert(
      "alerts",
      [
        {
          id: 1,
          transaction_id: 2,
          threshold: 1000.0,
          active: true,
        },
        {
          id: 2,
          transaction_id: 3,
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

  down: async (queryInterface) => {
    await queryInterface.bulkDelete("reports", null, {});
    await queryInterface.bulkDelete("alerts", null, {});
    await queryInterface.bulkDelete("transactions", null, {});
    await queryInterface.bulkDelete("budgets", null, {});
  },
};
