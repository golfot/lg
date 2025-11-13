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

  // POST → Tambah RSVP baru
  if (req.method === "POST") {
    const { nama, ucapan, status } = req.body;

    if (!nama || !status) {
      return res
        .status(400)
        .json({ error: "Field 'nama' dan 'status' wajib diisi." });
    }

    try {
      // Ambil data pasangan
      const { data: coupleData, error: fetchError } = await supabase
        .from("couple")
        .select("data")
        .single();

      if (fetchError) throw fetchError;

      const currentData = coupleData?.data || {};
      const pasanganData = currentData[pasangan] || {
        bukutamu: [],
        rsvp: [],
        visitor: []
      };

      // Tambahkan RSVP baru
      pasanganData.rsvp.push({
        nama,
        ucapan: ucapan || "",
        status,
        waktu: new Date().toISOString()
      });

      // Simpan ke Supabase
      const updatedData = { ...currentData, [pasangan]: pasanganData };
      const { error: updateError } = await supabase
        .from("couple")
        .update({ data: updatedData });

      if (updateError) throw updateError;

      return res.status(200).json({
        message: "RSVP berhasil ditambahkan",
        data: pasanganData
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Gagal menambahkan RSVP." });
    }
  }

  // GET → Ambil semua RSVP
  if (req.method === "GET") {
    try {
      const { data: coupleData, error } = await supabase
        .from("couple")
        .select("data")
        .single();

      if (error) throw error;

      const pasanganData = coupleData?.data?.[pasangan];
      if (!pasanganData)
        return res.status(404).json({ error: "Data pasangan tidak ditemukan" });

      return res.status(200).json({
        rsvp: pasanganData.rsvp || []
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Gagal mengambil data RSVP." });
    }
  }

  return res.status(405).json({ error: "Method tidak diizinkan." });
}
