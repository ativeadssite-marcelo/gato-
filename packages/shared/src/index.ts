export const ROLES = [
  "consulta",
  "vendedor",
  "caixa",
  "estoque",
  "fiscal",
  "gestor",
] as const;

export type Role = (typeof ROLES)[number];

export const CHANNELS = [
  "balcao",
  "site",
  "mercado_livre",
  "shopee",
  "amazon",
  "atacado",
] as const;
export type Channel = (typeof CHANNELS)[number];

export const CUSTOMER_TYPES = ["consumidor", "frotista", "mecanica"] as const;
export type CustomerType = (typeof CUSTOMER_TYPES)[number];

export const SEGMENTS = [
  "automotivo",
  "moto",
  "caminhao",
  "agricola",
  "geral",
] as const;
export type Segment = (typeof SEGMENTS)[number];

export const EQUIVALENCE_TYPES = ["exata", "similar", "alternativa"] as const;
export type EquivalenceType = (typeof EQUIVALENCE_TYPES)[number];

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  companyId: string;
  branchIds: string[];
  defaultBranchId: string;
};

export function canSeeCost(role: Role): boolean {
  return role === "gestor" || role === "estoque" || role === "fiscal";
}

export function canEditPrice(role: Role): boolean {
  return role === "gestor";
}

export const CHANNEL_LABELS: Record<Channel, string> = {
  balcao: "Balcão",
  site: "Site",
  mercado_livre: "Mercado Livre",
  shopee: "Shopee",
  amazon: "Amazon",
  atacado: "Atacado",
};

export const SEGMENT_LABELS: Record<Segment, string> = {
  automotivo: "Automotivo",
  moto: "Moto",
  caminhao: "Caminhão",
  agricola: "Agrícola",
  geral: "Geral",
};

export const EQUIVALENCE_LABELS: Record<EquivalenceType, string> = {
  exata: "Exata",
  similar: "Similar",
  alternativa: "Alternativa",
};
