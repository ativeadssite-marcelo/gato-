export type RequestUser = {
  id: string;
  email: string;
  role: string;
  companyId: string;
  defaultBranchId: string;
  branchIds: string[];
};
