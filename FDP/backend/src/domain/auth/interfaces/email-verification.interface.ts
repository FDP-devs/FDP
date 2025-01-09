export interface IEmailVerification {
  email: string;
  verificationCode: string;
  expiresAt: Date;
}
