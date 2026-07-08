"use client";

import { makeReg } from "./_util";
import {
  PasswordGenerator, PasswordStrength, PasswordEntropy, HashGenerator, HmacGenerator, AesTool,
  TokenGenerator, PassphraseGenerator, CaesarCipher, Rot47, Crc32, HashIdentifier,
} from "@/components/tools/impl/security";
import {
  BcryptGenerator, NtlmHashGenerator, TotpGenerator, Argon2HashGenerator, HtpasswdGenerator,
} from "@/components/tools/impl/security-advanced";
import { UuidGenerator, JwtDecoder } from "@/components/tools/impl/data";
import { QrGenerator } from "@/components/tools/impl/generators";

export default makeReg({
  "password-generator": () => <PasswordGenerator />,
  "bulk-password-generator": () => <PasswordGenerator bulk />,
  "password-strength-checker": PasswordStrength,
  "password-entropy-calculator": PasswordEntropy,
  "md5-hash-generator": () => <HashGenerator algo="MD5" />,
  "sha1-hash-generator": () => <HashGenerator algo="SHA1" />,
  "sha256-hash-generator": () => <HashGenerator algo="SHA256" />,
  "sha512-hash-generator": () => <HashGenerator algo="SHA512" />,
  "base64-hash-generator": () => <HashGenerator algo="SHA256" base64 />,
  "hmac-generator": HmacGenerator,
  "aes-encrypt-decrypt": AesTool,
  "passphrase-generator": PassphraseGenerator,
  "secure-uuid-generator": UuidGenerator,
  "api-key-generator": () => <TokenGenerator kind="api" />,
  "random-token-generator": () => <TokenGenerator kind="token" />,
  "csrf-token-generator": () => <TokenGenerator kind="csrf" />,
  "pin-generator": () => <TokenGenerator kind="pin" />,
  "salt-generator": () => <TokenGenerator kind="salt" />,
  "encryption-key-generator": () => <TokenGenerator kind="key" />,
  "caesar-cipher": CaesarCipher,
  "rot47-encoder-decoder": Rot47,
  "crc32-generator": Crc32,
  "hash-identifier": HashIdentifier,
  "wifi-qr-code-generator": () => <QrGenerator wifi />,
  "jwt-verifier": JwtDecoder,
  "bcrypt-generator": BcryptGenerator,
  "ntlm-hash-generator": NtlmHashGenerator,
  "totp-generator": TotpGenerator,
  "argon2-hash-generator": Argon2HashGenerator,
  "htpasswd-generator": HtpasswdGenerator,
});
