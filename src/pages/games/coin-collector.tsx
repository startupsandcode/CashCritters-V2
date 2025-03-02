
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Coins, Star } from "lucide-react";

// Coin types with their values and colors
const COIN_TYPES = [
  { type: "penny", value: 1, color: "#B87333", size: 40, label: "1¢" },
  { type: "nickel", value: 5, color: "#A8A9AD", size: 45, label: "5¢" },
  { type: "dime", value: 10, color: "#C0C0C0", size: 35, label: "10¢" },
  { type: "quarter", value: 25, color: "#E5E4E2", size: 50, label: "25¢" },
];

interface Coin {
  id: number;
  type: string;
  value: number;
  color: string;
  size: number;
  label: string;
  x: number;
  y: number;
  collected: boolean;
}

export default function CoinCollector() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [highScore, setHighScore] = useState(0);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/signin");
    }
  }, [user, loading, router]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setTimeLeft(60);
    generateCoins();

    // Start the timer
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current as NodeJS.Timeout);
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const endGame = () => {
    setGameOver(true);
    if (score > highScore) {
      setHighScore(score);
    }
  };

  const generateCoins = () => {
    if (!gameAreaRef.current) return;

    const gameArea = gameAreaRef.current;
    const { width, height } = gameArea.getBoundingClientRect();
    
    const newCoins: Coin[] = [];
    
    // Generate 20 random coins
    for (let i = 0; i < 20; i++) {
      const coinType = COIN_TYPES[Math.floor(Math.random() * COIN_TYPES.length)];
      const coin: Coin = {
        id: i,
        ...coinType,
        x: Math.random() * (width - coinType.size),
        y: Math.random() * (height - coinType.size),
        collected: false,
      };
      newCoins.push(coin);
    }
    
    setCoins(newCoins);
  };

  const collectCoin = (coinId: number) => {
    setCoins(coins.map(coin => {
      if (coin.id === coinId && !coin.collected) {
        setScore(prev => prev + coin.value);
        return { ...coin, collected: true };
      }
      return coin;
    }));

    // If all coins are collected, generate new ones
    if (coins.filter(coin => !coin.collected).length <= 1) {
      generateCoins();
    }
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

  return (
    <>
      <Head>
        <title>Coin Collector | KidsFin</title>
        <meta name="description" content="Collect coins and learn their values" />
      </Head>

      <div className="flex flex-col min-h-screen">
        <Header />
        
        <main className="flex-1 py-8">
          <div className="container">
            <div className="flex justify-between items-center mb-6">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push("/games")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Games
              </Button>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Coins className="h-5 w-5 text-primary" />
                  <span className="font-bold">{score}¢</span>
                </div>
                <div className="text-sm font-medium">
                  Time: {timeLeft}s
                </div>
              </div>
            </div>
            
            {!gameStarted ? (
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="text-2xl text-center">Coin Collector</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    Learn about different coins and their values while having fun! Click on coins to collect them and earn points.
                  </p>
                  <div className="flex justify-center gap-6 py-4">
                    {COIN_TYPES.map((coin) => (
                      <div key={coin.type} className="flex flex-col items-center">
                        <div 
                          className="rounded-full flex items-center justify-center mb-2"
                          style={{ 
                            backgroundColor: coin.color, 
                            width: coin.size, 
                            height: coin.size,
                            boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                          }}
                        >
                          <span className="font-bold text-white">{coin.label}</span>
                        </div>
                        <span className="text-sm">{coin.type}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="font-bold mb-2">How to Play:</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Click on coins to collect them</li>
                      <li>Each coin has a different value</li>
                      <li>Collect as many coins as you can in 60 seconds</li>
                      <li>Try to beat your high score!</li>
                    </ul>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <Button size="lg" onClick={startGame}>
                    Start Game
                  </Button>
                </CardFooter>
              </Card>
            ) : gameOver ? (
              <Card className="max-w-2xl mx-auto text-center">
                <CardHeader>
                  <CardTitle className="text-2xl">Game Over!</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-center mb-4">
                    <Star className="h-16 w-16 text-yellow-500" />
                  </div>
                  <p className="text-xl mb-2">Your Score: <span className="font-bold">{score}¢</span></p>
                  <p className="text-sm">High Score: {highScore}¢</p>
                  
                  <div className="bg-muted p-4 rounded-lg mt-6">
                    <h3 className="font-bold mb-2">Did you know?</h3>
                    <p>100 pennies = 20 nickels = 10 dimes = 4 quarters = $1.00</p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-center gap-4">
                  <Button variant="outline" onClick={() => router.push("/games")}>
                    Back to Games
                  </Button>
                  <Button onClick={startGame}>
                    Play Again
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <div className="relative">
                <div 
                  ref={gameAreaRef}
                  className="bg-muted/30 rounded-lg h-[500px] relative overflow-hidden border"
                >
                  {coins.map((coin) => !coin.collected && (
                    <div
                      key={coin.id}
                      className="absolute rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
                      style={{
                        backgroundColor: coin.color,
                        width: coin.size,
                        height: coin.size,
                        left: coin.x,
                        top: coin.y,
                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                      }}
                      onClick={() => collectCoin(coin.id)}
                    >
                      <span className="font-bold text-white">{coin.label}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 flex justify-between items-center">
                  <div>
                    <Progress value={(timeLeft / 60) * 100} className="h-2 w-[200px]" />
                    <p className="text-sm mt-1">{timeLeft} seconds left</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={endGame}>
                    End Game
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
