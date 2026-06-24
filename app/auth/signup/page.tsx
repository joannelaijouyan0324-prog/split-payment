import { AuthForm } from "@/components/auth/auth-form";
import { AuthLayout } from "@/components/auth/auth-layout";

export default function SignupPage() {
  return (
    <AuthLayout
      eyebrow="Create account"
      title="Start splitting bills clearly"
      subtitle="Create your account so you can save bills, invite participants, and track settlements."
    >
      <AuthForm mode="signup" />
    </AuthLayout>
  );
}
