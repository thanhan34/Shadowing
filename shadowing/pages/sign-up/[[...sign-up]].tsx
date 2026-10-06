import { SignUp } from "@clerk/nextjs";
import AppShellBackground from '../../components/ui/AppShellBackground';

export default function SignUpPage() {
  return (
    <AppShellBackground><main className="flex min-h-screen items-center justify-center px-4 pb-16 pt-48">
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
    </main></AppShellBackground>
  );
}
