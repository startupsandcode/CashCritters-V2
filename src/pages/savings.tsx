
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Target, Trash2, Trophy } from "lucide-react";
import { PiggyBank } from "lucide-react";

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  imageUrl: string;
}

export default function Savings() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [goals, setGoals] = useState<SavingsGoal[]>([
    {
      id: "1",
      name: "New Bicycle",
      targetAmount: 150,
      currentAmount: 75,
      imageUrl: "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
    },
    {
      id: "2",
      name: "Video Game",
      targetAmount: 60,
      currentAmount: 15,
      imageUrl: "https://images.unsplash.com/photo-1580327344181-c1163234e5a0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
    }
  ]);
  
  const [newGoal, setNewGoal] = useState({
    name: "",
    targetAmount: "",
    imageUrl: "https://images.unsplash.com/photo-1579621970588-a35d0e7ab9b6?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
  });
  
  const [addAmount, setAddAmount] = useState<{ [key: string]: string }>({});
  const [openDialog, setOpenDialog] = useState(false);

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

  const handleAddGoal = () => {
    if (newGoal.name && newGoal.targetAmount) {
      const newGoalObj: SavingsGoal = {
        id: Date.now().toString(),
        name: newGoal.name,
        targetAmount: Number(newGoal.targetAmount),
        currentAmount: 0,
        imageUrl: newGoal.imageUrl
      };
      
      setGoals([...goals, newGoalObj]);
      setNewGoal({
        name: "",
        targetAmount: "",
        imageUrl: "https://images.unsplash.com/photo-1579621970588-a35d0e7ab9b6?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
      });
      setOpenDialog(false);
    }
  };

  const handleAddSavings = (goalId: string) => {
    const amount = addAmount[goalId];
    if (amount && !isNaN(Number(amount))) {
      setGoals(goals.map(goal => {
        if (goal.id === goalId) {
          const newAmount = Math.min(goal.targetAmount, goal.currentAmount + Number(amount));
          return {
            ...goal,
            currentAmount: newAmount
          };
        }
        return goal;
      }));
      
      // Reset the input field
      setAddAmount({...addAmount, [goalId]: ""});
    }
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoals(goals.filter(goal => goal.id !== goalId));
  };

  const calculateTotalSavings = () => {
    return goals.reduce((total, goal) => total + goal.currentAmount, 0);
  };

  return (
    <>
      <Head>
        <title>Savings Tracker | KidsFin</title>
        <meta name="description" content="Track your savings goals" />
      </Head>

      <div className="flex flex-col min-h-screen">
        <Header />
        
        <main className="flex-1 py-8">
          <div className="container">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">Savings Tracker</h1>
                <p className="text-muted-foreground">Set goals and watch your savings grow!</p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => router.push("/dashboard")}
                className="mt-4 md:mt-0"
              >
                Back to Dashboard
              </Button>
            </div>
            
            {/* Savings Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-primary/10">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <PiggyBank className="h-5 w-5 text-primary" />
                    <span>Total Savings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">${calculateTotalSavings()}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-secondary/10">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-secondary" />
                    <span>Active Goals</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{goals.length}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-accent/10">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-accent" />
                    <span>Completed Goals</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {goals.filter(goal => goal.currentAmount >= goal.targetAmount).length}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Add New Goal Button */}
            <div className="flex justify-end mb-6">
              <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add New Goal
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create a New Savings Goal</DialogTitle>
                    <DialogDescription>
                      Set a target and start saving for something special!
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="goal-name">What are you saving for?</Label>
                      <Input 
                        id="goal-name" 
                        placeholder="e.g., New Bike, Video Game" 
                        value={newGoal.name}
                        onChange={(e) => setNewGoal({...newGoal, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="goal-amount">How much does it cost?</Label>
                      <div className="flex items-center">
                        <span className="mr-2">$</span>
                        <Input 
                          id="goal-amount" 
                          type="number" 
                          placeholder="50" 
                          value={newGoal.targetAmount}
                          onChange={(e) => setNewGoal({...newGoal, targetAmount: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpenDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddGoal}>
                      Create Goal
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            {/* Savings Goals */}
            {goals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {goals.map((goal) => {
                  const progress = (goal.currentAmount / goal.targetAmount) * 100;
                  const isComplete = goal.currentAmount >= goal.targetAmount;
                  
                  return (
                    <Card key={goal.id} className={isComplete ? "border-green-500 border-2" : ""}>
                      <div className="relative">
                        <img 
                          src={goal.imageUrl} 
                          alt={goal.name}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                        {isComplete && (
                          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                            Goal Reached!
                          </div>
                        )}
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle>{goal.name}</CardTitle>
                        <CardDescription>
                          ${goal.currentAmount} of ${goal.targetAmount}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Progress value={progress} className="h-2" />
                        
                        {!isComplete && (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center flex-1">
                              <span className="mr-1">$</span>
                              <Input 
                                placeholder="Amount" 
                                value={addAmount[goal.id] || ""}
                                onChange={(e) => setAddAmount({...addAmount, [goal.id]: e.target.value})}
                              />
                            </div>
                            <Button 
                              size="sm" 
                              onClick={() => handleAddSavings(goal.id)}
                            >
                              Add
                            </Button>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteGoal(goal.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                        
                        <div className="text-sm font-medium">
                          {isComplete ? (
                            <span className="text-green-500">Complete!</span>
                          ) : (
                            <span>${goal.targetAmount - goal.currentAmount} to go</span>
                          )}
                        </div>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="text-center p-8">
                <div className="flex justify-center mb-4">
                  <PiggyBank className="h-16 w-16 text-muted-foreground" />
                </div>
                <CardTitle className="mb-2">No Savings Goals Yet</CardTitle>
                <CardDescription className="mb-6">
                  Create your first savings goal to start tracking your progress!
                </CardDescription>
                <Button onClick={() => setOpenDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Goal
                </Button>
              </Card>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
