import { createVerify, createPublicKey } from "crypto";
import { X509Certificate } from "crypto";

// ── JWT verify (signature check — needs server-side crypto) ──
async function verifyJwt(input) {
  const { token, secret } = input ?? {};
  if (!token) return { error: "token is required" };

  const parts = token.split(".");
  if (parts.length !== 3) return { error: "Malformed JWT — expected 3 parts" };

  try {
    const header = JSON.parse(Buffer.from(parts[0], "base64url").toString());
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());

    // Expiry check
    const now = Math.floor(Date.now() / 1000);
    const expired = payload.exp ? payload.exp < now : null;

    // Signature verification (HS256 only for now — extend for RS256 via JWKS)
    let signatureValid = null;
    if (secret && header.alg === "HS256") {
      const { createHmac } = await import("crypto");
      const data = `${parts[0]}.${parts[1]}`;
      const expected = createHmac("sha256", secret)
        .update(data)
        .digest("base64url");
      signatureValid = expected === parts[2];
    }

    return {
      header,
      payload,
      expired,
      expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : null,
      signatureValid,
      note: !secret ? "Provide a secret to verify the signature" : null,
    };
  } catch {
    return { error: "Failed to parse JWT" };
  }
}

// ── Certificate parser (x509 — genuinely needs Node crypto) ──
function parseCertificate(input) {
  const { pem } = input ?? {};
  if (!pem) return { error: "pem is required" };

  try {
    const cert = new X509Certificate(pem);
    const now = new Date();
    const notBefore = new Date(cert.validFrom);
    const notAfter = new Date(cert.validTo);

    return {
      subject: cert.subject,
      issuer: cert.issuer,
      serialNumber: cert.serialNumber,
      validFrom: cert.validFrom,
      validTo: cert.validTo,
      isExpired: now > notAfter,
      isNotYetValid: now < notBefore,
      daysRemaining: Math.floor((notAfter - now) / 86400000),
      fingerprint: cert.fingerprint,
      fingerprint256: cert.fingerprint256,
      keyType: cert.publicKey.asymmetricKeyType,
      subjectAltNames: cert.subjectAltName ?? null,
    };
  } catch (err) {
    return { error: `Failed to parse certificate: ${err.message}` };
  }
}

export const toolHandlers = {
  "jwt-verify": verifyJwt,
  "cert-parse": parseCertificate,
};
