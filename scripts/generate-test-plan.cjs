const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
  LevelFormat, PageOrientation,
} = require("docx");

const cellBorder = { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" };
const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

const H = (text, level = HeadingLevel.HEADING_1) =>
  new Paragraph({ heading: level, children: [new TextRun({ text })], spacing: { before: 240, after: 120 } });
const P = (text, opts = {}) =>
  new Paragraph({ children: [new TextRun({ text, ...opts })], spacing: { after: 80 } });
const B = (text) =>
  new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun(text)] });
const N = (text) =>
  new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun(text)] });
const code = (text) =>
  new Paragraph({
    children: [new TextRun({ text, font: "Consolas", size: 18 })],
    shading: { type: ShadingType.CLEAR, fill: "F2F2F2" },
    spacing: { after: 40 },
  });

function modelTable(rows) {
  const widths = [2200, 4200, 3160]; // 9360 total
  const head = new TableRow({
    tableHeader: true,
    children: ["Family", "Model ID", "Used For"].map((t, i) =>
      new TableCell({
        borders,
        width: { size: widths[i], type: WidthType.DXA },
        shading: { fill: "1F2937", type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, color: "FFFFFF" })] })],
      })
    ),
  });
  const body = rows.map((r) =>
    new TableRow({
      children: r.map((c, i) =>
        new TableCell({
          borders,
          width: { size: widths[i], type: WidthType.DXA },
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: c, font: i === 1 ? "Consolas" : "Arial", size: 20 })] })],
        })
      ),
    })
  );
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: widths,
    rows: [head, ...body],
  });
}

const CHAT_MODELS = [
  ["Google (Lovable)",  "google/gemini-3-flash-preview",         "Primary chat / agent fallback tier 1"],
  ["Google",            "gemini-2.5-flash",                       "Chat + reasoning (Video Agent, Chatbot)"],
  ["Google",            "gemini-2.0-flash",                       "Fast fallback + structured extraction"],
  ["OpenAI",            "openai/gpt-4o-mini",                     "Cheap general chat / captions"],
  ["OpenAI",            "gpt-5-nano",                             "Ultra-fast intent classification"],
  ["Anthropic",         "anthropic/claude-haiku-4-5",             "Prompt rewriting, cheap reasoning"],
  ["Anthropic",         "anthropic/claude-sonnet-4-5",            "High-quality script + storyboarding"],
  ["xAI",               "grok-4",                                 "Alternate chat brain"],
  ["Meta (via HF)",     "meta-llama/Llama-3.3-70B-Instruct",      "OSS fallback via HuggingFace router"],
  ["OpenRouter",        "google/gemini-2.5-flash",                "Third-party fallback route"],
];

const IMAGE_MODELS = [
  ["Google",            "google/gemini-3-pro-image-preview",      "Highest-quality reference-guided image edit"],
  ["Google",            "google/gemini-3.1-flash-image-preview",  "Fast image gen / restyle"],
  ["Google",            "google/gemini-2.5-flash-image",          "Batch image generation"],
  ["Google",            "google/nano-banana",                     "Character-consistent portraits"],
  ["Google",            "google/nano-banana-pro",                 "Premium portrait / lookbook"],
  ["OpenAI",            "gpt-image-1",                            "Editorial / branded image gen"],
  ["Black Forest Labs", "black-forest-labs/flux-1.1-pro",         "Cinematic hero shots"],
  ["Black Forest Labs", "black-forest-labs/FLUX.1-schnell",       "Fast draft images"],
];

const VIDEO_MODELS = [
  ["OpenAI",     "openai/sora-2",             "Flagship text-to-video"],
  ["OpenAI",     "openai/sora-2-pro",         "Premium text-to-video"],
  ["Google",     "google/veo-3",              "Cinematic T2V / I2V"],
  ["Google",     "google/veo-3-fast",         "Fast Veo drafts"],
  ["Google",     "veo-3.1",                   "Latest Veo revision"],
  ["Google",     "veo-2",                     "Legacy Veo"],
  ["Kling",      "kling-v2.1-master",         "Motion Control (flagship)"],
  ["Kling",      "kling-v2.1",                "Motion Control standard"],
  ["Kling",      "kling-3.0-omni",            "Omni multi-shot"],
  ["Kling",      "kling-3.0",                 "Standard T2V / I2V"],
  ["Kling",      "kling-2.5-turbo",           "Fast video"],
  ["Kling",      "kling-2.5",                 "Standard mid tier"],
  ["Kling",      "kling-2.1 / 2.0 / v1",      "Legacy tiers"],
  ["xAI",        "grok-imagine-video-1.5",    "xAI video generation"],
];

const AUDIO_MODELS = [
  ["OpenAI",    "gpt-audio",                       "Voice / TTS premium"],
  ["OpenAI",    "gpt-audio-mini",                  "Voice / TTS fast tier"],
  ["OpenAI",    "openai/whisper-large-v3",         "Speech-to-text (captions)"],
  ["ElevenLabs","eleven_multilingual",             "Character voice cloning"],
];

