export function turnstileEnabled() {
  return Boolean(
    process.env.TURNSTILE_SECRET_KEY &&
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  );
}

export async function verifyTurnstileToken(
  token: string | undefined | null,
  ip?: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!turnstileEnabled()) {
    return { ok: true };
  }

  if (!token || token.length < 10) {
    return { ok: false, error: "Complete the bot check and try again" };
  }

  const body = new URLSearchParams();
  body.set("secret", process.env.TURNSTILE_SECRET_KEY!);
  body.set("response", token);
  if (ip && ip !== "unknown") body.set("remoteip", ip);

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
      },
    );
    const data = (await res.json()) as {
      success?: boolean;
      "error-codes"?: string[];
    };
    if (!data.success) {
      return { ok: false, error: "Bot check failed — refresh and try again" };
    }
    return { ok: true };
  } catch (err) {
    console.error("turnstile verify failed", err);
    return { ok: false, error: "Bot check unavailable — try again" };
  }
}
