"use client";

import Link from "next/link";

export default function Overview() {
  return (
    <section className="container mx-auto px-4 py-20 text-center">
      <div className="max-w-4xl mx-auto stagger-children">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          <span className="text-glow text-primary-400">Secure</span> messaging
          <br />
          system
        </h1>

        <p className="text-xl text-dark-400 mb-10 max-w-2xl mx-auto">
          End-to-end encryption, two-factor authentication and digital signatures. Your messages are
          secure, even before they reach us.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register" className="btn-primary text-lg px-8 py-4">
            Start for free
          </Link>
          <Link href="#features" className="btn-secondary text-lg px-8 py-4">
            Learn more
          </Link>
        </div>
      </div>
    </section>
  );
}
