import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  const couple = req.query.couple;

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (!couple) return res.status(400).json({ error: "Parameter ?couple= wajib diisi" });

  const { data: row, error: fetchError } = await supabase
    .from("data_langgeng")
    .select("data")
    .eq("couple", couple)
    .single();

  if (fetchError) return res.status(404).json({ error: "Pasangan tidak ditemukan" });
  const existingData = row?.data || { rsvp: [], visitor: 0, bukutamu: [] };

  if (req.method === "POST") {
    const { nama, hadir, ucapan } = req.body;
    if (!nama || !hadir)
      return res.status(400).json({ error: "Nama dan status hadir wajib diisi" });

    existingData.rsvp.push({
      nama,
      hadir,
      ucapan: ucapan || "",
      waktu: new Date().toISOString(),
    });

    const { error: updateError } = await supabase
      .from("data_langgeng")
      .update({ data: existingData })
      .eq("couple", couple);

    if (updateError) return res.status(500).json({ error: "Gagal menyimpan RSVP" });
    return res.status(200).json({ message: "RSVP ditambah", data: existingData });
  }

  if (req.method === "GET") {
    return res.status(200).json(existingData.rsvp);
  }

  return res.status(405).json({ error: "Method tidak diizinkan" });
}
