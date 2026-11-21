import { normalizePhone } from "./assets/phone.js";

const products = {
  retail: "Сушёный белый гриб",
  nuts: "Кедровый орех",
  salted: "Солёный белый гриб",
  wholesale: "Опт · сушёный белый гриб",
};
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

export default {
  async fetch(request, env) {
    const reply = (body, status) => new Response(body, { status, headers });
    if (request.method === "OPTIONS") return reply(null, 204);
    if (request.method !== "POST") return reply("Method not allowed", 405);
    let data;
    try {
      data = await request.json();
    } catch {
      return reply("Invalid JSON", 400);
    }
    const phone = normalizePhone(data?.phone ?? data?.contact);
    if (!phone) return reply("Нужен номер телефона", 422);
    if (!Object.hasOwn(products, data.source))
      return reply("Unknown product", 400);

    const lines = [
      "Обратный звонок · " + products[data.source],
      "Телефон: " + phone,
    ];
    for (const [key, label] of Object.entries({
      interest: "Заказ",
      name: "Имя",
      company: "Компания",
      volume: "Объём и сорт",
      msg: "Комментарий",
    })) {
      if (typeof data[key] === "string" && data[key].trim()) {
        lines.push(
          label + ": " + data[key].trim().slice(0, key === "msg" ? 900 : 180),
        );
      }
    }
    if (!env.BOT_TOKEN || !env.CHAT_ID)
      return reply("Server not configured", 503);
    try {
      const sent = await fetch(
        `https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: env.CHAT_ID,
            text: lines.join("\n"),
          }),
        },
      );
      if (sent.ok && (await sent.json()).ok === true) return reply("OK", 200);
    } catch {
      // The client keeps the customer's input available for another attempt.
    }
    return reply("Telegram unavailable", 502);
  },
};