const OTHER = [
  ["HeyGen",   "heygen (avatar templates)",  "Talking-head avatar + lipsync"],
];

const TEST_SECTIONS = [
  {
    title: "1. Perform Anywhere (Motion Transfer)",
    cases: [
      "Upload a 30s reference performance video (mp4).",
      "Select a target scene from Scenes library.",
      "Trigger generation — confirm 30 Aura is reserved on the balance.",
      "Verify progress polls every 3–5s and finishes < 4 min.",
      "Downloaded video preserves subject identity + syncs to reference motion.",
      "Refund path: kill the job mid-run — Aura is returned to balance.",
    ],
  },
  {
    title: "2. Video Agent (Homepage + Dashboard)",
    cases: [
      "Home hero prompt box accepts free text and files (image / video / pdf).",
      "Follow-ups remember previous turns (persistent memory).",
      "Rendered replies use markdown (bold, lists, links).",
      "Fallback: kill LOVABLE_API_KEY temporarily — request still succeeds via Gemini/OpenAI/Anthropic tier.",
      "generateWithFallback returns non-empty .output even when experimental_output is undefined.",
    ],
  },
  {
    title: "3. TikTok30 (Premium 30-clip pack)",
    cases: [
      "Flat cost = 85 Aura per full pack (not per clip).",
      "Deterministic per-piece allocation — partial refund on any failed clip is correct.",
      "In-place Animate + Motion Control buttons on each result tile.",
      "Script + Product mode: user writes ad copy, selects product image, gets 30 stylized clips.",
    ],
  },
  {
    title: "4. Scene Builder / Canvas",
    cases: [
      "Drag nodes: Image Gen → Restyle → Video → Export.",
      "Connections carry data (Collection<T> included).",
      "Batch node shows single card with N variants inside — no canvas clutter.",
      "Draft is autosaved to Supabase on every edit.",
    ],
  },
  {
    title: "5. Batch Content Generation System (new)",
    cases: [
      "Open /batch → paste source video URL.",
      "Pick 2–20 Style Blueprints across categories.",
      "Cost preview matches selected count × 10 Aura.",
      "Start batch — parent tiktok_remixes row created, N child jobs enqueued.",
      "Drawer opens showing progress per variant (queued/processing/done/failed).",
      "Downstream nodes on the canvas consume the Collection<T> as a single edge.",
    ],
  },
  {
    title: "6. Colors Performance Studio",
    cases: [
      "Upload garment reference + choose palette.",
      "Color transfer preserves fabric texture.",
      "Session gallery persists in Supabase.",
    ],
  },
  {
    title: "7. Lipsync + Avatar (HeyGen)",
    cases: [
      "Pick avatar template.",
      "Enter script → get talking-head clip with correct voice.",
      "Confirm HEYGEN_API_KEY secret is set on server.",
    ],
  },
  {
    title: "8. Image Generation + Scene Builder",
    cases: [
      "Prompt image gen → verify model routes to gemini-3-pro-image-preview by default.",
      "Character consistency across a set of 8 images (nano-banana / nano-banana-pro).",
      "Save to Outfits library or Scenes library (admin/assets page).",
    ],
  },
  {
    title: "9. Canvas — Batch Output enabled",
    cases: [
      "BatchCollectionNode renders progress bar and status badges.",
      "Clicking 'View N variants' opens BatchDrawer grid.",
      "Retry button appears on failed variants; new job replaces failed entry.",
    ],
  },
  {
    title: "10. Social Sharing (new)",
    cases: [
      "Landing page has Share section above pricing.",
      "Web Share API triggers native sheet on iOS/Android Safari + Chrome.",
      "Fallback intents open in new tab for X, Facebook, LinkedIn, WhatsApp, Telegram.",
      "Copy Link toasts 'Link copied' and swaps icon to checkmark.",
    ],
  },
  {
    title: "11. Analytics + Pixels",
    cases: [
      "Set VITE_GA4_MEASUREMENT_ID + VITE_TIKTOK_PIXEL_ID; reload site.",
      "Accept cookies — gtag + ttq scripts appear in <head>.",
      "Fire a purchase — event lands in GA4 Realtime and TikTok Events Manager.",
    ],
  },
  {
    title: "12. Mobile packaging (Capacitor + PWA)",
    cases: [
      "`npx cap add ios && npx cap add android` succeeds.",
      "server.url points to production Lovable URL — native shell auto-updates on deploy.",
      "PWA manifest passes Lighthouse install audit.",
    ],
  },
  {
    title: "13. Billing / Aura pricing",
    cases: [
      "Base image cost = 10 Aura across UI + server (pricing.ts).",
      "TikTok30 = 85 Aura flat.",
      "Subscription tiers: Free / Creator $19 / Pro $49 / Studio $129 render on /pricing.",
    ],
  },
];

