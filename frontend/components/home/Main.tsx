"use client";

import Features from "./sections/features/Features";
import Overview from "./sections/Overview";
import SecurityInfo from "./sections/security/SecurityInfo";
import CallToAction from "./sections/CallToAction";

export default function Main() {
  return (
    <main className="flex-1">
      <Overview />
      <Features />
      <SecurityInfo />
      <CallToAction />
    </main>
  );
}
