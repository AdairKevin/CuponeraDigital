const bienvenida = document.getElementById("bienvenida");
const btnSaltarBienvenida = document.getElementById("saltar-bienvenida");

const DURACION_BIENVENIDA = 10000; // 10 segundos
const inicioBienvenida = performance.now();

let cuponesListos = false;
let bienvenidaTerminada = false;
let temporizadorBienvenida;

function ocultarBienvenida() {
  // Evita cerrar la bienvenida más de una vez.
  if (bienvenidaTerminada) return;

  bienvenidaTerminada = true;

  clearTimeout(temporizadorBienvenida);

  bienvenida.classList.add("oculta");
  bienvenida.setAttribute("aria-hidden", "true");
}

function intentarTerminarBienvenida() {
  // Espera a que los cupones estén cargados.
  if (!cuponesListos || bienvenidaTerminada) return;

  const tiempoTranscurrido = performance.now() - inicioBienvenida;
  const tiempoRestante = Math.max(0, DURACION_BIENVENIDA - tiempoTranscurrido);

  clearTimeout(temporizadorBienvenida);

  temporizadorBienvenida = setTimeout(() => {
    ocultarBienvenida();
  }, tiempoRestante);
}

// El usuario puede saltar la animación en cualquier momento.
btnSaltarBienvenida.addEventListener("click", () => {
  ocultarBienvenida();
});

async function cargarCupones() {
  const contenedor = document.getElementById("lista-cupones");

  try {
    const response = await fetch(API_URL);

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "No se pudieron cargar los cupones.");
    }

    mostrarCupones(data.cupones);
  } catch (error) {
    console.error(error);

    contenedor.innerHTML = `
            <p class="error">
                No pudimos cargar tus cupones.
            </p>
        `;
  } finally {
    cuponesListos = true;
    intentarTerminarBienvenida();
  }
}

function mostrarCupones(cupones) {
  // Buscar el contenedor donde aparecerán los cupones
  const contenedor = document.getElementById("lista-cupones");

  // Limpiar los cupones anteriores
  contenedor.innerHTML = "";

  // Ordenar los cupones por el campo "orden"
  cupones.sort((a, b) => Number(a.orden) - Number(b.orden));

  // Crear cada cupón
  cupones.forEach((cupon) => {
    // Crear el artículo
    const card = document.createElement("article");

    // Clase principal
    card.className = "cupon";

    // Comprobar si el cupón está disponible
    const disponible = String(cupon.estado).toUpperCase() === "DISPONIBLE";

    // Si ya fue utilizado
    if (!disponible) {
      card.classList.add("canjeado");
    }

    card.className = `cupon ${obtenerClaseTier(cupon.tier)}`;
    // Crear el contenido del cupón
    card.innerHTML = `

      <div class="cupon-contenido">

        <span class="cupon-tier">
          ${cupon.tier}
        </span>

        <h2>
          ${cupon.titulo}
        </h2>


        <p>
          ${cupon.descripcion}
        </p>


        ${
          disponible
            ? `

              <button
                class="btn-canjear"
                data-cupon-id="${cupon.id}"
              >
                CANJEAR
              </button>

            `
            : `

              <div class="cupon-usado">
                ✓ CUPÓN CANJEADO
              </div>

              ${
                cupon.fecha_canje
                  ? `
                    <small>
                      ${cupon.fecha_canje}
                    </small>
                  `
                  : ""
              }

            `
        }

      </div>

      <div class="cupon-lateral">

        <span class="lateral-text">
          ${cupon.id}
        </span>


        <span class="lateral-id">
          
        </span>

      </div>

    `;

    // Agregar el cupón al contenedor
    contenedor.appendChild(card);
  });
}

document.getElementById("lista-cupones").addEventListener("click", (evento) => {
  const boton = evento.target.closest("[data-cupon-id]");

  if (!boton || canjeEnProceso) return;

  const tarjeta = boton.closest(".cupon");
  const titulo = tarjeta.querySelector("h2")?.textContent.trim();
  const descripcion = tarjeta.querySelector("p")?.textContent.trim();

  prepararCanje(
    boton.dataset.cuponId,
    titulo || "Nuestro momento",
    descripcion,
  );
});

async function canjearCupon(couponId) {
  const confirmar = confirm(
    "¿Quieres canjear este cupón?\n\n" +
      "Una vez canjeado, ya no podrá utilizarse nuevamente.",
  );

  if (!confirmar) {
    return;
  }

  try {
    const url =
      API_URL + "?action=redeem&couponId=" + encodeURIComponent(couponId);

    const response = await fetch(url);

    const data = await response.json();

    console.log("Respuesta del canje:", data);

    if (!data.success) {
      alert(data.error || "No se pudo canjear el cupón.");

      return;
    }

    alert(
      "❤️ ¡Cupón canjeado!\n\n" + data.titulo + "\n\n" + "Disfrútenlo mucho.",
    );

    // Volver a consultar Google Sheets
    await cargarCupones();
  } catch (error) {
    console.error("Error al canjear:", error);

    alert("No pudimos conectar con la cuponera.\n\n" + "Inténtalo nuevamente.");
  }
}

function obtenerClaseTier(tier) {
  const nombre = String(tier)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");

  return `tier-${nombre}`;
}

cargarCupones();
