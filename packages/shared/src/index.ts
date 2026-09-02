export const ROLES = [
  "consulta",
  "vendedor",
  "caixa",
  "estoque",
  "fiscal",
  "gestor",
] as const;

export type Role = (typeof ROLES)[number];

export const CHANNELS = ["balcao", "site"] as const;
export type Channel = (typeof CHANNELS)[number];

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
