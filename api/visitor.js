import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const couple = req.query.couple || Object.keys(req.query)[0];
  if (!couple) return res.status(400).json({ error: "Harus ada nama pasangan" });

  let { data: record, error } = await supabase
    .from("data_langgeng")
    .select("data")
    .eq("couple", couple)
    .single();

  if (error && error.code !== "PGRST116") {
    return res.status(500).json({ error: error.message });
  }

  let db = record?.data || {
    bukutamu: [],
    rsvp: [],
    visitor: 0,
  };

  if (req.method === "GET")
    return res.status(200).json({ visitor: db.visitor });

  if (req.method === "POST") {
    db.visitor = (db.visitor || 0) + 1;
    await supabase.from("data_langgeng").upsert({ couple, data: db });
    return res.status(200).json({ message: "Visitor +1", total: db.visitor });
  }

  if (req.method === "DELETE") {
    db.visitor = 0;
    await supabase.from("data_langgeng").upsert({ couple, data: db });
    return res.status(200).json({ message: "Visitor direset", total: 0 });
  }

  res.status(405).json({ error: "Method tidak didukung" });
}
