
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { BookOpen, DollarSign, PiggyBank, ShoppingCart, BadgeCheck } from "lucide-react";

export default function Learn() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("basics");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/signin");
    }
  }, [user, loading, router]);

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

  const modules = {
    basics: [
      {
        title: "What is Money?",
        description: "Learn about the history of money and how it works in our world today.",
        icon: <DollarSign className="h-8 w-8 text-primary" />,
        progress: 0,
        locked: false,
      },
      {
        title: "Types of Money",
        description: "Discover the different forms of money from cash to digital currencies.",
        icon: <DollarSign className="h-8 w-8 text-primary" />,
        progress: 0,
        locked: true,
      },
      {
        title: "How Banks Work",
        description: "Understand what banks do and how they help us manage our money.",
        icon: <DollarSign className="h-8 w-8 text-primary" />,
        progress: 0,
        locked: true,
      },
    ],
    saving: [
      {
        title: "Why Save Money?",
        description: "Learn the importance of saving and how it helps you reach your goals.",
        icon: <PiggyBank className="h-8 w-8 text-secondary" />,
        progress: 0,
        locked: true,
      },
      {
        title: "Setting Savings Goals",
        description: "How to set achievable savings goals and track your progress.",
        icon: <PiggyBank className="h-8 w-8 text-secondary" />,
        progress: 0,
        locked: true,
      },
      {
        title: "Interest and Growth",
        description: "Discover how your money can grow over time with interest.",
        icon: <PiggyBank className="h-8 w-8 text-secondary" />,
        progress: 0,
        locked: true,
      },
    ],
    spending: [
      {
        title: "Needs vs. Wants",
        description: "Learn to differentiate between things you need and things you want.",
        icon: <ShoppingCart className="h-8 w-8 text-accent" />,
        progress: 0,
        locked: true,
      },
      {
        title: "Making a Budget",
        description: "Create a simple budget to plan your spending and saving.",
        icon: <ShoppingCart className="h-8 w-8 text-accent" />,
        progress: 0,
        locked: true,
      },
      {
        title: "Smart Shopping",
        description: "Tips and tricks for making good spending decisions.",
        icon: <ShoppingCart className="h-8 w-8 text-accent" />,
        progress: 0,
        locked: true,
      },
    ],
  };

  return (
    <>
      <Head>
        <title>Learn | Cash Critters</title>
        <meta name="description" content="Learn about money and finance" />
      </Head>

      <div className="flex flex-col min-h-screen">
        <Header />
        
        <main className="flex-1 py-8">
          <div className="container">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">Learning Center</h1>
                <p className="text-muted-foreground">Explore fun lessons about money and finance</p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => router.push("/dashboard")}
                className="mt-4 md:mt-0"
              >
                Back to Dashboard
              </Button>
            </div>
            
            <Tabs defaultValue="basics" value={activeTab} onValueChange={setActiveTab} className="mb-8">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basics" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span className="hidden sm:inline">Money Basics</span>
                  <span className="sm:hidden">Basics</span>
                </TabsTrigger>
                <TabsTrigger value="saving" className="flex items-center gap-2">
                  <PiggyBank className="h-4 w-4" />
                  <span className="hidden sm:inline">Saving</span>
                  <span className="sm:hidden">Saving</span>
                </TabsTrigger>
                <TabsTrigger value="spending" className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  <span className="hidden sm:inline">Smart Spending</span>
                  <span className="sm:hidden">Spending</span>
                </TabsTrigger>
              </TabsList>
              
              {Object.entries(modules).map(([key, lessons]) => (
                <TabsContent key={key} value={key} className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {lessons.map((lesson, index) => (
                      <Card key={index} className={lesson.locked ? "opacity-70" : ""}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            {lesson.icon}
                            {lesson.progress > 0 && (
                              <span className="text-xs font-medium text-muted-foreground">
                                {lesson.progress}% complete
                              </span>
                            )}
                          </div>
                          <CardTitle className="mt-4">{lesson.title}</CardTitle>
                          <CardDescription>{lesson.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {lesson.progress > 0 && (
                            <Progress value={lesson.progress} className="h-2 mb-4" />
                          )}
                        </CardContent>
                        <CardFooter>
                          <Button 
                            className="w-full" 
                            disabled={lesson.locked}
                            onClick={() => router.push(`/learn/${key}/${index + 1}`)}
                          >
                            {lesson.locked ? (
                              <>
                                <BadgeCheck className="mr-2 h-4 w-4" />
                                Locked
                              </>
                            ) : lesson.progress > 0 ? (
                              "Continue"
                            ) : (
                              "Start Lesson"
                            )}
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </main>
      </div>
    </>
  );
}
