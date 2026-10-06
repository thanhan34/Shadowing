import { SignIn } from "@clerk/nextjs";
import AppShellBackground from '../../components/ui/AppShellBackground';

export default function SignInPage() {
  return (
    <AppShellBackground><main className="flex min-h-screen items-center justify-center px-4 pb-16 pt-48">
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
    </main></AppShellBackground>
  );
}
