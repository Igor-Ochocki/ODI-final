"use client";

import SecurityStep from "./SecurityStep";

export default function SecurityInfo() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            How it <span className="text-primary-400">works?</span>
          </h2>

          <div className="space-y-6">
            <SecurityStep
              number={1}
              title="Creating an account"
              description="We generate a unique pair of cryptographic keys for you. The private key is encrypted with your password and never leaves your device in an unencrypted form."
            />
            <SecurityStep
              number={2}
              title="Enabling 2FA"
              description="Additional security layer. Even if someone knows your password, without the authenticator code they cannot log in to your account."
            />
            <SecurityStep
              number={3}
              title="Sending a message"
              description="The message is encrypted with the recipient's public key and signed with your private key. Only the recipient can read and verify it, confirming that it was actually you who sent it."
            />
            <SecurityStep
              number={4}
              title="The recipient reads"
              description="The recipient uses their private key to decrypt the message. They also verify your digital signature, confirming authenticity."
            />
          </div>
        </div>
      </div>
    </section>
  );
}
