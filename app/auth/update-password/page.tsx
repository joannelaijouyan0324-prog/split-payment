import { AuthForm } from "@/components/auth/auth-form";
import { AuthLayout } from "@/components/auth/auth-layout";

export default function UpdatePasswordPage() {
  return (
    <AuthLayout
      eyebrow="New password"
      title="Choose a new password"
      subtitle="Use a password you have not used before for this account."
    >
      <AuthForm mode="update-password" />
    </AuthLayout>
  );
}
