import type { Schema } from '@lp/contracts';

// Re-exports only (SDD-01 §5.1) — no hand-written DTOs.
export type Me = Schema<'Me'>;
export type User = Schema<'User'>;
export type Tenant = Schema<'Tenant'>;
export type Role = Schema<'Role'>;
export type Action = Schema<'Action'>;
export type PlanFeature = Schema<'PlanFeature'>;
export type Badges = Schema<'Badges'>;
export type SignInRequest = Schema<'SignInRequest'>;
export type SignInResponse = Schema<'SignInResponse'>;
export type TwoFactorRequest = Schema<'TwoFactorRequest'>;
export type PasswordResetRequest = Schema<'PasswordResetRequest'>;
export type PasswordResetConfirm = Schema<'PasswordResetConfirm'>;
export type InvitationPublic = Schema<'InvitationPublic'>;
export type InvitationAccept = Schema<'InvitationAccept'>;
export type ProfileUpdate = Schema<'ProfileUpdate'>;
export type PasswordChange = Schema<'PasswordChange'>;
