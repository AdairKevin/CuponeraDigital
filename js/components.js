const btnAbrir = document.getElementById("btnAbrir");
const btnCerrar = document.getElementById("btnCerrar");
const modal = document.getElementById("modal");
const btnAceptar = document.getElementById("btnAceptar");

btnAbrir.addEventListener("click", () => {
  modal.classList.add("activo");
});

btnAceptar.addEventListener("click", () => {
  modal.classList.remove("activo");
});

const modalConfirmacion = document.getElementById("modal-confirmacion");
const modalResultado = document.getElementById("modal-resultado");

const tituloConfirmacion = document.getElementById("modal-titulo");
const descripcionConfirmacion = document.getElementById("modal-descripcion");

const btnConfirmar = document.getElementById("btn-confirmar");
const btnCancelar = document.getElementById("btn-cancelar");
const btnCerrarResultado = document.getElementById("btn-cerrar-resultado");
const btnAceptarResultado = document.getElementById("btn-aceptar-resultado");

const resultadoContenido = modalResultado.querySelector(".modal-resultado");
const resultadoEtiqueta = document.getElementById("resultado-etiqueta");
const resultadoTitulo = document.getElementById("resultado-titulo");
const resultadoMensaje = document.getElementById("resultado-mensaje");
const animacionCorazon = document.getElementById("animacion-corazon");
const particulas = document.getElementById("particulas");

let cuponPendiente = null;
let canjeEnProceso = false;
let elementoAnterior = null;

// Mostrar un modal.
function abrirModal(modal) {
  modal.classList.add("activo");
  modal.setAttribute("aria-hidden", "false");
}

// Cerrar un modal.
function cerrarModal(modal) {
  modal.classList.remove("activo");
  modal.setAttribute("aria-hidden", "true");
}

// Preparar la confirmación de un cupón.
function prepararCanje(cuponId, titulo, descripcion) {
  if (canjeEnProceso) return;

  elementoAnterior = document.activeElement;
  cuponPendiente = cuponId;

  tituloConfirmacion.textContent = titulo;
  descripcionConfirmacion.textContent =
    descripcion || "Un momento especial nos espera.";

  abrirModal(modalConfirmacion);
  btnConfirmar.focus();
}

// Cancelar la confirmación.
function cancelarCanje() {
  if (canjeEnProceso) return;

  cerrarModal(modalConfirmacion);
  cuponPendiente = null;

  if (elementoAnterior) {
    elementoAnterior.focus();
  }
}

// Estado visual de carga.
function mostrarCarga() {
  resultadoContenido.classList.remove("exito", "error");

  resultadoEtiqueta.textContent = "PREPARANDO ALGO ESPECIAL";
  resultadoTitulo.textContent = "Un momento...";
  resultadoMensaje.textContent = "Estamos preparando tu sorpresa.";

  animacionCorazon.querySelector(".corazon").textContent = "♡";

  particulas.replaceChildren();

  btnAceptarResultado.hidden = true;
  btnCerrarResultado.hidden = true;

  abrirModal(modalResultado);
}

// Mostrar el resultado exitoso.
function mostrarExito(titulo) {
  resultadoContenido.classList.remove("error");
  resultadoContenido.classList.add("exito");

  resultadoEtiqueta.textContent = "UN RECUERDO MÁS JUNTOS";
  resultadoTitulo.textContent = "¡Momento desbloqueado!";
  resultadoMensaje.textContent = `¡El momento "${titulo}" ha sido canjeado! Disfrútenlo mucho.`;

  animacionCorazon.querySelector(".corazon").textContent = "♥";

  btnAceptarResultado.textContent = "¡Qué emoción! ♡";
  btnAceptarResultado.hidden = false;
  btnCerrarResultado.hidden = false;

  crearParticulas();
  btnAceptarResultado.focus();
}

// Mostrar un error.
function mostrarError(mensaje) {
  resultadoContenido.classList.remove("exito");
  resultadoContenido.classList.add("error");

  resultadoEtiqueta.textContent = "UN PEQUEÑO IMPREVISTO";
  resultadoTitulo.textContent = "¡Ups!";
  resultadoMensaje.textContent = mensaje;

  animacionCorazon.querySelector(".corazon").textContent = "♡";

  btnAceptarResultado.textContent = "Entendido";
  btnAceptarResultado.hidden = false;
  btnCerrarResultado.hidden = false;

  btnAceptarResultado.focus();
}

// Crear destellos decorativos.
function crearParticulas() {
  particulas.replaceChildren();

  const simbolos = ["✦", "♡", "✧", "✦", "·", "♡", "✧", "✦"];

  simbolos.forEach((simbolo, indice) => {
    const particula = document.createElement("span");

    particula.className = "particula";
    particula.textContent = simbolo;

    particula.style.setProperty(
      "--mov-x",
      `${(indice % 2 === 0 ? 1 : -1) * (35 + indice * 9)}px`,
    );

    particula.style.setProperty("--mov-y", `${-35 - (indice % 4) * 17}px`);

    particula.style.animationDelay = `${indice * 0.07}s`;

    particulas.appendChild(particula);
  });
}

// Botón de confirmar.
btnConfirmar.addEventListener("click", async () => {
  if (!cuponPendiente || canjeEnProceso) return;

  const cuponId = cuponPendiente;

  canjeEnProceso = true;
  btnConfirmar.disabled = true;
  btnCancelar.disabled = true;

  cerrarModal(modalConfirmacion);
  mostrarCarga();

  try {
    const url =
      API_URL + "?action=redeem&couponId=" + encodeURIComponent(cuponId);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("No pudimos conectar con la cuponera.");
    }

    const data = await response.json();

    if (!data.success) {
      mostrarError(data.error || "Este cupón no se pudo canjear.");
      return;
    }

    mostrarExito(data.titulo || "Tu momento especial");

    // Actualiza el estado real desde Google Sheets.
    await cargarCupones();
  } catch (error) {
    console.error("Error al canjear:", error);

    mostrarError(
      "No pudimos confirmar el canje. Revisa tu conexión e inténtalo de nuevo.",
    );
  } finally {
    canjeEnProceso = false;
    btnConfirmar.disabled = false;
    btnCancelar.disabled = false;
    cuponPendiente = null;
  }
});

// Cerrar o cancelar.
btnCancelar.addEventListener("click", cancelarCanje);

modalConfirmacion.querySelectorAll("[data-cerrar-modal]").forEach((boton) => {
  boton.addEventListener("click", cancelarCanje);
});

function cerrarResultado() {
  cerrarModal(modalResultado);
  resultadoContenido.classList.remove("exito", "error");

  if (elementoAnterior && elementoAnterior.isConnected) {
    elementoAnterior.focus();
  }
}

btnCerrarResultado.addEventListener("click", cerrarResultado);
btnAceptarResultado.addEventListener("click", cerrarResultado);

// Cerrar al pulsar fuera del contenido.
[modalConfirmacion, modalResultado].forEach((modal) => {
  modal.addEventListener("click", (evento) => {
    if (evento.target !== modal) return;

    if (modal === modalConfirmacion) {
      cancelarCanje();
    } else if (!canjeEnProceso) {
      cerrarResultado();
    }
  });
});

// Cerrar con Escape cuando no se está canjeando.
document.addEventListener("keydown", (evento) => {
  if (evento.key !== "Escape" || canjeEnProceso) return;

  if (modalConfirmacion.classList.contains("activo")) {
    cancelarCanje();
  } else if (
    modalResultado.classList.contains("activo") &&
    !btnCerrarResultado.hidden
  ) {
    cerrarResultado();
  }
});
