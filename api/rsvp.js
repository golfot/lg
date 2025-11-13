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
    const { nama, ucapan, status } = req.body;

    if (!nama || !status) {
      return res.status(400).json({
        error: "Field 'nama' dan 'status' wajib diisi.",
      });
    }

    try {
      // Ambil data pasangan
      const { data: pasanganData, error: fetchError } = await supabase
        .from("couple")
        .select("data")
        .eq("pasangan", pasangan)
        .single();

      if (fetchError || !pasanganData)
        throw new Error("Data pasangan tidak ditemukan");

      const existingData = pasanganData.data || {
        bukutamu: [],
        rsvp: [],
        visitor: [],
      };

      const newRsvp = {
        nama,
        ucapan: ucapan || "",
        status,
        waktu: new Date().toISOString(),
      };

      const updatedRsvp = [...(existingData.rsvp || []), newRsvp];
      const updatedData = { ...existingData, rsvp: updatedRsvp };

      const { error: updateError } = await supabase
        .from("couple")
        .update({ data: updatedData })
        .eq("pasangan", pasangan);

      if (updateError) throw updateError;

      return res.status(200).json({
        message: "RSVP berhasil ditambahkan",
        data: newRsvp,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Gagal menambahkan RSVP" });
    }
  }

  if (req.method === "GET") {
    // Ambil semua RSVP
    const { data, error } = await supabase
      .from("couple")
      .select("data")
      .eq("pasangan", pasangan)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Pasangan tidak ditemukan" });
    }

    return res.status(200).json({
      rsvp: data.data.rsvp || [],
    });
  }

  return res.status(405).json({ error: "Method tidak diizinkan" });
}
