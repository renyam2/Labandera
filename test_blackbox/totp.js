// Genera un código TOTP de 6 dígitos a partir de una otpauthUri.
// Uso: node totp.js "otpauth://totp/Labandera?secret=BASE32&issuer=Labandera&period=30"
const crypto = require('crypto');

function base32Decode(input) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  input = input.toUpperCase().replace(/=+$/, '');
  let bits = 0, value = 0;
  const out = [];
  for (const c of input) {
    const idx = alphabet.indexOf(c);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

function totp(secretBuf, timestampSec, period = 30) {
  const counter = Math.floor(timestampSec / period);
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac('sha1', secretBuf).update(msg).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(code % 1e6).padStart(6, '0');
}

const uri = process.argv[2];
if (!uri) {
  console.error('Falta la otpauthUri');
  process.exit(1);
}
const params = new URL(uri).searchParams;
const secret = base32Decode(params.get('secret') || '');
const period = parseInt(params.get('period') || '30', 10);
console.log(totp(secret, Math.floor(Date.now() / 1000), period));
