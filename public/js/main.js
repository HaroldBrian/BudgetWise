// Main JavaScript file for BudgetWise

document.addEventListener("DOMContentLoaded", function () {
  // Password toggle functionality
  const passwordToggles = document.querySelectorAll(".password-toggle");
  passwordToggles.forEach((toggle) => {
    toggle.addEventListener("click", function () {
      const input = this.parentElement.querySelector("input");
      const icon = this.querySelector("i");

      if (input.type === "password") {
        input.type = "text";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
      } else {
        input.type = "password";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
      }
    });
  });

  // Auto-dismiss alerts after 15 seconds
  const alerts = document.querySelectorAll(".alert");
  alerts.forEach((alert) => {
    setTimeout(() => {
      const bsAlert = new bootstrap.Alert(alert);
      bsAlert.close();
    }, 15000);
  });

  // Form validation
  const forms = document.querySelectorAll("form");
  forms.forEach((form) => {
    form.addEventListener("submit", function (e) {
      if (!form.checkValidity()) {
        e.preventDefault();
        e.stopPropagation();
      }
      form.classList.add("was-validated");
    });
  });

  // Modal handling for login/register
  const loginModal = document.getElementById("loginModal");
  const registerModal = document.getElementById("registerModal");

  if (loginModal) {
    loginModal.addEventListener("hidden.bs.modal", function () {
      const form = this.querySelector("form");
      if (form) {
        form.reset();
        form.classList.remove("was-validated");
      }
    });
  }

  if (registerModal) {
    registerModal.addEventListener("hidden.bs.modal", function () {
      const form = this.querySelector("form");
      if (form) {
        form.reset();
        form.classList.remove("was-validated");
      }
    });
  }

  // Handle form submissions with AJAX for login/register
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const formData = new FormData(this);
      const data = Object.fromEntries(formData);

      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (result.success) {
          window.location.href = "/dashboard";
        } else {
          showAlert("danger", result.message);
        }
      } catch (error) {
        showAlert("danger", "Une erreur est survenue lors de la connexion");
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const formData = new FormData(this);
      const data = Object.fromEntries(formData);

      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (result.success) {
          window.location.href = "/dashboard";
        } else {
          showAlert("danger", result.message);
        }
      } catch (error) {
        showAlert("danger", "Une erreur est survenue lors de l'inscription");
      }
    });
  }

  // Function to show alerts
  function showAlert(type, message) {
    const alertContainer = document.createElement("div");
    alertContainer.className = `alert alert-${type} alert-dismissible fade show`;
    alertContainer.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    const container = document.querySelector(".container-alert");
    if (container) {
      container.insertBefore(alertContainer, container.firstChild);

      // Auto-dismiss after 15 seconds
      setTimeout(() => {
        const bsAlert = new bootstrap.Alert(alertContainer);
        bsAlert.close();
      }, 15000);
    }
  }

  // Smooth scrolling for anchor links
  const anchorLinks = document.querySelectorAll('a[href^="#"]');
  anchorLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });

  // Number formatting for currency inputs
  const currencyInputs = document.querySelectorAll(
    'input[type="number"][step="0.01"]'
  );
  currencyInputs.forEach((input) => {
    input.addEventListener("blur", function () {
      if (this.value) {
        this.value = parseFloat(this.value).toFixed(2);
      }
    });
  });

  // Tags input functionality
  const tagsInputs = document.querySelectorAll('input[name="tags"]');
  tagsInputs.forEach((input) => {
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        const value = this.value.trim();
        if (value && !value.endsWith(",")) {
          this.value = value + ", ";
        }
      }
    });
  });
});