const doc = new Document({
  creator: "Aurora Performance Studio",
  title: "Aurora Test Plan + Model Inventory + Admin Grants",
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: "111111" },
        paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: "1F2937" },
        paragraph: { spacing: { before: 220, after: 120 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 22, bold: true, font: "Arial", color: "374151" },
        paragraph: { spacing: { before: 160, after: 80 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022",
          alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.",
          alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840, orientation: PageOrientation.PORTRAIT },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Aurora Performance Studio", bold: true, size: 40, color: "C6A56A" })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Test Plan · Model Inventory · Admin Grants", italics: true, size: 24, color: "6B7280" })],
        spacing: { after: 240 },
      }),
      P(`Generated: ${new Date().toISOString().slice(0, 10)}`, { italics: true, color: "6B7280" }),

      H("1. Test Plan"),
      P("Manual QA checklist to run before publishing. Every section below is a flagship surface — sign off each case before shipping to production."),
      ...TEST_SECTIONS.flatMap((s) => [
        H(s.title, HeadingLevel.HEADING_2),
        ...s.cases.map((c) => N(c)),
      ]),

      H("2. AI Models In Use"),
      P("Every model ID below is called somewhere in the current codebase. Use these exact IDs — the gateway rejects anything not in its catalog."),

      H("2.1 Chat / Reasoning / Agent", HeadingLevel.HEADING_2),
      modelTable(CHAT_MODELS),
      P(" "),

      H("2.2 Image Generation & Editing", HeadingLevel.HEADING_2),
      modelTable(IMAGE_MODELS),
      P(" "),

      H("2.3 Video Generation", HeadingLevel.HEADING_2),
      modelTable(VIDEO_MODELS),
      P(" "),

      H("2.4 Speech / Audio", HeadingLevel.HEADING_2),
      modelTable(AUDIO_MODELS),
      P(" "),

      H("2.5 Third-Party Integrations", HeadingLevel.HEADING_2),
      modelTable(OTHER),
      P(" "),

      H("3. Admin Access Grants"),
      P("Grant the following two verified accounts full admin access. This uses the standard user_roles + has_role SECURITY DEFINER pattern (never stores role on the profile table)."),

      H("3.1 Admin Emails", HeadingLevel.HEADING_2),
      B("josephcrown920@gmail.com"),
      B("outthemudrecordsltd@gmail.com"),

      H("3.2 SQL Migration", HeadingLevel.HEADING_2),
      P("Run this in the Supabase migrations tool. It only grants the role when the auth.users email is verified — protects against privilege escalation via unowned mailboxes."),
      code("-- Grant admin role to Aurora founder emails (verified only)"),
      code("INSERT INTO public.user_roles (user_id, role)"),
      code("SELECT u.id, 'admin'::public.app_role"),
      code("FROM auth.users u"),
      code("WHERE lower(u.email) IN ("),
      code("  'josephcrown920@gmail.com',"),
      code("  'outthemudrecordsltd@gmail.com'"),
      code(")"),
      code("  AND u.email_confirmed_at IS NOT NULL"),
      code("ON CONFLICT (user_id, role) DO NOTHING;"),
      P(" "),

      H("3.3 Auto-grant on future sign-ins (optional)", HeadingLevel.HEADING_2),
      P("If either owner signs in with a fresh device, this trigger re-grants automatically on email verification:"),
      code("CREATE OR REPLACE FUNCTION public.grant_admin_for_owner_emails()"),
      code("RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$"),
      code("BEGIN"),
      code("  IF NEW.email_confirmed_at IS NOT NULL"),
      code("     AND lower(NEW.email) IN ('josephcrown920@gmail.com', 'outthemudrecordsltd@gmail.com') THEN"),
      code("    INSERT INTO public.user_roles (user_id, role)"),
      code("    VALUES (NEW.id, 'admin')"),
      code("    ON CONFLICT (user_id, role) DO NOTHING;"),
      code("  END IF;"),
      code("  RETURN NEW;"),
      code("END; $$;"),
      code(" "),
      code("DROP TRIGGER IF EXISTS on_auth_user_grant_owner_admin ON auth.users;"),
      code("CREATE TRIGGER on_auth_user_grant_owner_admin"),
      code("AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users"),
      code("FOR EACH ROW EXECUTE FUNCTION public.grant_admin_for_owner_emails();"),
      P(" "),

      H("3.4 Verification", HeadingLevel.HEADING_2),
      N("Ask each user to sign in once so their auth.users row exists."),
      N("Run the migration above."),
      N("Verify: SELECT u.email, r.role FROM auth.users u JOIN public.user_roles r ON u.id = r.user_id WHERE r.role = 'admin';"),
      N("Both emails should appear."),

      H("4. Sign-off"),
      P("QA lead: ______________________________          Date: ______________"),
      P(" "),
      P("Engineering: ______________________________       Date: ______________"),
    ],
  }],
});

const out = "/mnt/documents/aurora-test-plan.docx";
fs.mkdirSync(path.dirname(out), { recursive: true });
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(out, buf);
  console.log("WROTE", out, buf.length, "bytes");
});
