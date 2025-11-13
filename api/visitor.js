import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const pasangan = req.query.pasangan;
  const namaTamu = req.query.to; // ambil dari ?to=

  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (!pasangan) {
    return res
      .status(400)
      .json({ error: "Parameter ?pasangan= wajib diisi, contoh: ?pasangan=andi-anggun" });
  }

  if (req.method === "POST") {
    if (!namaTamu) {
      return res
        .status(400)
        .json({ error: "Parameter ?to=nama_tamu wajib diisi" });
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

      // Cek apakah tamu sudah tercatat
      const sudahAda = pasanganData.visitor.some(
        (v) => v.nama.toLowerCase() === namaTamu.toLowerCase()
      );

      if (!sudahAda) {
        pasanganData.visitor.push({
          nama: namaTamu,
          waktu: new Date().toISOString()
        });
      }

      // Simpan ke Supabase
      const updatedData = { ...currentData, [pasangan]: pasanganData };
      const { error: updateError } = await supabase
        .from("couple")
        .update({ data: updatedData });

      if (updateError) throw updateError;

      return res.status(200).json({
        message: sudahAda
          ? "Tamu sudah pernah tercatat, tidak ditambahkan lagi."
          : "Visitor baru berhasil ditambahkan.",
        data: pasanganData
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Gagal memperbarui visitor." });
    }
  }

  // GET → Ambil semua visitor
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
        visitor: pasanganData.visitor || []
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Gagal mengambil data visitor." });
    }
  }

  return res.status(405).json({ error: "Method tidak diizinkan." });
}
