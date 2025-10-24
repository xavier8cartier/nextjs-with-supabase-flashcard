"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface FlashCard {
  id: string;
  question: string;
  answer: string;
  category_id: string;
}

interface Category {
  id: string;
  name: string;
}

export default function PlayPage() {
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [answeredCards, setAnsweredCards] = useState<Set<number>>(new Set());
  const [current, setCurrent] = useState<number | null>(null);
  const [answer, setAnswer] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [isRandom, setIsRandom] = useState(false);
  const [showResultAlert, setShowResultAlert] = useState(false);
  const [showNoCardsAlert, setShowNoCardsAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [isCorrect, setIsCorrect] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const filteredCards = selectedCategoryId
    ? cards.filter((card) => card.category_id === selectedCategoryId)
    : cards;

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();
      setUserId(data?.user?.id ?? null);

      const [catRes, cardsRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/cards"),
      ]);

      const categoriesData = await catRes.json();
      const cardsData = await cardsRes.json();

      setCategories(categoriesData);
      setCards(cardsData);

      if (categoriesData.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(categoriesData[0].id);
      }
    }
    load();
  }, []);

  const getNextCardIndex = () => {
    if (filteredCards.length === 0) return null;

    // kui kõik kaardid on vastatud, tagastame null
    if (answeredCards.size >= filteredCards.length) {
      return null;
    }

    if (isRandom) {
      // random - valime juhusliku mitte vastatud kaardi indeksi
      const unansweredIndices = filteredCards
        .map((_, index) => index)
        .filter((index) => !answeredCards.has(index));

      if (unansweredIndices.length === 0) return null;

      const randomIndex = Math.floor(Math.random() * unansweredIndices.length);
      return unansweredIndices[randomIndex];
    } else {
      // sequential mode
      // otsime järgmise mitte vastatud kaardi indeksi
      for (let i = 0; i < filteredCards.length; i++) {
        if (!answeredCards.has(i)) {
          return i;
        }
      }
      return null;
    }
  };

  const handleNextCard = () => {
    const nextIndex = getNextCardIndex();

    if (nextIndex === null) {
      setShowNoCardsAlert(true);
      setCurrent(null);
      return;
    }

    setCurrent(nextIndex);
    setAnswer("");
    setShowResultAlert(false);
  };

  async function submitAnswer() {
    if (current === null || !filteredCards[current] || isSubmitting) return;

    setIsSubmitting(true);
    const card = filteredCards[current];
    const isCorrectCheck =
      card.answer.trim().toLowerCase() === answer.trim().toLowerCase();

    try {
      await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          card_id: card.id,
          user_id: userId,
          is_correct: isCorrectCheck,
          user_answer: answer,
        }),
      });

      // lisame kaardid vastatud kaartide hulka ainult pärast edukat salvestamist
      setAnsweredCards((prev) => new Set([...prev, current]));

      setIsCorrect(isCorrectCheck);
      setAlertMessage(
        isCorrectCheck
          ? "Well done! Your answer is correct!"
          : `Correct answer: ${card.answer}`
      );
      setShowResultAlert(true);
    } catch (error) {
      console.error("Error submitting answer:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleContinue = () => {
    handleNextCard();
  };

  const startGame = () => {
    if (filteredCards.length > 0) {
      setGameStarted(true);
      setAnsweredCards(new Set());
      setShowNoCardsAlert(false);
      setShowResultAlert(false);
      setAnswer("");
      const firstIndex = isRandom
        ? Math.floor(Math.random() * filteredCards.length)
        : 0;
      setCurrent(firstIndex);
    }
  };

  const resetGame = () => {
    setGameStarted(false);
    setAnsweredCards(new Set());
    setShowNoCardsAlert(false);
    setShowResultAlert(false);
    setAnswer("");
    setCurrent(null);
  };

  const isLastCard = answeredCards.size >= filteredCards.length;
  const canSubmit =
    answer.trim() !== "" &&
    !isSubmitting &&
    !showResultAlert &&
    current !== null;

  const canChangeCategory = !gameStarted && answeredCards.size === 0;

  if (showNoCardsAlert) {
    return (
      <div className="max-w-md mx-auto p-6">
        <Alert className="mt-4">
          <AlertTitle>Game Complete!</AlertTitle>
          <AlertDescription>
            You have answered all {filteredCards.length} cards in{" "}
            {categories.find((cat) => cat.id === selectedCategoryId)?.name}{" "}
            category!
            <Button onClick={resetGame} className="ml-2">
              Play Again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!gameStarted) {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Select Category:
          </label>
          <select
            className="w-full p-2 border rounded"
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            disabled={!canChangeCategory}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {!canChangeCategory && (
            <p className="text-sm text-red-500 mt-1">
              Cannot change category during active game
            </p>
          )}
        </div>

        <div className="mb-4 flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Mode:</span>
          <div>
            <Button
              variant={isRandom ? "outline" : "default"}
              onClick={() => setIsRandom(false)}
              className="mr-2"
              size="sm"
            >
              Sequential
            </Button>
            <Button
              variant={isRandom ? "default" : "outline"}
              onClick={() => setIsRandom(true)}
              size="sm"
            >
              Random
            </Button>
          </div>
        </div>

        {filteredCards.length > 0 ? (
          <Button onClick={startGame} className="w-full" size="lg">
            Start Game with{" "}
            {categories.find((cat) => cat.id === selectedCategoryId)?.name}(
            {filteredCards.length} cards)
          </Button>
        ) : (
          <Alert>
            <AlertTitle>No Cards</AlertTitle>
            <AlertDescription>
              No cards found in{" "}
              {categories.find((cat) => cat.id === selectedCategoryId)?.name}{" "}
              category.
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  if (current === null || !filteredCards[current]) {
    return (
      <div className="max-w-md mx-auto p-6">
        <p>Loading cards...</p>
        <Button onClick={resetGame} className="mt-4">
          Back to Category Selection
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="mb-4">
        <div className="text-sm font-medium mb-1">Category:</div>
        <div className="p-2 border rounded bg-black-100">
          {categories.find((cat) => cat.id === selectedCategoryId)?.name}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Category cannot be changed during the game
        </p>
      </div>

      <div className="mb-4 flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          Progress: {answeredCards.size}/{filteredCards.length}
        </span>
        <div>
          <Button
            variant={isRandom ? "outline" : "default"}
            disabled
            className="mr-2"
            size="sm"
          >
            Sequential
          </Button>
          <Button variant={isRandom ? "default" : "outline"} disabled size="sm">
            Random
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {filteredCards[current]?.question}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showResultAlert ? (
            <>
              <Input
                placeholder="Your answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canSubmit) {
                    submitAnswer();
                  }
                }}
                disabled={isSubmitting}
              />
              <Button
                className="w-full"
                onClick={submitAnswer}
                disabled={!canSubmit}
              >
                {isSubmitting ? "Checking..." : "Submit Answer"}
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              <Alert
                variant={isCorrect ? "default" : "destructive"}
                className="mt-2"
              >
                <AlertTitle>{isCorrect ? "Correct!" : "Incorrect"}</AlertTitle>
                <AlertDescription>{alertMessage}</AlertDescription>
              </Alert>

              <Button className="w-full" onClick={handleContinue}>
                {getNextCardIndex() === null ? "Finish Game" : "Next Card"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-4 text-center">
        <Button variant="outline" onClick={resetGame} size="sm">
          End Game and Return to Selection
        </Button>
      </div>
    </div>
  );
}
