import { supabase } from "../../../../lib/supabase/client";

export async function GET(_, { params }) {
  const { id } = await params;
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .single();
  if (error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 404,
    });
  return new Response(JSON.stringify(data), { status: 200 });
}

export async function PUT(request, { params }) {
  const { id } = await params;
  const { name, description } = await request.json();
  const { data, error } = await supabase
    .from("categories")
    .update({ name, description })
    .eq("id", id)
    .select()
    .single();
  if (error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  return new Response(JSON.stringify(data), { status: 200 });
}

export async function DELETE(_, { params }) {
  const { id } = await params;
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  return new Response(null, { status: 204 });
}
