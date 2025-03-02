
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, DollarSign, CheckCircle } from "lucide-react";
import Image from "next/image";

export default function WhatIsMoney() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [lessonComplete, setLessonComplete] = useState(false);
  const totalSteps = 5;

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/signin");
    }
  }, [user, loading, router]);

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      setLessonComplete(true);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // In a real app, you would save progress to the database
    router.push("/learn");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading...</h2>
          <Progress value={45} className="w-[300px]" />
        </div>
      </div>
    );
  }

  const lessonContent = [
    {
      title: "What is Money?",
      content: (
        <div className="space-y-4">
          <p>Money is something we use to buy things we need and want. It can be coins, paper bills, or even digital numbers in a bank account!</p>
          <div className="flex justify-center my-6">
            <DollarSign className="h-24 w-24 text-primary" />
          </div>
          <p>Before money was invented, people used to trade things directly. If you had extra apples and wanted bread, you had to find someone with bread who wanted apples!</p>
        </div>
      ),
    },
    {
      title: "The History of Money",
      content: (
        <div className="space-y-4">
          <p>Long ago, people used all sorts of things as money - seashells, beads, and even salt!</p>
          <div className="flex justify-center my-6">
            <div className="relative h-48 w-full max-w-[500px]">
              <Image 
                src="https://images.unsplash.com/photo-1574607383476-f517f260d30b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" 
                alt="Ancient coins" 
                className="rounded-lg object-cover"
                fill
              />
            </div>
          </div>
          <p>Eventually, people started using coins made of valuable metals like gold and silver. These were easier to carry around and everyone agreed on their value.</p>
        </div>
      ),
    },
    {
      title: "Paper Money",
      content: (
        <div className="space-y-4">
          <p>Carrying lots of coins was heavy! So people invented paper money. At first, paper money was like a receipt - you could trade it for gold at a bank.</p>
          <div className="flex justify-center my-6">
            <div className="relative h-48 w-full max-w-[500px]">
              <Image 
                src="https://images.unsplash.com/photo-1561414927-6d86591d0c4f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" 
                alt="Paper money" 
                className="rounded-lg object-cover"
                fill
              />
            </div>
          </div>
          <p>Today, paper money has value because the government says it does and because we all agree to use it. This is called &quot;fiat money.&quot;</p>
        </div>
      ),
    },
    {
      title: "Digital Money",
      content: (
        <div className="space-y-4">
          <p>These days, a lot of money exists only as numbers in computers! When your parents use a debit card or pay for something online, they&apos;re using digital money.</p>
          <div className="flex justify-center my-6">
            <div className="relative h-48 w-full max-w-[500px]">
              <Image 
                src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" 
                alt="Digital payment" 
                className="rounded-lg object-cover"
                fill
              />
            </div>
          </div>
          <p>Digital money is convenient because you don&apos;t have to carry it around, and you can send it to people far away instantly!</p>
        </div>
      ),
    },
    {
      title: "Why Money is Important",
      content: (
        <div className="space-y-4">
          <p>Money helps us get the things we need to live, like food and clothes. It also lets us save for things we want in the future!</p>
          <div className="flex justify-center my-6">
            <div className="relative h-48 w-full max-w-[500px]">
              <Image 
                src="https://images.unsplash.com/photo-1579621970588-a35d0e7ab9b6?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" 
                alt="Saving money" 
                className="rounded-lg object-cover"
                fill
              />
            </div>
          </div>
          <p>Learning how to use money wisely is an important skill that will help you throughout your whole life!</p>
        </div>
      ),
    },
  ];

  return (
    <>
      <Head>
        <title>What is Money? | KidsFin</title>
        <meta name="description" content="Learn about what money is and how it works" />
      </Head>

      <div className="flex flex-col min-h-screen">
        <Header />
        
        <main className="flex-1 py-8">
          <div className="container max-w-4xl">
            <div className="flex justify-between items-center mb-6">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push("/learn")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Lessons
              </Button>
              <div className="text-sm text-muted-foreground">
                Step {currentStep} of {totalSteps}
              </div>
            </div>
            
            <Progress 
              value={(currentStep / totalSteps) * 100} 
              className="h-2 mb-8" 
            />
            
            {lessonComplete ? (
              <Card className="text-center">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <CheckCircle className="h-16 w-16 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Lesson Complete!</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg mb-6">
                    Great job! You&apos;ve learned about what money is, its history, and why it&apos;s important.
                  </p>
                  <p className="mb-6">
                    Ready to continue your financial journey?
                  </p>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <Button onClick={handleComplete} size="lg">
                    Back to Learning Center
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">
                    {lessonContent[currentStep - 1].title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {lessonContent[currentStep - 1].content}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={handlePrevious}
                    disabled={currentStep === 1}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                  <Button onClick={handleNext}>
                    {currentStep === totalSteps ? "Complete Lesson" : "Next"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
