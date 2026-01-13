"use client";

import Link from "next/link";

export default function CallToAction() {
  return (
    <section className="py-20 bg-gradient-to-b from-dark-900/50 to-transparent">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-6">
          Ready for <span className="text-primary-400">secure</span> communication?
        </h2>
        <p className="text-dark-400 mb-8 max-w-xl mx-auto">
          Join the users who value their privacy. Registration takes less than a minute.
        </p>
        <Link href="/register" className="btn-primary text-lg px-8 py-4">
          Create a free account
        </Link>
      </div>
    </section>
  );
}
