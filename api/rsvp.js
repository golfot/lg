import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const couple = req.query.couple || Object.keys(req.query)[0];
  if (!couple) return res.status(400).json({ error: "Harus ada nama pasangan" });

  let { data: record, error } = await supabase
    .from("undangan_data")
    .select("data")
    .eq("couple", couple)
    .single();

  if (error && error.code !== "PGRST116") {
    return res.status(500).json({ error: error.message });
  }

  let db = record?.data || {
    bukutamu: [],
    rsvp: [],
    visitor: 0,
  };

  // ==== GET ====
  if (req.method === "GET") return res.status(200).json(db.rsvp);

  // ==== POST ====
  if (req.method === "POST") {
    const body = req.body;
    if (!body?.nama || !body?.hadir || !body?.ucapan)
      return res.status(400).json({ error: "nama, hadir, ucapan wajib diisi" });

    db.rsvp.push({
      nama: body.nama,
      hadir: body.hadir,
      ucapan: body.ucapan,
      waktu: new Date().toISOString(),
    });

    await supabase.from("undangan_data").upsert({ couple, data: db });
    return res.status(200).json({ message: "RSVP ditambah", data: db });
  }

  // ==== DELETE ====
  if (req.method === "DELETE") {
    const nama = req.query.nama;
    if (!nama) return res.status(400).json({ error: "nama wajib diisi" });

    db.rsvp = db.rsvp.filter((t) => t.nama !== nama);

    await supabase.from("undangan_data").upsert({ couple, data: db });
    return res.status(200).json({ message: "RSVP dihapus", data: db });
  }

  res.status(405).json({ error: "Method tidak didukung" });
}
