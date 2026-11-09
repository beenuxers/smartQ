import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 8);

export function makeOutletSlug(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
  return `${base || "outlet"}-${nanoid()}`;
}

export function makePartyToken() {
  return customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 12)();
}
