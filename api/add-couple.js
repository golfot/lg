import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  const couple = req.query.couple;

  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (!couple) return res.status(400).json({ error: "Parameter ?couple= wajib diisi" });

  if (req.method === "POST") {
    try {
      const initialData = { rsvp: [], visitor: 0, bukutamu: [] };

      const { error } = await supabase.from("data_langgeng").upsert([
        {
          couple,
          data: initialData
        }
      ]);

      if (error) throw error;

      return res.status(200).json({ success: true, message: `Pasangan '${couple}' berhasil dibuat.` });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Gagal membuat pasangan baru." });
    }
  }

  return res.status(405).json({ error: "Method tidak diizinkan" });
}
