import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const pasangan = req.query.pasangan;
  const tamu = req.query.to; // ambil dari parameter ?to=arsi&andika

  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (!pasangan) {
    return res.status(400).json({ error: "Parameter ?pasangan= wajib diisi" });
  }

  if (req.method === "POST") {
    if (!tamu) {
      return res.status(400).json({ error: "Parameter ?to= wajib diisi" });
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

      // Jika visitor belum ada, tambahkan
      const visitorList = existingData.visitor || [];

      const sudahAda = visitorList.some(
        (v) => v.nama.toLowerCase() === tamu.toLowerCase()
      );

      if (!sudahAda) {
        const newVisitor = {
          nama: tamu,
          waktu: new Date().toISOString(),
        };

        const updatedVisitor = [...visitorList, newVisitor];
        const updatedData = { ...existingData, visitor: updatedVisitor };

        // Simpan ke Supabase
        const { error: updateError } = await supabase
          .from("couple")
          .update({ data: updatedData })
          .eq("pasangan", pasangan);

        if (updateError) throw updateError;

        return res.status(200).json({
          message: "Visitor baru dicatat",
          data: updatedVisitor,
        });
      } else {
        return res.status(200).json({
          message: "Visitor sudah pernah tercatat",
          data: visitorList,
        });
      }
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Gagal mencatat visitor" });
    }
  } else if (req.method === "GET") {
    // GET semua visitor
    const { data, error } = await supabase
      .from("couple")
      .select("data")
      .eq("pasangan", pasangan)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Pasangan tidak ditemukan" });
    }

    return res.status(200).json({ visitor: data.data.visitor || [] });
  } else {
    return res.status(405).json({ error: "Method tidak diizinkan" });
  }
}
