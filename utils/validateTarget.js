/**
 * CyberLab — utils/validateTarget.js
 * التحقق من صحة الـ target قبل إرساله لـ Nmap
 * يمنع Command Injection تماماً
 */

'use strict';

// Regex يقبل: IPv4, CIDR, range (192.168.1.1-10), hostname
const VALID_TARGET_RE = /^[a-zA-Z0-9.\-\/,\s]{1,256}$/;

// IPs محظورة — لا يجب فحصها أبداً
const BLOCKED_RANGES = [
  '0.0.0.0',
  '255.255.255.255',
];

/**
 * @param {string} target
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateTarget(target) {
  if (!target || typeof target !== 'string') {
    return { valid: false, reason: 'Target is required' };
  }

  const trimmed = target.trim();

  if (trimmed.length === 0 || trimmed.length > 256) {
    return { valid: false, reason: 'Target length invalid' };
  }

  // منع command injection
  if (!VALID_TARGET_RE.test(trimmed)) {
    return { valid: false, reason: 'Invalid characters in target' };
  }

  // منع shell operators
  const DANGEROUS = [';', '&', '|', '`', '$', '(', ')', '<', '>', '"', "'", '\\'];
  if (DANGEROUS.some(c => trimmed.includes(c))) {
    return { valid: false, reason: 'Dangerous characters detected' };
  }

  if (BLOCKED_RANGES.includes(trimmed)) {
    return { valid: false, reason: 'Target is blocked' };
  }

  return { valid: true };
}

module.exports = { validateTarget };
