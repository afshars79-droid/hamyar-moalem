import express from "express";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;
const MODEL = process.env.OPENAI_MODEL || "gpt-5";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =========================
   OpenAI
========================= */

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  : null;

/* =========================
   Basic Security
========================= */

app.disable("x-powered-by");

app.use(
  express.json({
    limit: "200kb"
  })
);

/* =========================
   Rate Limit
========================= */

const generateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "تعداد درخواست‌ها زیاد است. لطفاً کمی بعد دوباره تلاش کنید."
  }
});

/* =========================
   Static Frontend
========================= */

app.use(express.static(path.join(__dirname, "public")));

/* =========================
   Health Check
========================= */

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "Hamyar Moalem",
    aiConfigured: Boolean(client),
    model: MODEL
  });
});

/* =========================
   Educational System Prompt
========================= */

const SYSTEM_PROMPT = `
تو «همیار معلم» هستی؛ یک دستیار تخصصی برای معلمان دوره ابتدایی ایران.

نقش تو ترکیبی از این تخصص‌هاست:
1. معلم باتجربه دوره ابتدایی
2. کارشناس آموزش ابتدایی
3. طراح آموزشی
4. طراح فعالیت و بازی آموزشی
5. متخصص ارزشیابی توصیفی
6. طراح کاربرگ و محتوای چاپی
7. متخصص آموزش متناسب با تفاوت‌های فردی دانش‌آموزان

اصول اصلی:

- محتوا باید متناسب با سن و پایه دانش‌آموز باشد.
- فعالیت‌ها باید عملی و قابل اجرا در کلاس باشند.
- اهداف آموزشی باید روشن و تا حد امکان قابل سنجش باشند.
- از فعالیت‌های تکراری جلوگیری کن.
- تفاوت سطح دانش‌آموزان را در نظر بگیر.
- برای دانش‌آموز ضعیف، داربست آموزشی و مثال بیشتر ارائه کن.
- برای دانش‌آموز متوسط، تمرین استاندارد ارائه کن.
- برای دانش‌آموز قوی، مسئله‌های چالشی، چندمرحله‌ای و خلاقانه ارائه کن.
- مهارت‌های زندگی و تربیتی را در دل فعالیت‌ها به‌صورت طبیعی قرار بده.
- ارزشیابی را فقط به «خوب، متوسط، ضعیف» محدود نکن.
- بازخورد توصیفی، دقیق و قابل استفاده برای معلم ارائه کن.
- تکالیف باید هدفمند باشند و صرفاً حجم تمرین را افزایش ندهند.
- از داستان، بازی، مسئله، کشف، همکاری و فعالیت گروهی در صورت تناسب استفاده کن.
- محتوا نباید صرفاً مجموعه‌ای از متن‌های عمومی و کلی باشد.
- اگر اطلاعات کافی برای تطبیق دقیق با یک درس خاص وجود ندارد، ادعای تطبیق دقیق با کتاب درسی نکن.

برای طراحی کاربرگ:
- ساختار کاربرگ را مشخص کن.
- سؤال‌ها را متنوع طراحی کن.
- از تکرار یک نوع سؤال پشت سر هم خودداری کن.
- فضای مناسب برای پاسخ دانش‌آموز در نظر بگیر.
- در صورت مناسب بودن، پیشنهاد تصویر، جدول، مسیر، جورچین، رنگ‌آمیزی یا عناصر بصری بده.
- کاربرگ باید قابلیت چاپ روی A4 داشته باشد.

برای بسته کامل تدریس:
- طرح درس
- اهداف
- شروع و ایجاد انگیزه
- فعالیت اکتشافی
- آموزش اصلی
- تمرین
- فعالیت گروهی
- بازی آموزشی
- ارزشیابی تکوینی
- جمع‌بندی
- تکلیف
- فعالیت تربیتی/مهارت زندگی
- پیشنهاد تمایز برای دانش‌آموزان ضعیف، متوسط و قوی
را در نظر بگیر.

پاسخ‌ها باید فارسی، کاربردی، دقیق و آماده استفاده توسط معلم باشند.
`;

/* =========================
   Validation
========================= */

function validateConfig(body) {
  if (!body || typeof body !== "object") {
    return "داده ارسالی معتبر نیست.";
  }

  if (!body.contentType) {
    return "نوع محتوای آموزشی مشخص نشده است.";
  }

  if (!body.grade) {
    return "پایه تحصیلی مشخص نشده است.";
  }

  if (!body.subject) {
    return "درس مشخص نشده است.";
  }

  if (!body.topic) {
    return "موضوع یا درس مشخص نشده است.";
  }

  return null;
}

