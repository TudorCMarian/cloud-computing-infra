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

// ── 3. Cron Expression Translator ──
function translateCron(input) {
  const { expression } = input ?? {};
  if (!expression) return { error: "cron expression is required" };

  try {
    const description = cronstrue.toString(expression, { throwExceptionOnParseError: true });
    return {
      expression,
      description
    };
  } catch (err) {
    return { error: `Invalid cron expression: ${err.toString()}` };
  }
}

// ── 4. JSON to YAML Converter ──
function convertJsonToYaml(input) {
  const { jsonString } = input ?? {};
  if (!jsonString) return { error: "jsonString is required" };

  try {
    // First, ensure it's valid JSON
    const parsedObj = JSON.parse(jsonString);
    // Convert to YAML format
    const yamlString = yaml.dump(parsedObj, { indent: 2 });

    return { yaml: yamlString };
  } catch (err) {
    return { error: `Invalid JSON provided: ${err.message}` };
  }
}

// ── 5. CIDR / Subnet Calculator ──
function calculateCidr(input) {
  const { cidr } = input ?? {};
  if (!cidr) return { error: "cidr block is required (e.g., 10.0.0.0/24)" };

  try {
    const subnet = new IPCIDR(cidr);
    if (!subnet.isValid()) {
      return { error: "Invalid CIDR notation" };
    }

    const info = subnet.toObject();

    return {
      cidr,
      networkAddress: info.start,
      broadcastAddress: info.end,
      totalAddresses: subnet.size,
      usableAddresses: subnet.size > 2 ? subnet.size - 2 : subnet.size,
      netmask: subnet.netmask()
    };
  } catch (err) {
    return { error: `Failed to calculate subnet: ${err.message}` };
  }
}

// ── 6. dos2unix Line Ending Converter ──
function convertDosToUnix(input) {
  const { text } = input ?? {};
  if (!text) return { error: "text is required" };

  // Replaces all Windows CRLF (\r\n) with Unix LF (\n)
  const convertedText = text.replace(/\r\n/g, '\n');

  return {
    originalLength: text.length,
    convertedLength: convertedText.length,
    text: convertedText
  };
}

// ── Export all handlers to the Dispatcher ──
export const toolHandlers = {
  "jwt-verify": verifyJwt,
  "cert-parse": parseCertificate,
  "cron-translate": translateCron,
  "json-to-yaml": convertJsonToYaml,
  "cidr-calc": calculateCidr,
  "dos2unix": convertDosToUnix
};