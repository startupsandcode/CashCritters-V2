
import Head from "next/head";
import { AuthForm } from "@/components/auth/AuthForm";

export default function SignIn() {
  return (
    <>
      <Head>
        <title>Sign In | KidsFin</title>
        <meta name="description" content="Sign in to your KidsFin account" />
      </Head>
      <div className="container flex items-center justify-center min-h-screen py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary">KidsFin</h1>
            <p className="text-muted-foreground mt-2">Learn about money the fun way!</p>
          </div>
          <AuthForm mode="signin" />
        </div>
      </div>
    </>
  );
}
