import { supabase } from "../../../lib/supabase/client";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const user_id = searchParams.get("user_id");

  let query = supabase
    .from("attempts")
    .select("*")
    .order("created_at", { ascending: false });
  if (user_id) query = query.eq("user_id", user_id);

  const { data, error } = await query;
  if (error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  return new Response(JSON.stringify(data), { status: 200 });
}

export async function POST(request) {
  const { card_id, user_id, is_correct, user_answer } = await request.json();
  const { data, error } = await supabase
    .from("attempts")
    .insert([{ card_id, user_id, is_correct, user_answer }])
    .select()
    .single();
  if (error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  return new Response(JSON.stringify(data), { status: 201 });
}

export async function DELETE() {
  try {
    const { error } = await supabase
      .from("attempts")
      .delete()
      .not("id", "is", null);

    if (error) {
      console.error("Error deleting all attempts:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }

    console.log("All attempts deleted successfully");
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
