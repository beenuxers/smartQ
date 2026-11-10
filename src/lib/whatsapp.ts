/**
 * WhatsApp Business Cloud API provider.
 * - No credentials → console log (dev).
 * - Credentials + template env → approved utility templates (production).
 * - Credentials only → plain text (fine inside a session; often blocked for cold outreach).
 */

export type WhatsAppMessageKind = "joined" | "table_ready";

export type SendWhatsAppInput = {
  to: string;
  kind: WhatsAppMessageKind;
  outletName: string;
  queueNumber: number;
  positionUrl: string;
  partiesAhead?: number;
};

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function textBody(input: SendWhatsAppInput): string {
  if (input.kind === "joined") {
    return `SmartQ · ${input.outletName}\nYou're #${input.queueNumber}. ${
      typeof input.partiesAhead === "number"
        ? `${input.partiesAhead} ahead. `
        : ""
    }Track: ${input.positionUrl}`;
  }
  return `SmartQ · ${input.outletName}\nTable ready! Please return for #${input.queueNumber}. ${input.positionUrl}`;
}

function templateName(kind: WhatsAppMessageKind): string | undefined {
  const name =
    kind === "joined"
      ? process.env.WHATSAPP_TEMPLATE_JOINED
      : process.env.WHATSAPP_TEMPLATE_TABLE_READY;
  return name?.trim() || undefined;
}

function templatePayload(input: SendWhatsAppInput, name: string) {
  const lang = process.env.WHATSAPP_TEMPLATE_LANG?.trim() || "en";
  // Params must match the approved template body order:
  // joined: {{1}} outlet, {{2}} queue #, {{3}} parties ahead, {{4}} track URL
  // table_ready: {{1}} outlet, {{2}} queue #, {{3}} track URL
  const parameters =
    input.kind === "joined"
      ? [
          { type: "text", text: input.outletName },
          { type: "text", text: String(input.queueNumber) },
          {
            type: "text",
            text: String(
              typeof input.partiesAhead === "number" ? input.partiesAhead : 0,
            ),
          },
          { type: "text", text: input.positionUrl },
        ]
      : [
          { type: "text", text: input.outletName },
          { type: "text", text: String(input.queueNumber) },
          { type: "text", text: input.positionUrl },
        ];

  return {
    messaging_product: "whatsapp",
    to: normalizePhone(input.to),
    type: "template",
    template: {
      name,
      language: { code: lang },
      components: [
        {
          type: "body",
          parameters,
        },
      ],
    },
  };
}

function textPayload(input: SendWhatsAppInput) {
  return {
    messaging_product: "whatsapp",
    to: normalizePhone(input.to),
    type: "text",
    text: { preview_url: true, body: textBody(input) },
  };
}

export async function sendWhatsApp(input: SendWhatsAppInput): Promise<{
  ok: boolean;
  provider: "meta" | "console";
  messageId?: string;
  error?: string;
}> {
  const to = normalizePhone(input.to);
  const body = textBody(input);
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.info("[whatsapp:dev]", { to, body });
    return { ok: true, provider: "console", messageId: `dev_${Date.now()}` };
  }

  const tpl = templateName(input.kind);
  const payload = tpl ? templatePayload(input, tpl) : textPayload(input);

  const res = await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    console.error("[whatsapp:error]", err);
    return {
      ok: false,
      provider: "meta",
      error: err.slice(0, 300),
    };
  }

  const data = (await res.json()) as {
    messages?: Array<{ id: string }>;
  };
  return {
    ok: true,
    provider: "meta",
    messageId: data.messages?.[0]?.id,
  };
}
