/**
 * HealthCore — validation.js
 * Validación del formulario de solicitud de atención médica.
 * Sin dependencias externas. JS vainilla.
 */

(function () {
  "use strict";

  /* ============================================================== */
  /* CONFIGURACIÓN                                                   */
  /* ============================================================== */

  const FORM_ID = "hc-form";
  const ERROR_CLASS = "border-red-400";
  const ERROR_BG_CLASS = "bg-red-50";
  const SUCCESS_CLASS = "border-green-400";
  const SUCCESS_BG_CLASS = "bg-green-50";
  const ERROR_TEXT_CLASS = "text-red-500";
  const ERROR_MSG_ID_PREFIX = "error-";

  /* ============================================================== */
  /* REGLAS DE VALIDACIÓN                                            */
  /* ============================================================== */

  const validators = {
    /** Campo de texto obligatorio */
    requiredText: (value) => {
      if (!value || value.trim() === "") return "Este campo es obligatorio.";
      return null;
    },

    /** Correo electrónico */
    email: (value) => {
      if (!value || value.trim() === "") return "Este campo es obligatorio.";
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!re.test(value.trim())) return "Ingrese un correo electrónico válido (ej: correo@ejemplo.com).";
      return null;
    },

    /** Teléfono */
    phone: (value) => {
      if (!value || value.trim() === "") return "Este campo es obligatorio.";
      // Acepta: +56 9 1234 5678, +56912345678, 1234-5678, +1 (555) 123-4567, etc.
      const digits = value.replace(/\D/g, "");
      if (digits.length < 7) return "Ingrese un número de teléfono válido (mínimo 7 dígitos).";
      return null;
    },

    /** Fecha de nacimiento */
    date: (value) => {
      if (!value) return "Este campo es obligatorio.";
      const dateObj = new Date(value);
      if (isNaN(dateObj.getTime())) return "Ingrese una fecha válida.";
      if (dateObj > new Date()) return "La fecha no puede ser posterior a hoy.";
      // Mayoría de edad simple: 12 años como mínimo razonable para atención médica
      const minDate = new Date();
      minDate.setFullYear(minDate.getFullYear() - 120);
      if (dateObj < minDate) return "Verifique la fecha de nacimiento.";
      return null;
    },

    /** Select obligatorio */
    requiredSelect: (value) => {
      if (!value || value === "") return "Seleccione una opción.";
      return null;
    },

    /** Radio button group obligatorio */
    requiredRadio: (name) => {
      const checked = document.querySelector(`input[name="${name}"]:checked`);
      if (!checked) return "Seleccione una opción.";
      return null;
    },
  };

  /* ============================================================== */
  /* MAPA DE CAMPOS A VALIDAR                                        */
  /* ============================================================== */

  const fieldsToValidate = [
    { id: "fullname", validators: [validators.requiredText] },
    { id: "birthdate", validators: [validators.date] },
    { id: "sex", validators: [validators.requiredSelect], isSelect: true },
    { id: "email", validators: [validators.email] },
    { id: "phone", validators: [validators.phone] },
    { id: "address", validators: [validators.requiredText] },
  ];

  // Radio groups
  const radioGroups = [
    { name: "has_allergies", conditionalId: "allergy_description" },
    { name: "has_chronic", conditionalId: "chronic_description" },
    { name: "has_insurance", conditionalId: "insurance_name" },
  ];

  /* ============================================================== */
  /* FUNCIONES AUXILIARES                                            */
  /* ============================================================== */

  /** Crea o actualiza el mensaje de error debajo de un campo */
  function setFieldError(input, message) {
    const wrapper = input.closest(".error-wrapper") || input.parentElement;
    const existingMsg = wrapper.querySelector(`.${ERROR_TEXT_CLASS}`);

    // Remover clases de éxito
    input.classList.remove(SUCCESS_CLASS, SUCCESS_BG_CLASS);

    if (message) {
      // Añadir clases de error
      input.classList.add(ERROR_CLASS, ERROR_BG_CLASS);

      if (!existingMsg) {
        const msgEl = document.createElement("p");
        msgEl.className = `${ERROR_TEXT_CLASS} text-xs mt-1.5 ${ERROR_MSG_ID_PREFIX}${input.id || input.name}`;
        msgEl.setAttribute("role", "alert");
        msgEl.textContent = message;
        wrapper.appendChild(msgEl);
      } else {
        existingMsg.textContent = message;
      }
    } else {
      // Sin error: limpiar
      input.classList.remove(ERROR_CLASS, ERROR_BG_CLASS);
      if (existingMsg) existingMsg.remove();
    }
  }

  /** Marca un campo como válido visualmente */
  function setFieldSuccess(input) {
    const wrapper = input.closest(".error-wrapper") || input.parentElement;
    const existingMsg = wrapper.querySelector(`.${ERROR_TEXT_CLASS}`);
    if (existingMsg) existingMsg.remove();
    input.classList.remove(ERROR_CLASS, ERROR_BG_CLASS);

    // Solo marcar éxito si el campo tiene valor
    if (input.value && input.value.trim() !== "") {
      input.classList.add(SUCCESS_CLASS, SUCCESS_BG_CLASS);
    } else {
      input.classList.remove(SUCCESS_CLASS, SUCCESS_BG_CLASS);
    }
  }

  /** Obtiene el valor de un campo por ID */
  function getValue(id) {
    const el = document.getElementById(id);
    return el ? el.value : "";
  }

  /** Muestra error en un grupo de radio buttons */
  function setRadioGroupError(name, message) {
    const firstRadio = document.querySelector(`input[name="${name}"]`);
    if (!firstRadio) return;

    const wrapper = firstRadio.closest(".error-wrapper") || firstRadio.closest("fieldset") || firstRadio.parentElement;
    const existingMsg = wrapper.querySelector(`.${ERROR_TEXT_CLASS}[data-radio="${name}"]`);

    if (message) {
      if (!existingMsg) {
        const msgEl = document.createElement("p");
        msgEl.className = `${ERROR_TEXT_CLASS} text-xs mt-1.5`;
        msgEl.setAttribute("data-radio", name);
        msgEl.setAttribute("role", "alert");
        msgEl.textContent = message;
        // Insertar después del último label del grupo
        const labels = wrapper.querySelectorAll(`input[name="${name}"]`);
        if (labels.length > 0) {
          const lastLabel = labels[labels.length - 1].closest("label") || labels[labels.length - 1];
          lastLabel.parentElement?.appendChild(msgEl);
        }
      }
    } else {
      if (existingMsg) existingMsg.remove();
    }
  }

  /* ============================================================== */
  /* VALIDACIÓN DE CAMPO INDIVIDUAL                                  */
  /* ============================================================== */

  function validateField(field) {
    const input = document.getElementById(field.id);
    if (!input) return true;

    const value = field.isSelect ? input.value : input.value;
    let firstError = null;

    for (const validator of field.validators) {
      const error = validator(value);
      if (error) {
        firstError = error;
        break;
      }
    }

    if (firstError) {
      setFieldError(input, firstError);
      return false;
    }

    setFieldSuccess(input);
    return true;
  }

  /* ============================================================== */
  /* VALIDACIÓN DE GRUPOS RADIO                                      */
  /* ============================================================== */

  function validateRadioGroup(name, conditionalId) {
    const error = validators.requiredRadio(name);
    const hasError = error !== null;

    if (hasError) {
      setRadioGroupError(name, error);
    } else {
      setRadioGroupError(name, null);
    }

    // Validación condicional del campo asociado
    const checked = document.querySelector(`input[name="${name}"]:checked`);
    const conditionalField = document.getElementById(conditionalId);

    if (conditionalField) {
      if (checked && checked.value === "si") {
        // Si respondió "Sí", el campo descriptivo es obligatorio
        const condValue = conditionalField.value.trim();
        if (!condValue) {
          setFieldError(conditionalField, "Por favor, proporcione más información.");
          return false;
        } else {
          setFieldSuccess(conditionalField);
        }
      } else {
        // Si respondió "No" o no ha respondido, limpiar error del condicional
        setFieldError(conditionalField, null);
      }
    }

    return !hasError;
  }

  /* ============================================================== */
  /* VALIDACIÓN COMPLETA DEL FORMULARIO                              */
  /* ============================================================== */

  function validateAll() {
    let isValid = true;

    // Validar campos estándar
    for (const field of fieldsToValidate) {
      if (!validateField(field)) isValid = false;
    }

    // Validar grupos de radio
    for (const group of radioGroups) {
      if (!validateRadioGroup(group.name, group.conditionalId)) isValid = false;
    }

    return isValid;
  }

  /* ============================================================== */
  /* LIMPIAR ERRORES DE UN CAMPO (al escribir)                       */
  /* ============================================================== */

  function clearFieldErrorOnInput(input, fieldConfig) {
    input.addEventListener("input", function () {
      if (fieldConfig) {
        validateField(fieldConfig);
      }
    });

    input.addEventListener("blur", function () {
      if (fieldConfig) {
        validateField(fieldConfig);
      }
    });

    input.addEventListener("change", function () {
      if (fieldConfig) {
        validateField(fieldConfig);
      }
    });
  }

  function clearRadioErrorOnChange(name) {
    const radios = document.querySelectorAll(`input[name="${name}"]`);
    radios.forEach((radio) => {
      radio.addEventListener("change", function () {
        const group = radioGroups.find((g) => g.name === name);
        if (group) {
          validateRadioGroup(group.name, group.conditionalId);
        }
      });
    });
  }

  /* ============================================================== */
  /* MOSTrar / OCULTAR SECCIONES CONDICIONALES                       */
  /* ============================================================== */

  function setupConditionalFields() {
    radioGroups.forEach((group) => {
      const conditionalField = document.getElementById(group.conditionalId);
      if (!conditionalField) return;

      const wrapper = conditionalField.closest(".w-full");
      if (!wrapper) return;

      // Escuchar cambios en los radios
      const radios = document.querySelectorAll(`input[name="${group.name}"]`);
      radios.forEach((radio) => {
        radio.addEventListener("change", function () {
          if (this.value === "si") {
            wrapper.style.opacity = "1";
            wrapper.style.pointerEvents = "auto";
          } else {
            wrapper.style.opacity = "0.5";
            wrapper.style.pointerEvents = "none";
            conditionalField.value = ""; // limpiar
            setFieldError(conditionalField, null);
          }
        });
      });

      // Estado inicial: si no hay selección, atenuar
      const checked = document.querySelector(`input[name="${group.name}"]:checked`);
      if (!checked || checked.value === "no") {
        wrapper.style.opacity = "0.5";
        wrapper.style.pointerEvents = "none";
      }
    });
  }

  /* ============================================================== */
  /* ENVÍO EXITOSO                                                   */
  /* ============================================================== */

  function showSuccessMessage(form) {
    // Ocultar el formulario
    form.style.display = "none";

    // Crear mensaje de éxito
    const successDiv = document.createElement("div");
    successDiv.className = "text-center py-16 px-6 animate-fade-in-up";
    successDiv.setAttribute("role", "status");
    successDiv.setAttribute("aria-live", "polite");

    successDiv.innerHTML = `
      <div class="w-20 h-20 bg-[#14B8A6]/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg class="w-10 h-10 text-[#14B8A6]" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
      <h2 class="text-2xl font-bold text-[#1F2937] mb-3">¡Solicitud enviada con éxito!</h2>
      <p class="text-[#1F2937]/60 max-w-md mx-auto mb-8">
        Hemos recibido tu información. Uno de nuestros especialistas en salud digital
        se comunicará contigo en las próximas 24 a 48 horas hábiles.
      </p>
      <a href="index.html"
         class="inline-block bg-[#2563EB] text-white text-base font-semibold px-8 py-3.5 rounded-xl btn-scale hover:bg-[#1d4ed8] shadow-lg shadow-blue-500/25"
         aria-label="Volver a la página de inicio de HealthCore">
        Volver al inicio
      </a>
    `;

    form.parentElement.appendChild(successDiv);

    // Scroll al mensaje
    successDiv.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  /* ============================================================== */
  /* INICIALIZACIÓN                                                  */
  /* ============================================================== */

  function init() {
    const form = document.getElementById(FORM_ID);
    if (!form) {
      console.warn("HealthCore validation: no se encontró el formulario #hc-form");
      return;
    }

    // 1. Agregar error-wrapper a los contenedores de inputs
    document.querySelectorAll("#hc-form input, #hc-form select, #hc-form textarea").forEach((el) => {
      const parent = el.parentElement;
      if (!parent.classList.contains("error-wrapper")) {
        // Envolver en un div con clase error-wrapper si no lo está ya
        // (lo dejamos como está, el closest buscará hacia arriba)
      }
    });

    // 2. Validación en tiempo real
    for (const field of fieldsToValidate) {
      const input = document.getElementById(field.id);
      if (input) {
        clearFieldErrorOnInput(input, field);
      }
    }

    for (const group of radioGroups) {
      clearRadioErrorOnChange(group.name);
    }

    // 3. Campos condicionales
    setupConditionalFields();

    // 4. Submit
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (validateAll()) {
        showSuccessMessage(form);
      } else {
        // Scroll al primer error
        const firstError = form.querySelector(`.${ERROR_TEXT_CLASS}`);
        if (firstError) {
          firstError.scrollIntoView({ behavior: "smooth", block: "center" });
          // Foco en el input relacionado
          const errorId = firstError.className.match(/error-(\S+)/);
          if (errorId) {
            const errorInput = document.getElementById(errorId[1]);
            if (errorInput) errorInput.focus();
          }
        }
      }
    });
  }

  /* ============================================================== */
  /* ARRANCAR cuando el DOM esté listo                               */
  /* ============================================================== */

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
