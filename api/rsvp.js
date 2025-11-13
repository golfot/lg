import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const couple = req.query.couple;

  // CORS setup
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (!couple) {
    return res.status(400).json({ error: "Parameter ?couple= wajib diisi" });
  }

  // POST → tambah RSVP baru
  if (req.method === "POST") {
    const { nama, ucapan, status } = req.body;

    if (!nama || !status) {
      return res
        .status(400)
        .json({ error: "Field 'nama' dan 'status' wajib diisi." });
    }

    try {
      // Ambil semua data
      const { data: coupleData, error: fetchError } = await supabase
        .from("couple")
        .select("data")
        .single();

      if (fetchError) throw fetchError;

      const currentData = coupleData?.data || {};
      const pasanganData = currentData[couple] || {
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

      // Simpan kembali
      const updatedData = { ...currentData, [couple]: pasanganData };

      const { error: updateError } = await supabase
        .from("couple")
        .update({ data: updatedData });

      if (updateError) throw updateError;

      return res.status(200).json({
        message: "RSVP berhasil ditambahkan",
        data: pasanganData
      });
    } catch (err) {
      console.error("❌ Error RSVP:", err);
      return res.status(500).json({ error: "Gagal menambahkan RSVP." });
    }
  }

  // GET → ambil semua RSVP untuk couple ini
  if (req.method === "GET") {
    try {
      const { data: coupleData, error } = await supabase
        .from("couple")
        .select("data")
        .single();

      if (error) throw error;

      const pasanganData = coupleData?.data?.[couple];
      if (!pasanganData)
        return res.status(404).json({ error: "Data pasangan tidak ditemukan" });

      return res.status(200).json({
        rsvp: pasanganData.rsvp || []
      });
    } catch (err) {
      console.error("❌ Error GET RSVP:", err);
      return res.status(500).json({ error: "Gagal mengambil data RSVP." });
    }
  }

  return res.status(405).json({ error: "Method tidak diizinkan." });
}
