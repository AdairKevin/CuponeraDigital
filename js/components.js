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
