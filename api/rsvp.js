import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const pasangan = req.query.pasangan;

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (!pasangan) {
    return res.status(400).json({ error: "Parameter ?pasangan= wajib diisi" });
  }

  if (req.method === "POST") {
    const { nama, status } = req.body;

    if (!nama || !status) {
      return res
        .status(400)
        .json({ error: "Field nama dan status wajib diisi" });
    }

    try {
      // Ambil data pasangan dulu
      const { data: pasanganData, error: fetchError } = await supabase
        .from("couple")
        .select("data")
        .eq("pasangan", pasangan)
        .single();

      if (fetchError || !pasanganData)
        throw new Error("Data pasangan tidak ditemukan");

      const existingData = pasanganData.data || {
        rsvp: [],
        bukutamu: [],
        visitor: 0,
      };

      // Tambahkan RSVP baru dengan waktu
      const newRSVP = {
        nama,
        status,
        waktu: new Date().toISOString(),
      };

      const updatedData = {
        ...existingData,
        rsvp: [...(existingData.rsvp || []), newRSVP],
      };

      const { error: updateError } = await supabase
        .from("couple")
        .update({ data: updatedData })
        .eq("pasangan", pasangan);

      if (updateError) throw updateError;

      res.status(200).json({
        message: "RSVP ditambah",
        data: updatedData,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Gagal menambahkan RSVP" });
    }
  } else if (req.method === "GET") {
    const { data, error } = await supabase
      .from("couple")
      .select("data")
      .eq("pasangan", pasangan)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Pasangan tidak ditemukan" });
    }

    res.status(200).json({ rsvp: data.data.rsvp || [] });
  } else {
    res.status(405).json({ error: "Method tidak diizinkan" });
  }
}
