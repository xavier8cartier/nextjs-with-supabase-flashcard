"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Attempt {
  id: string;
  user_answer: string;
  is_correct: boolean;
  created_at: string;
  card_id: string;
}

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

interface Stats {
  correct: number;
  total: number;
  accuracy: number;
}

export default function StatsPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [overallStats, setOverallStats] = useState<Stats>({
    correct: 0,
    total: 0,
    accuracy: 0,
  });
  const [filteredStats, setFilteredStats] = useState<Stats>({
    correct: 0,
    total: 0,
    accuracy: 0,
  });

  const filteredAttempts =
    selectedCategoryId === "all"
      ? attempts
      : attempts.filter((attempt) => {
          const card = cards.find((c) => c.id === attempt.card_id);
          return card?.category_id === selectedCategoryId;
        });

  const filteredCards =
    selectedCategoryId === "all"
      ? cards
      : cards.filter((card) => card.category_id === selectedCategoryId);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();

      const [attemptsRes, cardsRes, categoriesRes] = await Promise.all([
        fetch(`/api/attempts?user_id=${data?.user?.id}`),
        fetch("/api/cards"),
        fetch("/api/categories"),
      ]);

      const attemptsData = await attemptsRes.json();
      const cardsData = await cardsRes.json();
      const categoriesData = await categoriesRes.json();

      setAttempts(attemptsData);
      setCards(cardsData);
      setCategories(categoriesData);
    }
    load();
  }, []);

  useEffect(() => {
    const total = attempts.length;
    const correct = attempts.filter((a) => a.is_correct).length;
    const accuracy = total > 0 ? (correct / total) * 100 : 0;

    setOverallStats({
      correct,
      total,
      accuracy: Number(accuracy.toFixed(2)),
    });
  }, [attempts]);

  useEffect(() => {
    const filteredTotal = filteredAttempts.length;
    const filteredCorrect = filteredAttempts.filter((a) => a.is_correct).length;
    const filteredAccuracy =
      filteredTotal > 0 ? (filteredCorrect / filteredTotal) * 100 : 0;

    setFilteredStats({
      correct: filteredCorrect,
      total: filteredTotal,
      accuracy: Number(filteredAccuracy.toFixed(2)),
    });
  }, [filteredAttempts]);

  const getCardWithCategory = (cardId: string) => {
    const card = cards.find((c) => c.id === cardId);
    const category = card
      ? categories.find((cat) => cat.id === card.category_id)
      : null;
    return { card, category };
  };

  const clearAllStats = async () => {
    const { data } = await supabase.auth.getUser();
    const confirmed = confirm(
      "Are you sure you want to delete all your statistics? This action cannot be undone."
    );

    if (confirmed && data?.user?.id) {
      try {
        const res = await fetch(`/api/attempts`, {
          method: "DELETE",
        });

        if (res.ok) {
          setAttempts([]);
        } else {
          alert("Failed to delete statistics");
        }
      } catch (error) {
        console.error("Error deleting stats:", error);
        alert("Error deleting statistics");
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Statistics</h1>
        {attempts.length > 0 && (
          <Button variant="destructive" onClick={clearAllStats}>
            Clear All Stats
          </Button>
        )}
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Filter by Category:
        </label>
        <select
          className="w-full p-2 border rounded"
          value={selectedCategoryId}
          onChange={(e) => setSelectedCategoryId(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Overall Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="flex justify-between">
                <span>Correct Answers:</span>
                <span className="font-semibold">{overallStats.correct}</span>
              </p>
              <p className="flex justify-between">
                <span>Total Attempts:</span>
                <span className="font-semibold">{overallStats.total}</span>
              </p>
              <p className="flex justify-between">
                <span>Accuracy:</span>
                <span className="font-semibold">{overallStats.accuracy}%</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {selectedCategoryId === "all"
                ? "All Categories"
                : `Category: ${
                    categories.find((cat) => cat.id === selectedCategoryId)
                      ?.name
                  }`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="flex justify-between">
                <span>Correct Answers:</span>
                <span className="font-semibold">{filteredStats.correct}</span>
              </p>
              <p className="flex justify-between">
                <span>Total Attempts:</span>
                <span className="font-semibold">{filteredStats.total}</span>
              </p>
              <p className="flex justify-between">
                <span>Accuracy:</span>
                <span className="font-semibold">{filteredStats.accuracy}%</span>
              </p>
              <p className="flex justify-between text-sm text-gray-500">
                <span>Cards in category:</span>
                <span>{filteredCards.length}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Attempt Details ({filteredAttempts.length} attempts)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAttempts.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                No attempts found
                {selectedCategoryId !== "all" ? " for this category" : ""}.
              </p>
            ) : (
              filteredAttempts.map((attempt) => {
                const { card, category } = getCardWithCategory(attempt.card_id);

                return (
                  <div key={attempt.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          attempt.is_correct
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {attempt.is_correct ? "Correct" : "Incorrect"}
                      </span>
                      {category && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {category.name}
                        </span>
                      )}
                    </div>

                    <div className="mb-2">
                      <p className="font-semibold">Question:</p>
                      <p className="text-gray-700">
                        {card?.question || "Unknown question"}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                      <div>
                        <p className="font-semibold">Your Answer:</p>
                        <p className="text-gray-700">{attempt.user_answer}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Correct Answer:</p>
                        <p className="text-gray-700">
                          {card?.answer || "Unknown"}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-gray-400">
                      {new Date(attempt.created_at).toLocaleString()}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
