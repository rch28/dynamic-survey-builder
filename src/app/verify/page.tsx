// app/verify/page.tsx
export default function VerifyPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-semibold">Check your email</h1>
      <p className="mt-4 text-center max-w-md">
        We&apos;ve sent you a verification link. Please check your inbox and
        click the link to complete your registration.
      </p>
    </div>
  );
}
