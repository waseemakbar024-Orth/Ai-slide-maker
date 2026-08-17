import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import pptxgen from "pptxgenjs";
import "./styles.css";

const demoImages = [
  "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=1200&q=80"
];

function App() {
  const [topic, setTopic] = useState("");
  const [slideCount, setSlideCount] = useState(10);
  const [style, setStyle] = useState("Medical / Academic");
  const [audience, setAudience] = useState("Students");
  const [language, setLanguage] = useState("English");
  const [deck, setDeck] = useState(null);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const current = deck?.slides?.[selected];

  const safeFileName = useMemo(
    () => (topic || "presentation")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase(),
    [topic]
  );

  async function generate() {
    if (!topic.trim()) {
      setError("Please enter a presentation topic.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          slideCount,
          style,
          audience,
          language
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Presentation generation failed.");
      }

      const slidesWithImages = data.slides.map((slide, index) => ({
        ...slide,
        image: demoImages[index % demoImages.length]
      }));

      setDeck({
        ...data,
        slides: slidesWithImages
      });
      setSelected(0);
    } catch (err) {
      setError(err.message || "Unable to generate the presentation.");
    } finally {
      setLoading(false);
    }
  }

  function updateCurrent(field, value) {
    setDeck((old) => {
      if (!old) return old;
      return {
        ...old,
        slides: old.slides.map((slide, index) =>
          index === selected ? { ...slide, [field]: value } : slide
        )
      };
    });
  }

  async function downloadPptx() {
    if (!deck?.slides?.length) return;

    const pptx = new pptxgen();
    pptx.layout = "LAYOUT_WIDE";
    pptx.author = "AI Presentation Maker";
    pptx.subject = topic;
    pptx.title = deck.title || topic;

    deck.slides.forEach((slide, index) => {
      const page = pptx.addSlide();
      page.background = { color: "F8FAFC" };

      page.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: 13.333,
        h: 0.12,
        fill: { color: "4F46E5" },
        line: { color: "4F46E5" }
      });

      page.addText(slide.title, {
        x: 0.65,
        y: 0.55,
        w: 7.0,
        h: 0.7,
        fontFace: "Aptos Display",
        fontSize: 26,
        bold: true,
        color: "111827",
        margin: 0
      });

      const bulletRuns = (slide.bullets || []).map((bullet) => ({
        text: bullet,
        options: {
          bullet: { indent: 16 },
          breakLine: true
        }
      }));

      page.addText(bulletRuns, {
        x: 0.75,
        y: 1.55,
        w: 6.0,
        h: 4.8,
        fontSize: 17,
        color: "374151",
        breakLine: false,
        paraSpaceAfterPt: 12,
        margin: 0.03,
        fit: "shrink"
      });

      page.addText(`${index + 1} / ${deck.slides.length}`, {
        x: 11.7,
        y: 7.0,
        w: 0.9,
        h: 0.2,
        fontSize: 9,
        color: "6B7280",
        align: "right"
      });

      if (slide.speaker_notes) {
        page.addNotes(slide.speaker_notes);
      }
    });

    await pptx.writeFile({
      fileName: `${safeFileName || "presentation"}.pptx`
    });
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="logo">✦</div>
          <div>
            <strong>AI Presentation Maker</strong>
            <span>AI-powered editable PowerPoint</span>
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="eyebrow">AI-POWERED PRESENTATIONS</div>
          <h1>
            Turn an idea into a <em>professional presentation.</em>
          </h1>
          <p className="intro">
            Generate a structured presentation with speaker notes and visual
            directions, edit the slides, and export to PowerPoint.
          </p>

          <div className="generator-card">
            <label>Presentation topic</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Example: Management of Femoral Neck Fractures for DPT students"
            />

            <div className="controls">
              <div>
                <label>Slides</label>
                <select value={slideCount} onChange={(e) => setSlideCount(Number(e.target.value))}>
                  {[5, 8, 10, 12, 15, 20, 25, 30].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              <div>
                <label>Style</label>
                <select value={style} onChange={(e) => setStyle(e.target.value)}>
                  <option>Medical / Academic</option>
                  <option>Professional</option>
                  <option>Minimal</option>
                  <option>Modern / Visual</option>
                  <option>Lecture Notes</option>
                </select>
              </div>

              <div>
                <label>Audience</label>
                <select value={audience} onChange={(e) => setAudience(e.target.value)}>
                  <option>Students</option>
                  <option>Residents</option>
                  <option>Professionals</option>
                  <option>General audience</option>
                </select>
              </div>

              <div>
                <label>Language</label>
                <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                  <option>English</option>
                  <option>Urdu</option>
                  <option>Arabic</option>
                </select>
              </div>
            </div>

            <button className="primary" onClick={generate} disabled={loading}>
              {loading ? "Creating your presentation…" : "✦ Generate Presentation"}
            </button>

            {error && <div className="error">{error}</div>}
          </div>
        </section>

        {deck && current && (
          <section className="workspace">
            <div className="toolbar">
              <div>
                <strong>{deck.title || topic}</strong>
                <span>{deck.slides.length} slides</span>
              </div>
              <button className="download" onClick={downloadPptx}>
                ⇩ Download PPTX
              </button>
            </div>

            <div className="editor">
              <aside className="sidebar">
                {deck.slides.map((slide, index) => (
                  <button
                    key={index}
                    className={index === selected ? "slide-item active" : "slide-item"}
                    onClick={() => setSelected(index)}
                  >
                    <span>{index + 1}</span>
                    {slide.title}
                  </button>
                ))}
              </aside>

              <div className="stage">
                <div className="slide-preview">
                  <div className="slide-accent" />
                  <div className="slide-copy">
                    <input
                      value={current.title}
                      onChange={(e) => updateCurrent("title", e.target.value)}
                    />
                    <textarea
                      value={(current.bullets || []).join("\n")}
                      onChange={(e) =>
                        updateCurrent("bullets", e.target.value.split("\n"))
                      }
                    />
                  </div>
                  <div className="visual-panel">
                    <img src={current.image} alt="" />
                    <div className="visual-label">Suggested visual</div>
                  </div>
                </div>

                <div className="notes-card">
                  <label>Speaker notes</label>
                  <textarea
                    value={current.speaker_notes || ""}
                    onChange={(e) =>
                      updateCurrent("speaker_notes", e.target.value)
                    }
                  />
                </div>

                <div className="image-prompt">
                  <label>Image direction for this slide</label>
                  <p>{current.image_prompt}</p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
