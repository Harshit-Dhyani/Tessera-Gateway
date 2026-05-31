import { isIP } from 'net';

const pathTraversalRegex = /(\.\.[/\\])+|(\.\.[/\\])+$/;
const dangerousProtocols = new Set(['javascript:', 'data:', 'vbscript:']);
const loopbackHosts = new Set(['localhost', '127.0.0.1', '::1']);

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split('.').map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return false;
  }

  const [first, second] = parts;
  return (
    first === 10 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 169 && second === 254)
  );
}

function isPrivateTarget(hostname: string): boolean {
  if (loopbackHosts.has(hostname)) {
    return false;
  }

  if (isIP(hostname) === 4) {
    return isPrivateIpv4(hostname);
  }

  if (isIP(hostname) === 6) {
    return hostname !== '::1';
  }

  return false;
}

export function validatePath(filePath: string): boolean {
  if (!filePath || typeof filePath !== 'string') {
    return false;
  }

  return !pathTraversalRegex.test(filePath);
}

export function validateUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const parsed = new URL(url);
    const protocol = parsed.protocol.toLowerCase();

    if (dangerousProtocols.has(protocol)) {
      return false;
    }

    if (protocol !== 'https:' && protocol !== 'http:') {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();
    if (loopbackHosts.has(hostname)) {
      return true;
    }

    if (isPrivateTarget(hostname)) {
      return false;
    }

    return protocol === 'https:';
  } catch {
    return false;
  }
}

export function validateHost(host: string): boolean {
  if (!host || typeof host !== 'string') {
    return false;
  }

  try {
    const parsed = new URL(host.includes('://') ? host : `http://${host}`);
    const hostname = parsed.hostname.toLowerCase();
    return loopbackHosts.has(hostname) && !isPrivateTarget(hostname);
  } catch {
    return false;
  }
}
