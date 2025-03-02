
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Gamepad2, Lock, Trophy, Star } from "lucide-react";
import Image from "next/image";

export default function Games() {
  const { user, loading } = useAuth();
  const router = useRouter();

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

  const games = [
    {
      title: "Coin Collector",
      description: "Collect coins and learn about different denominations",
      image: "https://images.unsplash.com/photo-1574607383476-f517f260d30b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
      level: "Beginner",
      locked: false,
      path: "/games/coin-collector"
    },
    {
      title: "Budget Hero",
      description: "Make smart spending choices to reach your savings goal",
      image: "https://images.unsplash.com/photo-1579621970588-a35d0e7ab9b6?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
      level: "Intermediate",
      locked: true,
      path: "/games/budget-hero"
    },
    {
      title: "Money Maze",
      description: "Navigate through a maze while answering money questions",
      image: "https://images.unsplash.com/photo-1553481187-be93c21490a9?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
      level: "Beginner",
      locked: true,
      path: "/games/money-maze"
    },
    {
      title: "Entrepreneur",
      description: "Start and grow your own virtual business",
      image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
      level: "Advanced",
      locked: true,
      path: "/games/entrepreneur"
    },
  ];

  return (
    <>
      <Head>
        <title>Games | KidsFin</title>
        <meta name="description" content="Play fun financial education games" />
      </Head>

      <div className="flex flex-col min-h-screen">
        <Header />
        
        <main className="flex-1 py-8">
          <div className="container">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">Fun Games</h1>
                <p className="text-muted-foreground">Learn about money while having fun!</p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => router.push("/dashboard")}
                className="mt-4 md:mt-0"
              >
                Back to Dashboard
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {games.map((game, index) => (
                <Card key={index} className={game.locked ? "opacity-70" : ""}>
                  <div className="relative h-48 w-full">
                    <Image 
                      src={game.image} 
                      alt={game.title}
                      className="object-cover rounded-t-lg"
                      fill
                    />
                    <div className="absolute top-2 right-2 bg-card px-2 py-1 rounded text-xs font-medium">
                      {game.level}
                    </div>
                    {game.locked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-t-lg">
                        <Lock className="h-12 w-12 text-white" />
                      </div>
                    )}
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                      <Gamepad2 className="h-5 w-5 text-primary" />
                      {game.title}
                    </CardTitle>
                    <CardDescription>{game.description}</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      disabled={game.locked}
                      onClick={() => router.push(game.path)}
                    >
                      {game.locked ? "Unlock by Learning" : "Play Now"}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            
            {/* Leaderboard */}
            <Card className="mt-12">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Leaderboard
                </CardTitle>
                <CardDescription>Top players this week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "Alex", score: 1250, rank: 1 },
                    { name: "Taylor", score: 980, rank: 2 },
                    { name: "Jordan", score: 875, rank: 3 },
                  ].map((player, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                          {player.rank}
                        </div>
                        <span className="font-medium">{player.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-bold">{player.score}</span>
                      </div>
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
