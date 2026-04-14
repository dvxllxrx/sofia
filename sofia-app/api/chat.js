export default async function handler(req, res) {
  console.log("API CHAT CHAMADA");

  console.log("KEY:", process.env.ANTHROPIC_API_KEY);

  return res.status(200).json({ ok: true });
}