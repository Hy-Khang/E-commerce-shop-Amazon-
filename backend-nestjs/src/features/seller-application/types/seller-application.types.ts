/** Lifecycle of a seller onboarding application. */
export enum SellerApplicationStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
}

/** Admin listing filter for the moderation queue. */
export interface ISellerApplicationFilter {
  status?: SellerApplicationStatus;
  page: number;
  limit: number;
}
