export function buildQrConsumeUrl(memberId: string, origin?: string) {
  const base =
    origin ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "";

  const normalizedBase = base.replace(/\/$/, "");

  if (!normalizedBase) {
    return `/qr/consume?memberId=${encodeURIComponent(memberId)}`;
  }

  return `${normalizedBase}/qr/consume?memberId=${encodeURIComponent(memberId)}`;
}