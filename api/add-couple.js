import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const pasangan = req.query.pasangan;

  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (!pasangan) {
    return res.status(400).json({ error: "Parameter ?pasangan= wajib diisi" });
  }

  if (req.method === "POST") {
    try {
      // Struktur awal
      const initialData = {
        [pasangan]: {
          rsvp: [],
          visitor: [],
          bukutamu: []
        }
      };

      // Simpan ke Supabase
      const { error } = await supabase.from("data_langgeng").insert([
        {
          pasangan,
          data: initialData[pasangan]
        }
      ]);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: `Pasangan '${pasangan}' berhasil dibuat.`,
        data: initialData[pasangan]
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Gagal membuat pasangan baru." });
    }
  }

  return res.status(405).json({ error: "Method tidak diizinkan" });
}
