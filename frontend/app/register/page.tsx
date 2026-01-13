"use client";

import { useState } from "react";
import Link from "next/link";
import RegisterSuccess from "@/components/register/RegisterSuccess";
import Header from "@/components/register/Header";
import RegisterForm from "@/components/register/RegisterForm";

export default function RegisterPage() {
  const [success, setSuccess] = useState(false);

  if (success) {
    return <RegisterSuccess />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Header />

        <RegisterForm success={success} setSuccess={setSuccess} />

        <p className="mt-6 text-center text-dark-400">
          Already have an account?{" "}
          <Link href="/login" className="text-primary-400 hover:text-primary-300 transition-colors">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
