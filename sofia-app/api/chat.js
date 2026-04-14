export default async function handler(req, res) {
  try {
    const { messages } = req.body;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro Anthropic:", data);
      return res.status(response.status).json({
        error: data.error || "Erro na API da Anthropic"
      });
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error("ERRO REAL:", error);

    return res.status(500).json({
      error: error.message || "Erro interno no servidor"
    });
  }
}