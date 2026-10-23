// Utilitas Autentikasi & Session Cookie (Kompatibel dengan Edge Middleware & Node.js)

export const SESSION_COOKIE_NAME = "contractor_admin_session";
const SECRET_KEY =
  process.env.AUTH_SECRET || "vibecoding-contractor-secret-key-2026";

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + SECRET_KEY);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createSessionToken(payload: {
  userId: string;
  email: string;
  name: string;
}): Promise<string> {
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000; // Berlaku 7 hari
  const dataStr = btoa(JSON.stringify({ ...payload, exp }));
  const sig = await hashPassword(dataStr);
  return `${dataStr}.${sig}`;
}

export async function verifySessionToken(token: string | undefined): Promise<{
  userId: string;
  email: string;
  name: string;
} | null> {
  if (!token || !token.includes(".")) return null;
  try {
    const [dataStr, sig] = token.split(".");
    const expectedSig = await hashPassword(dataStr);
    if (sig !== expectedSig) return null;

    const decoded = JSON.parse(atob(dataStr));
    if (Date.now() > decoded.exp) return null;
    return decoded;
  } catch {
    return null;
  }
}
