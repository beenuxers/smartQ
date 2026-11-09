/**
 * WhatsApp Business API provider.
 * Uses Cloud API when credentials are set; otherwise logs (dev mode).
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
  const digits = phone.replace(/\D/g, "");
  return digits;
}

export async function sendWhatsApp(input: SendWhatsAppInput): Promise<{
  ok: boolean;
  provider: "meta" | "console";
  messageId?: string;
}> {
  const to = normalizePhone(input.to);
  const body =
    input.kind === "joined"
      ? `SmartQ · ${input.outletName}\nYou're #${input.queueNumber}. ${
          typeof input.partiesAhead === "number"
            ? `${input.partiesAhead} ahead. `
            : ""
        }Track: ${input.positionUrl}`
      : `SmartQ · ${input.outletName}\nTable ready! Please return for #${input.queueNumber}. ${input.positionUrl}`;

  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.info("[whatsapp:dev]", { to, body });
    return { ok: true, provider: "console", messageId: `dev_${Date.now()}` };
  }

  const res = await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { preview_url: true, body },
      }),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    console.error("[whatsapp:error]", err);
    return { ok: false, provider: "meta" };
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
