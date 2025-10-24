"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Category {
  id: string;
  name: string;
}
interface FlashCard {
  id: string;
  question: string;
  answer: string;
  category_id: string;
}

export default function CardsPage() {
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [showAlert, setShowAlert] = useState(false);

  const filteredCards = categoryId
    ? cards.filter((card) => card.category_id === categoryId)
    : cards;

  async function load() {
    const [catRes, cardRes] = await Promise.all([
      fetch("/api/categories"),
      fetch("/api/cards"),
    ]);
    setCategories(await catRes.json());
    setCards(await cardRes.json());
  }

  async function createCard() {
    if (!categoryId || !question || !answer) return;
    const res = await fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category_id: categoryId, question, answer }),
    });
    if (res.ok) {
      setShowAlert(true);
      setQuestion("");
      setAnswer("");
      load();

      setTimeout(() => {
        setShowAlert(false);
      }, 3000);
    }
  }

  async function deleteCard(cardId: string) {
    const res = await fetch(`/api/cards/${cardId}`, { method: "DELETE" });
    if (res.ok) {
      load();
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Cards</h1>

      <div className="space-y-2 mb-6">
        <select
          className="border rounded p-2 w-full"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <Input
          placeholder="Question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <Input
          placeholder="Answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />
        <Button
          onClick={createCard}
          disabled={!categoryId || !question || !answer}
        >
          Add Card
        </Button>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Showing {filteredCards.length} card(s)
          {categoryId &&
            ` in "${categories.find((cat) => cat.id === categoryId)?.name}"`}
        </p>
      </div>

      <div className="grid gap-3">
        {filteredCards.map((c) => (
          <Card key={c.id}>
            <CardHeader>
              <CardTitle>{c.question}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Category:{" "}
                {categories.find((cat) => cat.id === c.category_id)?.name}
              </p>
              <p className="mt-2">Answer: {c.answer}</p>
              <Button
                variant="destructive"
                className="mt-2"
                onClick={() => deleteCard(c.id)}
              >
                Delete
              </Button>
            </CardContent>
          </Card>
        ))}
        {filteredCards.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">
                {categoryId
                  ? `No cards found in "${
                      categories.find((cat) => cat.id === categoryId)?.name
                    }" category`
                  : "No cards found. Create your first card!"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {showAlert && (
        <Alert className="mt-4 fixed bottom-4 right-4 w-80">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>Card added successfully!</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
