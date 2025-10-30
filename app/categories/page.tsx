"use client";

// kategooriate haldamise leht kus saab lisada ja kustutada õppimise kategooriaid
// iga kategooria all saab hiljem luua flashkaarte

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Category {
  id: string;
  name: string;
  description: string | null;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [showAlert, setShowAlert] = useState(false);

  async function load() {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data);
  }

  async function createCategory() {
    if (!name.trim()) return;
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    if (res.ok) {
      setShowAlert(true);
      setName("");
      setDescription("");
      load();

      setTimeout(() => {
        setShowAlert(false);
      }, 3000);
    }
  }

  async function deleteCategory(categoryId: string) {
    const res = await fetch(`/api/categories/${categoryId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      load();
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Categories</h1>
      <div className="space-y-2 mb-6">
        <Input
          placeholder="Category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Button onClick={createCategory} disabled={!name.trim()}>
          Add Category
        </Button>
      </div>
      <div className="grid gap-3">
        {categories.map((cat) => (
          <Card key={cat.id}>
            <CardHeader>
              <CardTitle>{cat.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{cat.description || "No description"}</p>
              <Button
                variant="destructive"
                className="mt-2"
                onClick={() => deleteCategory(cat.id)}
              >
                Delete
              </Button>
            </CardContent>
          </Card>
        ))}
        {categories.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">
                No categories found. Create your first category!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      {showAlert && (
        <Alert className="mt-4 fixed bottom-4 right-4 w-80">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>Category added successfully!</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
