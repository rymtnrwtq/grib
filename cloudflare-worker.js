// Cloudflare Worker: принимает заявки с сайта и пересылает их в Telegram.
// Токен бота и chat_id хранятся в Settings → Variables and Secrets на dashboard.cloudflare.com,
// в этот файл они НЕ вписываются — сюда его вставлять нельзя, файл публикуется вместе с сайтом.

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: cors });
    }

    let data;
    try {
      data = await request.json();
    } catch {
      return new Response('Bad request', { status: 400, headers: cors });
    }

    const lines = [];
    if (data.source === 'wholesale') {
      lines.push('🍄 Новая заявка — ОПТ');
      if (data.name) lines.push('Имя: ' + data.name);
      if (data.company) lines.push('Компания: ' + data.company);
      if (data.volume) lines.push('Объём/сорт: ' + data.volume);
      if (data.contact) lines.push('Контакт: ' + data.contact);
    } else if (data.source === 'nuts') {
      lines.push('🌲 Новая заявка — Кедровый орех');
      if (data.interest) lines.push('Интересует: ' + data.interest);
      if (data.msg) lines.push('Сообщение: ' + data.msg);
      if (data.contact) lines.push('Контакт: ' + data.contact);
    } else {
      lines.push('🍄 Новая заявка — Розница (гриб)');
      if (data.interest) lines.push('Интересует: ' + data.interest);
      if (data.msg) lines.push('Сообщение: ' + data.msg);
      if (data.contact) lines.push('Контакт: ' + data.contact);
    }
    const text = lines.join('\n');

    if (!env.BOT_TOKEN || !env.CHAT_ID) {
      return new Response('Server not configured', { status: 500, headers: cors });
    }

    const tgRes = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.CHAT_ID, text }),
    });

    if (!tgRes.ok) {
      return new Response('Telegram error', { status: 502, headers: cors });
    }
    return new Response('OK', { headers: cors });
  },
};
