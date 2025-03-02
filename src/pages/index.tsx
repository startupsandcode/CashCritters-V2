
import Head from "next/head";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Piggy, Coins, Wallet, TrendingUp, BookOpen } from "lucide-react";

export default function Home() {
  return (
    <>
      <Head>
        <title>KidsFin - Fun Financial Education for Kids</title>
        <meta name="description" content="Learn about money, saving, and financial concepts in a fun, interactive way designed for kids." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex flex-col min-h-screen">
        <Header />
        
        <main className="flex-1">
          {/* Hero Section */}
          <section className="py-20 md:py-28 bg-gradient-to-b from-background to-accent/20">
            <div className="container">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                    Make Learning About Money <span className="text-primary">Fun!</span>
                  </h1>
                  <p className="text-xl text-muted-foreground mb-8">
                    KidsFin helps children understand financial concepts through interactive games, challenges, and rewards.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link href="/auth/signup">
                      <Button size="lg" className="w-full sm:w-auto">
                        Get Started
                      </Button>
                    </Link>
                    <Link href="/auth/signin">
                      <Button size="lg" variant="outline" className="w-full sm:w-auto">
                        Sign In
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="flex justify-center">
                  <div className="relative w-full max-w-md aspect-square bg-primary/10 rounded-full flex items-center justify-center">
                    <Piggy className="w-32 h-32 text-primary" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-20 bg-background">
            <div className="container">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">What Kids Will Learn</h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Our platform makes financial education engaging and accessible for children of all ages.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  {
                    icon: <Coins className="h-10 w-10 text-primary" />,
                    title: "Money Basics",
                    description: "Learn what money is, how it works, and its different forms in today's world."
                  },
                  {
                    icon: <Wallet className="h-10 w-10 text-secondary" />,
                    title: "Saving Habits",
                    description: "Develop healthy saving habits through fun challenges and virtual piggy banks."
                  },
                  {
                    icon: <TrendingUp className="h-10 w-10 text-accent" />,
                    title: "Smart Spending",
                    description: "Make good spending decisions by understanding needs vs. wants."
                  },
                  {
                    icon: <BookOpen className="h-10 w-10 text-primary" />,
                    title: "Financial Goals",
                    description: "Set and achieve financial goals with our interactive goal tracker."
                  }
                ].map((feature, index) => (
                  <div key={index} className="bg-card rounded-lg p-6 shadow-sm border">
                    <div className="mb-4">{feature.icon}</div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-20 bg-primary/10">
            <div className="container text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start the Financial Journey?</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                Join thousands of families teaching their kids essential money skills in a fun way.
              </p>
              <Link href="/auth/signup">
                <Button size="lg" className="px-8">
                  Create Free Account
                </Button>
              </Link>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t py-12 bg-muted/40">
          <div className="container">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-6 md:mb-0">
                <h2 className="text-2xl font-bold text-primary">KidsFin</h2>
                <p className="text-muted-foreground">Financial education made fun for kids</p>
              </div>
              <div className="flex gap-8">
                <Link href="#" className="text-muted-foreground hover:text-foreground">About</Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground">Privacy</Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground">Terms</Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground">Contact</Link>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t text-center text-muted-foreground">
              <p>© {new Date().getFullYear()} KidsFin. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
