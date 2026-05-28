export function verifyMathCaptcha(a: unknown, b: unknown, answer: unknown): boolean {
  const na = Number(a);
  const nb = Number(b);
  const nAnswer = Number(answer);

  if (!Number.isInteger(na) || !Number.isInteger(nb) || !Number.isFinite(nAnswer)) {
    return false;
  }

  if (na < 1 || na > 20 || nb < 1 || nb > 20) {
    return false;
  }

  return na + nb === nAnswer;
}
