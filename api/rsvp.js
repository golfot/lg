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

  if (req.method === "POST") {
    const { nama, ucapan, status } = req.body;

    if (!nama || !status) {
      return res
        .status(400)
        .json({ error: "Field 'nama' dan 'status' wajib diisi." });
    }

    try {
      // Ambil 1 baris data (kalau tidak ada, kita buat nanti)
      let { data: coupleRow, error: fetchError } = await supabase
        .from("couple")
        .select("id, data")
        .limit(1)
        .single();

      // Jika tabel masih kosong, buat baris baru
      if (fetchError && fetchError.code === "PGRST116") {
        const { data: newRow, error: insertError } = await supabase
          .from("couple")
          .insert([{ data: {} }])
          .select()
          .single();
        if (insertError) throw insertError;
        coupleRow = newRow;
      } else if (fetchError) {
        throw fetchError;
      }

      const currentData = coupleRow?.data || {};
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
        .update({ data: updatedData })
        .eq("id", coupleRow.id);

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

  if (req.method === "GET") {
    try {
      const { data: coupleRow, error } = await supabase
        .from("couple")
        .select("data")
        .single();

      if (error) throw error;

      const pasanganData = coupleRow?.data?.[couple];
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
