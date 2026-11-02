export type RegState = "free" | "paid" | "soon" | "full";

export function registrationState(t: { is_free: boolean | null; fee_paise: number | null }, seatsLeft?: number | null): RegState {
  if (t.is_free === null || (t.is_free === false && !t.fee_paise)) return "soon";
  if (seatsLeft !== undefined && seatsLeft !== null && seatsLeft <= 0) return "full";
  return t.is_free ? "free" : "paid";
}
