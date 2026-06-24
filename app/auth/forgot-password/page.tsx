import { AuthForm } from "@/components/auth/auth-form";
import { AuthLayout } from "@/components/auth/auth-layout";

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      eyebrow="Account recovery"
      title="Reset your password"
      subtitle="Enter your email and we will send you a secure link to choose a new password."
    >
      <AuthForm mode="forgot-password" />
    </AuthLayout>
  );
}
