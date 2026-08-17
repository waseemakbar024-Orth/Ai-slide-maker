import OpenAI from "openai";

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    subtitle: { type: "string" },
    slides: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          bullets: {
            type: "array",
            items: { type: "string" }
          },
          speaker_notes: { type: "string" },
          image_prompt: { type: "string" }
        },
        required: ["title", "bullets", "speaker_notes", "image_prompt"]
      }
    }
  },
  required: ["title", "subtitle", "slides"]
};

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const { topic, slideCount, style, audience, language } = req.body || {};

    if (!topic || !String(topic).trim()) {
      return res.status(400).json({ error: "Please enter a presentation topic." });
    }

    const count = Number(slideCount || 10);
    if (!Number.isInteger(count) || count < 3 || count > 40) {
      return res.status(400).json({ error: "Slide count must be between 3 and 40." });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "OPENAI_API_KEY is not configured in Vercel."
      });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `
Create a professional PowerPoint presentation.

Topic: ${String(topic).trim()}
Exactly ${count} slides.
Style: ${style || "Professional"}
Audience: ${audience || "Students"}
Language: ${language || "English"}

Rules:
- Return exactly ${count} slides.
- Slide 1 should introduce the topic clearly.
- The final slide should contain key takeaways.
- Use concise, presentation-friendly wording.
- Prefer 3 to 6 bullets per content slide.
- Avoid paragraphs inside bullets.
- Keep facts accurate and suitable for the stated audience.
- Include useful speaker notes for every slide.
- For every slide, provide an image_prompt describing a relevant visual.
- Do not fabricate references or citations.
`;

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.6",
      input: prompt,
      text: {
        format: {
          type: "json_schema",
          name: "presentation_deck",
          strict: true,
          schema
        }
      }
    });

    const result = JSON.parse(response.output_text);

    if (!result.slides || result.slides.length !== count) {
      return res.status(502).json({
        error: "The AI returned an unexpected number of slides. Please try again."
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: error?.message || "Something went wrong while generating the presentation."
    });
  }
}