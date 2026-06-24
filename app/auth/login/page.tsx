import { AuthForm } from "@/components/auth/auth-form";
import { AuthLayout } from "@/components/auth/auth-layout";

export default function LoginPage() {
  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Log in to your account"
      subtitle="Continue managing receipt splits, item claims, and settlement tracking."
    >
      <AuthForm mode="login" />
    </AuthLayout>
  );
}
