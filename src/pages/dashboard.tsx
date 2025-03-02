
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Gamepad2, Award, Star, Coins } from "lucide-react";
import { PiggyBank } from "lucide-react";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/signin");
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Simulate progress loading
    const timer = setTimeout(() => setProgress(30), 500);
    return () => clearTimeout(timer);
  }, []);

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

  return (
    <>
      <Head>
        <title>Dashboard | Cash Critters</title>
        <meta name="description" content="Your Cash Critters dashboard" />
      </Head>

      <div className="flex flex-col min-h-screen">
        <Header />
        
        <main className="flex-1 py-8">
          <div className="container">
            <h1 className="text-3xl font-bold mb-2">Welcome to Cash Critters!</h1>
            <p className="text-muted-foreground mb-8">Track your progress and continue your financial journey</p>
            
            {/* Progress Overview */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Your Learning Journey</CardTitle>
                <CardDescription>You&apos;ve completed 30% of the beginner lessons</CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={progress} className="h-2 mb-2" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Beginner</span>
                  <span>Intermediate</span>
                  <span>Advanced</span>
                </div>
              </CardContent>
            </Card>
            
            {/* Activity Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <span>Continue Learning</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">Your next lesson: &quot;What is Money?&quot;</p>
                  <Button onClick={() => router.push("/learn")}>
                    Start Lesson
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Gamepad2 className="h-5 w-5 text-secondary" />
                    <span>Fun Games</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">Play games to reinforce financial concepts</p>
                  <Button variant="secondary" onClick={() => router.push("/games")}>
                    Play Now
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <PiggyBank className="h-5 w-5 text-accent" />
                    <span>Savings Tracker</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">Track your savings goals and progress</p>
                  <Button variant="outline" onClick={() => router.push("/savings")}>
                    View Savings
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  <span>Your Achievements</span>
                </CardTitle>
                <CardDescription>Badges and rewards you&apos;ve earned</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  {[
                    { name: "First Login", icon: <Star className="h-8 w-8 text-yellow-500" />, unlocked: true },
                    { name: "Money Basics", icon: <Coins className="h-8 w-8 text-blue-500" />, unlocked: false },
                    { name: "Saving Star", icon: <PiggyBank className="h-8 w-8 text-green-500" />, unlocked: false },
                  ].map((achievement, index) => (
                    <div 
                      key={index} 
                      className={`flex flex-col items-center p-4 rounded-lg border ${
                        achievement.unlocked ? "bg-accent/10" : "bg-muted opacity-50"
                      }`}
                    >
                      {achievement.icon}
                      <span className="mt-2 text-sm font-medium">{achievement.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </>
  );
}
