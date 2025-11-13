import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  const couple = req.query.couple;

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (!couple) return res.status(400).json({ error: "Parameter ?couple= wajib diisi" });

  // Ambil data pasangan
  const { data: row, error: fetchError } = await supabase
    .from("data_langgeng")
    .select("data")
    .eq("couple", couple)
    .single();

  if (fetchError) return res.status(404).json({ error: "Pasangan tidak ditemukan" });
  const existingData = row?.data || { rsvp: [], visitor: 0, bukutamu: [] };

  // POST - Tambah buku tamu
  if (req.method === "POST") {
    const { nama, pesan } = req.body;
    if (!nama || !pesan)
      return res.status(400).json({ error: "Nama dan pesan wajib diisi" });

    existingData.bukutamu.push({ nama, pesan, waktu: new Date().toISOString() });

    const { error: updateError } = await supabase
      .from("data_langgeng")
      .update({ data: existingData })
      .eq("couple", couple);

    if (updateError) return res.status(500).json({ error: "Gagal menambah buku tamu" });
    return res.status(200).json({ message: "Buku tamu ditambah", data: existingData });
  }

  // DELETE - Hapus buku tamu berdasarkan nama
  if (req.method === "DELETE") {
    const { nama } = req.body;
    if (!nama) return res.status(400).json({ error: "Nama wajib diisi untuk hapus" });

    existingData.bukutamu = existingData.bukutamu.filter((t) => t.nama !== nama);

    const { error: delError } = await supabase
      .from("data_langgeng")
      .update({ data: existingData })
      .eq("couple", couple);

    if (delError) return res.status(500).json({ error: "Gagal menghapus buku tamu" });
    return res.status(200).json({ message: "Buku tamu dihapus", data: existingData });
  }

  // GET - Lihat semua
  if (req.method === "GET") {
    return res.status(200).json(existingData.bukutamu);
  }

  return res.status(405).json({ error: "Method tidak diizinkan" });
}
