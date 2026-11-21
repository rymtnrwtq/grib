import { normalizePhone } from "./phone.js";

const form = document.querySelector("#callback");
const phone = form.elements.phone;
const source = form.dataset.source;
const phoneError = document.querySelector("#phone-error");
const status = document.querySelector("#form-status");
const submit = form.querySelector('[type="submit"]');
const pack = form.elements.interest;
const picker = document.querySelector("#weight-picker");
const prices = document.querySelectorAll("[data-pack]");
let busy = false;

function goal(id) {
  window.ym?.(110874795, "reachGoal", id, { product: source });
}

function selectPack(value) {
  if (!pack || !value) return;
  pack.value = value;
  const selected = form.querySelector('input[name="interest"]:checked');
  if (!selected) return;
  document.querySelector("#weight-current").textContent =
    value + " · " + selected.dataset.price;
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
if (picker) {
  const trigger = picker.querySelector("summary");
  function closePicker() {
    picker.open = false;
    trigger.focus({ preventScroll: true });
  }
  picker.addEventListener("change", () => selectPack(pack.value));
  picker.addEventListener("click", (event) => {
    const option = event.target.closest(".weight-option");
    if (!option || !event.detail) return;
    if (!event.target.matches("input")) event.preventDefault();
    selectPack(option.querySelector("input").value);
    closePicker();
  });
  picker.addEventListener("keydown", (event) => {
    if (event.target === trigger && event.key === "ArrowDown") {
      event.preventDefault();
      picker.open = true;
      picker.querySelector("input:checked").focus();
    } else if (
      picker.open &&
      (event.key === "Escape" ||
        (event.target.matches("input") && ["Enter", " "].includes(event.key)))
    ) {
      event.preventDefault();
      closePicker();
    }
  });
  document.addEventListener("pointerdown", (event) => {
    if (!picker.contains(event.target)) picker.open = false;
  });
  picker.addEventListener("focusout", (event) => {
    if (event.relatedTarget && !picker.contains(event.relatedTarget))
      picker.open = false;
  });
}
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
