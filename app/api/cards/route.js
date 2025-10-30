// API marsruudid flashkaartide haldamiseks (CRUD operatsioonid)
// võimaldab kaartide lisamist, kustutamist ja pärimist Supabasist

import { supabase } from "../../../lib/supabase/client";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category_id = searchParams.get("category_id");

  let query = supabase.from("cards").select("*");
  if (category_id) query = query.eq("category_id", category_id);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  return new Response(JSON.stringify(data), { status: 200 });
}

export async function POST(request) {
  const { category_id, question, answer } = await request.json();
  const { data, error } = await supabase
    .from("cards")
    .insert([{ category_id, question, answer }])
    .select()
    .single();
  if (error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  return new Response(JSON.stringify(data), { status: 201 });
}
