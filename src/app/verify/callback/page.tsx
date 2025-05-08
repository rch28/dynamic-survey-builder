"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import type { EmailOtpType } from "@supabase/supabase-js";

export default function VerifyCallback() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"verifying" | "error" | "success">(
    "verifying"
  );

  useEffect(() => {
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type") as EmailOtpType | null;
    const next = searchParams.get("next") ?? "/";

    const verifyOtp = async () => {
      if (!token_hash || !type) {
        setStatus("error");
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({ token_hash, type });

      if (error) {
        setStatus("error");
      } else {
        setStatus("success");
        router.push(next);
      }
    };

    verifyOtp();
  }, [searchParams, router]);

  if (status === "verifying")
    return (
      <div className="w-screen h-screen flex justify-center items-center">
        <span> Verifying your email...</span>
      </div>
    );
  if (status === "error")
    return (
      <div className="w-screen h-screen flex justify-center items-center">
        <span>Verification failed. Please try again.</span>
      </div>
    );
  return null;
}
