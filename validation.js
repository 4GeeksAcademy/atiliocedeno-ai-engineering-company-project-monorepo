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
  /* REGLAS DE VALIDACIÓN — mensajes específicos y robustos          */
  /* ============================================================== */

  /** Etiqueta legible de cada campo para los mensajes */
  const fieldLabels = {
    fullname: "Nombre completo",
    birthdate: "Fecha de nacimiento",
    sex: "Sexo",
    email: "Correo electrónico",
    phone: "Teléfono",
    address: "Dirección",
    allergy_description: "Descripción de la alergia",
    chronic_description: "Descripción de la enfermedad crónica",
    insurance_name: "Nombre del seguro médico",
  };

  function label(id) {
    return fieldLabels[id] || "Este campo";
  }

  const validators = {
    /** Nombre completo — al menos dos palabras, solo letras y acentos */
    requiredText: (value, id) => {
      const v = (value || "").trim();
      if (!v) return `${label(id)} es obligatorio.`;
      return null;
    },

    fullname: (value) => {
      const v = (value || "").trim();
      if (!v) return "El nombre completo es obligatorio.";
      if (v.length < 5) return "El nombre completo debe tener al menos 5 caracteres.";
      if (v.length > 120) return "El nombre completo no puede exceder los 120 caracteres.";
      if (!/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s.'-]+$/.test(v)) return "El nombre completo solo puede contener letras, espacios, puntos y guiones.";
      if (v.split(/\s+/).length < 2) return "Debe ingresar al menos un nombre y un apellido.";
      return null;
    },

    /** Fecha de nacimiento */
    date: (value) => {
      if (!value) return "La fecha de nacimiento es obligatoria.";
      const dateObj = new Date(value + "T00:00:00");
      if (isNaN(dateObj.getTime())) return "La fecha de nacimiento no es válida. Use el formato DD/MM/AAAA.";
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dateObj > today) return "La fecha de nacimiento no puede ser posterior a la fecha de hoy.";
      if (dateObj.getFullYear() < 1900) return "Verifique la fecha de nacimiento. El año parece incorrecto.";

      // Calcular edad mínima (12 años para atención médica)
      const minAge = new Date();
      minAge.setFullYear(minAge.getFullYear() - 12);
      if (dateObj > minAge) return "Debe tener al menos 12 años para solicitar atención médica.";

      // Edad máxima razonable
      const maxAge = new Date();
      maxAge.setFullYear(maxAge.getFullYear() - 120);
      if (dateObj < maxAge) return "Verifique la fecha de nacimiento. Si tiene más de 120 años, contáctenos directamente.";

      return null;
    },

    /** Select obligatorio */
    requiredSelect: (value, id) => {
      if (!value || value === "") return `Seleccione una opción para ${label(id).toLowerCase()}.`;
      return null;
    },

    /** Correo electrónico — varias capas de validación */
    email: (value) => {
      const v = (value || "").trim();
      if (!v) return "El correo electrónico es obligatorio.";
      if (v.length > 254) return "El correo electrónico no puede exceder los 254 caracteres.";

      // Estructura básica
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!re.test(v)) return "Ingrese un correo electrónico válido (ej: usuario@dominio.com).";

      const [localPart, domain] = v.split("@");

      if (localPart.length > 64) return "La parte local del correo (antes de @) es demasiado larga.";

      // Verificar que el dominio tenga al menos un punto después de @
      if (!domain.includes(".")) return "El dominio del correo debe incluir un punto (ej: correo@dominio.com).";

      // Verificar TLD (última parte después del último punto)
      const parts = domain.split(".");
      const tld = parts[parts.length - 1];
      if (tld.length < 2) return "El dominio del correo debe tener una extensión válida (ej: .com, .es, .org).";

      // Caracteres válidos en local-part
      if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(localPart)) return "El correo contiene caracteres no permitidos en la parte local.";

      // Dominio con caracteres válidos
      if (!/^[a-zA-Z0-9.-]+$/.test(domain)) return "El dominio del correo contiene caracteres no válidos.";

      return null;
    },

    /** Teléfono — validación internacional robusta */
    phone: (value) => {
      const v = (value || "").trim();
      if (!v) return "El número de teléfono es obligatorio.";
      if (v.length < 7) return "El número de teléfono es demasiado corto. Ingrese al menos 7 dígitos.";
      if (v.length > 20) return "El número de teléfono es demasiado largo. Verifique el número ingresado.";

      // Extraer solo dígitos
      const digits = v.replace(/\D/g, "");
      if (digits.length < 7) return "El número de teléfono debe contener al menos 7 dígitos.";
      if (digits.length > 15) return "El número de teléfono no puede tener más de 15 dígitos.";

      // Verificar que no sean solo dígitos repetidos (ej: 1111111111)
      if (/^(\d)\1{6,}$/.test(digits)) return "El número de teléfono no puede ser una secuencia repetitiva.";

      // Verificar caracteres válidos en el formato ingresado
      if (!/^[\d\s\+\-\(\)]+$/.test(v)) return "El teléfono solo puede contener dígitos, espacios, +, -, paréntesis.";

      // Si comienza con +, debe tener el código de país
      if (v.startsWith("+") && digits.length < 8) return "Si incluye el código de país (+), el número debe tener al menos 8 dígitos.";

      return null;
    },

    /** Dirección */
    address: (value) => {
      const v = (value || "").trim();
      if (!v) return "La dirección es obligatoria.";
      if (v.length < 10) return "La dirección es demasiado corta. Incluya calle, número, ciudad y país.";
      if (v.length > 200) return "La dirección no puede exceder los 200 caracteres.";
      if (!/^[a-zA-Z0-9áéíóúüñÁÉÍÓÚÜÑ\s,.#/\-ºª]+$/.test(v)) return "La dirección contiene caracteres no válidos.";
      // Al menos un número en la dirección
      if (!/\d/.test(v)) return "La dirección debe incluir un número (casa, piso, o apartamento).";
      return null;
    },

    /** Radio button group obligatorio */
    requiredRadio: (name) => {
      const labelsMap = {
        has_allergies: "¿Tiene alergias?",
        has_chronic: "¿Padece alguna enfermedad crónica?",
        has_insurance: "¿Tiene seguro médico?",
      };
      const checked = document.querySelector(`input[name="${name}"]:checked`);
      if (!checked) return `Debe responder: ${labelsMap[name] || "esta pregunta"}.`;
      return null;
    },
  };

  /* ============================================================== */
  /* MAPA DE CAMPOS A VALIDAR                                        */
  /* ============================================================== */

  const fieldsToValidate = [
    { id: "fullname", validators: [validators.requiredText, validators.fullname] },
    { id: "birthdate", validators: [validators.date] },
    { id: "sex", validators: [validators.requiredSelect], isSelect: true },
    { id: "email", validators: [validators.email] },
    { id: "phone", validators: [validators.phone] },
    { id: "address", validators: [validators.address] },
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
      const error = validator(value, field.id);
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
        const condLabels = {
          allergy_description: "Por favor, describa sus alergias en detalle.",
          chronic_description: "Por favor, describa su enfermedad crónica.",
          insurance_name: "Por favor, indique el nombre de su seguro médico.",
        };
        if (!condValue) {
          setFieldError(conditionalField, condLabels[conditionalField.id] || "Este campo es obligatorio.");
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
