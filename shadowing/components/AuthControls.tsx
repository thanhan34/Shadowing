import { Show, SignInButton, UserButton, useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { User } from 'react-feather';

export default function AuthControls() {
  const { isLoaded } = useAuth();
  return <div className="flex shrink-0 flex-nowrap items-center justify-end gap-2 whitespace-nowrap text-sm">
    {!isLoaded && <>
      <Link href="/sign-in" className="ui-button-secondary min-h-[44px]">Đăng nhập</Link>
    </>}
    <Show when="signed-out">
      <SignInButton><button className="ui-button-secondary min-h-[44px]">Đăng nhập</button></SignInButton>
    </Show>
    <Show when="signed-in">
      <Link href="/pending-approval" className="ui-button-secondary inline-flex min-h-[44px] items-center justify-center">
        <User size={16} className="sm:hidden" aria-hidden="true" />
        <span className="sr-only sm:not-sr-only">Tài khoản</span>
      </Link>
      <UserButton />
    </Show>
  </div>;
}