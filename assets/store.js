import { normalizePhone } from "./phone.js";

const form = document.querySelector("#callback");
const phone = form.elements.phone;
const source = form.dataset.source;
const phoneError = document.querySelector("#phone-error");
const status = document.querySelector("#form-status");
const submit = form.querySelector('[type="submit"]');
const pack = form.elements.interest;
const prices = document.querySelectorAll("[data-pack]");
let busy = false;

function goal(id) {
  window.ym?.(110874795, "reachGoal", id, { product: source });
}

function selectPack(value) {
  if (!pack || !value) return;
  pack.value = value;
  const selected = pack.selectedOptions?.[0];
  if (!selected) return;
  document.querySelector("#hero-price").textContent = selected.dataset.price;
  for (const button of prices) {
    button.setAttribute("aria-pressed", String(button.dataset.pack === value));
  }
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("a,button");
  if (!link) return;
  if (link.matches('a[href^="tel:"]')) goal("phone_click");
  if (link.getAttribute("href") === "#request" && form.hidden) {
    form.hidden = false;
    status.textContent = "";
  }
  if (link.dataset.pack || link.dataset.order)
    selectPack(link.dataset.pack || link.dataset.order);
  if (link.getAttribute("href") === "#request" && !form.hidden) {
    phone.focus({ preventScroll: true });
  }
});
pack?.addEventListener("change", () => selectPack(pack.value));
phone.addEventListener("input", () => {
  phone.removeAttribute("aria-invalid");
  phoneError.textContent = "";
});

form.hidden = false;
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (busy || form.hidden) return;
  const number = normalizePhone(phone.value);
  if (!number) {
    phone.setAttribute("aria-invalid", "true");
    phoneError.textContent = "Укажите полный номер, например +7 913 123-45-67.";
    phone.focus();
    return;
  }
  busy = true;
  submit.disabled = true;
  status.textContent = "Отправляем заявку…";
  const data = Object.fromEntries(new FormData(form));
  try {
    const response = await fetch("https://grib-orders.borozdov.workers.dev", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, source, phone: number, contact: number }),
    });
    if (!response.ok || (await response.text()).trim() !== "OK")
      throw new Error();
  } catch {
    status.textContent =
      "Не удалось подтвердить отправку. Попробуйте ещё раз или позвоните Сергею.";
    return;
  } finally {
    busy = false;
    submit.disabled = false;
  }
  form.hidden = true;
  const selectedWeight = pack?.value;
  form.reset();
  if (selectedWeight) selectPack(selectedWeight);
  status.textContent = "Заявка принята. Сергей перезвонит вам в течение дня.";
  status.focus();
  goal("callback_sent");
});
