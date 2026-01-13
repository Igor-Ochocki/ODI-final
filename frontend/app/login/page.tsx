"use client";

import Link from "next/link";
import Header from "@/components/login/Header";
import LoginForm from "@/components/login/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Header />
        <LoginForm />

        <p className="mt-6 text-center text-dark-400">
          Don't have an account?{" "}
          <Link
            href="/register"
            className="text-primary-400 hover:text-primary-300 transition-colors"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