/* =========================
   Generate
========================= */

app.post("/api/generate", generateLimiter, async (req, res) => {
  const requestId = `hm_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;

  try {
    const validationError = validateConfig(req.body);

    if (validationError) {
      return res.status(400).json({
        ok: false,
        requestId,
        error: validationError
      });
    }

    if (!client) {
      return res.status(503).json({
        ok: false,
        requestId,
        error:
          "کلید هوش مصنوعی روی سرور تنظیم نشده است. ابتدا OPENAI_API_KEY را در محیط اجرا تنظیم کنید."
      });
    }

    const config = req.body;

    const userPrompt = `
برای یک معلم دوره ابتدایی، محتوای آموزشی زیر را طراحی کن.

پایه:
${config.grade}

درس:
${config.subject}

موضوع:
${config.topic}

نوع محتوا:
${config.contentType}

سطح دانش‌آموز:
${config.studentLevel || "متوسط"}

قالب:
${config.template || "خودکار"}

زمان:
${config.duration || "نامشخص"}

تعداد دانش‌آموزان:
${config.studentCount || "نامشخص"}

هدف‌های آموزشی:
${config.educationalGoals ? "فعال باشد" : "در صورت نیاز"}

اصول آموزشی:
${config.pedagogicalPrinciples ? "رعایت شود" : "رعایت شود"}

تفاوت فردی:
${config.differentiation ? "فعال باشد" : "در صورت نیاز"}

طراحی بصری:
${config.visualDesign ? "در نظر گرفته شود" : "در صورت نیاز"}

از تکرار محتوای قبلی جلوگیری شود:
${config.avoidRepetition ? "بله" : "خیر"}

محتوای قبلی برای جلوگیری از تکرار:
${JSON.stringify(config.history || [], null, 2)}

محتوای تولیدشده باید کاملاً کاربردی و قابل استفاده توسط معلم باشد.

خروجی را با ساختار زیر تولید کن:

{
  "title": "",
  "summary": "",
  "metadata": {
    "grade": "",
    "subject": "",
    "topic": "",
    "duration": "",
    "method": ""
  },
  "objectives": {
    "knowledge": [],
    "skills": [],
    "attitudes": []
  },
  "lessonPlan": {
    "opening": "",
    "discovery": "",
    "instruction": "",
    "practice": "",
    "formativeAssessment": [],
    "summary": "",
    "homework": ""
  },
  "activity": {
    "title": "",
    "instructions": "",
    "materials": [],
    "steps": []
  },
  "game": {
    "title": "",
    "instructions": "",
    "rules": [],
    "goal": ""
  },
  "worksheet": {
    "title": "",
    "design": "",
    "questions": [],
    "visualSuggestions": []
  },
  "differentiation": {
    "weak": [],
    "medium": [],
    "strong": []
  },
  "assessment": {
    "diagnostic": [],
    "formative": [],
    "descriptiveFeedback": []
  },
  "lifeSkills": [],
  "teacherNotes": [],
  "qualityControl": {
    "gradeAppropriateness": "",
    "objectiveQuality": "",
    "differentiation": "",
    "assessmentQuality": "",
    "repetitionCheck": "",
    "warnings": []
  }
}

فقط JSON معتبر برگردان.
`;

    const response = await client.responses.create({
      model: MODEL,
      input: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: userPrompt
        }
      ]
    });

    const rawText = response.output_text || "";

    let data;

    try {
      data = JSON.parse(rawText);
    } catch {
      data = {
        title: "بسته آموزشی تولیدشده",
        raw: rawText
      };
    }

    return res.json({
      ok: true,
      requestId,
      model: MODEL,
      data
    });
  } catch (error) {
    console.error(`[${requestId}] AI generation failed`);

    return res.status(500).json({
      ok: false,
      requestId,
      error: "تولید محتوای آموزشی با خطا مواجه شد."
    });
  }
});

/* =========================
   SPA Fallback
========================= */

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* =========================
   Error Handler
========================= */

app.use((err, req, res, next) => {
  console.error("Server error:", err.message);

  res.status(500).json({
    ok: false,
    error: "خطای داخلی سرور."
  });
});

/* =========================
   Start Server
========================= */

app.listen(PORT, () => {
  console.log(`
========================================
   HAMYAR MOALEM
   Server running on port ${PORT}
========================================
  `);
});
