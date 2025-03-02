
import Head from "next/head";
import { AuthForm } from "@/components/auth/AuthForm";

export default function SignUp() {
  return (
    <>
      <Head>
        <title>Sign Up | Cash Critters</title>
        <meta name="description" content="Create your Cash Critters account" />
      </Head>
      <div className="container flex items-center justify-center min-h-screen py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary">Cash Critters</h1>
            <p className="text-muted-foreground mt-2">Start your financial adventure!</p>
          </div>
          <AuthForm mode="signup" />
        </div>
      </div>
    </>
  );
}
