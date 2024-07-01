import { createHmac } from 'crypto';
function HMAC_SHA256(key, secret) {
  return createHmac('sha256', key).update(secret);
}

function getCheckString(data) {
  const items = [];

  for (const [k, v] of data.entries()) if (k !== 'hash') items.push([k, v]);

  return items
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
}

export { HMAC_SHA256, getCheckString };
