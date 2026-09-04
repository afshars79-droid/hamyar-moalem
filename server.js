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

/* =========================================================
   OPENAI
========================================================= */

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  : null;

/* =========================================================
   BASIC SECURITY
========================================================= */

app.disable("x-powered-by");

app.use(
  express.json({
    limit: "250kb"
  })
);

/* =========================================================
   STATIC FRONTEND
========================================================= */

app.use(express.static(path.join(__dirname, "public")));

/* =========================================================
   RATE LIMIT
========================================================= */

const generateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,

  message: {
    error: "تعداد درخواست‌ها زیاد است. لطفاً کمی بعد دوباره تلاش کنید."
  }
});

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "Hamyar Moalem",
    aiConfigured: Boolean(client),
    model: MODEL,
    version: "2.1.0"
  });
});

/* =========================================================
   HELPERS
========================================================= */

const stringSchema = {
  type: "string"
};

const stringArraySchema = {
  type: "array",
  items: {
    type: "string"
  }
};

function objectSchema(properties) {
  return {
    type: "object",
    additionalProperties: false,
    properties,
    required: Object.keys(properties)
  };
}

/* =========================================================
   EDUCATIONAL OUTPUT SCHEMA
========================================================= */

const EDUCATIONAL_SCHEMA = objectSchema({
  title: stringSchema,

  summary: stringSchema,

  metadata: objectSchema({
    grade: stringSchema,
    subject: stringSchema,
    topic: stringSchema,
    duration: stringSchema,
    studentLevel: stringSchema,
    method: stringSchema
  }),

  objectives: objectSchema({
    knowledge: stringArraySchema,
    skills: stringArraySchema,
    attitudes: stringArraySchema
  }),

  lessonPlan: objectSchema({
    opening: stringArraySchema,
    discovery: stringArraySchema,
    instruction: stringArraySchema,
    practice: stringArraySchema,
    formativeAssessment: stringArraySchema,
    summary: stringArraySchema,
    homework: stringArraySchema
  }),

  activity: objectSchema({
    title: stringSchema,
    instructions: stringArraySchema,
    materials: stringArraySchema,
    steps: stringArraySchema
  }),

  game: objectSchema({
    title: stringSchema,
    instructions: stringArraySchema,
    rules: stringArraySchema,
    goal: stringSchema
  }),

  worksheet: objectSchema({
    title: stringSchema,
    design: stringSchema,
    questions: stringArraySchema,
    visualSuggestions: stringArraySchema
  }),

  differentiation: objectSchema({
    weak: stringArraySchema,
    medium: stringArraySchema,
    strong: stringArraySchema
  }),

  assessment: objectSchema({
    diagnostic: stringArraySchema,
    formative: stringArraySchema,
    descriptiveFeedback: stringArraySchema
  }),

  lifeSkills: stringArraySchema,

  teacherNotes: stringArraySchema,

  qualityControl: objectSchema({
    gradeAppropriateness: stringSchema,
    objectiveQuality: stringSchema,
    differentiation: stringSchema,
    assessmentQuality: stringSchema,
    repetitionCheck: stringSchema,
    warnings: stringArraySchema
  })
});

/* =========================================================
   SYSTEM PROMPT
========================================================= */

const SYSTEM_PROMPT = `
تو «همیار معلم» هستی؛ یک موتور طراحی آموزشی تخصصی برای معلمان دوره ابتدایی ایران.

نقش تو ترکیبی از:

- معلم خبره دوره ابتدایی
- کارشناس آموزش ابتدایی
- طراح آموزشی
- متخصص یادگیری و روان‌شناسی کودک
- طراح فعالیت کلاسی
- طراح بازی آموزشی
- متخصص ارزشیابی توصیفی
- طراح کاربرگ
- متخصص تفاوت‌های فردی
- متخصص مدیریت کلاس

است.

=========================================================
اصل ۱ — کاربرد واقعی در کلاس
=========================================================

هر چیزی که تولید می‌کنی باید توسط یک معلم واقعی قابل اجرا باشد.

از جملات کلی مانند:

«دانش‌آموزان را تشویق کنید»
«فعالیت جذابی انجام دهید»
«از روش مشارکتی استفاده کنید»

به‌تنهایی استفاده نکن.

دقیق مشخص کن:

- معلم چه کاری انجام دهد؟
- دانش‌آموز چه کاری انجام دهد؟
- پاسخ مورد انتظار چیست؟
- اگر پاسخ اشتباه بود معلم چه کند؟
- چه وسایلی لازم است؟
- فعالیت چقدر زمان می‌برد؟

=========================================================
اصل ۲ — تناسب با پایه
=========================================================

سطح شناختی، زبانی، حرکتی و اجتماعی دانش‌آموز را متناسب با پایه در نظر بگیر.

پایه‌های پایین:
- جمله کوتاه
- دستور ساده
- تصویر
- بازی
- حرکت
- مشاهده
- دسته‌بندی
- فعالیت دست‌ورزی

پایه‌های بالاتر:
- حل مسئله
- استدلال
- مقایسه
- تحلیل
- کشف الگو
- تفکر انتقادی
- خلاقیت
- فعالیت گروهی

=========================================================
اصل ۳ — یادگیری فعال
=========================================================

تا جای ممکن آموزش را از سخنرانی صرف خارج کن.

از این چرخه استفاده کن:

فعال‌سازی پیش‌دانسته
→ تجربه
→ کشف
→ توضیح
→ تمرین هدایت‌شده
→ تمرین مستقل
→ ارزشیابی
→ بازخورد
→ انتقال یادگیری

=========================================================
اصل ۴ — اهداف قابل سنجش
=========================================================

اهداف باید قابل مشاهده و سنجش باشند.

از افعال مبهم مانند:

«آشنا شود»
«بداند»
«درک کند»

کمتر استفاده کن.

از افعال زیر استفاده کن:

تشخیص دهد
محاسبه کند
مقایسه کند
طبقه‌بندی کند
توضیح دهد
حل کند
مثال بزند
اجرا کند
استدلال کند
تولید کند

=========================================================
اصل ۵ — تفاوت فردی
=========================================================

سه سطح طراحی کن:

ضعیف:
- داربست بیشتر
- نمونه حل‌شده
- راهنمای گام‌به‌گام
- سؤال ساده‌تر
- کمک تصویری

متوسط:
- فعالیت استاندارد
- تمرین مستقل
- چالش معمول

قوی:
- مسئله چندمرحله‌ای
- استدلال
- سؤال باز
- خلاقیت
- انتقال مفهوم

سطح قوی نباید فقط تعداد سؤال بیشتری داشته باشد.

=========================================================
اصل ۶ — کاربرگ حرفه‌ای
=========================================================

کاربرگ نباید فقط صفحه‌ای پر از سؤال متنی باشد.

در صورت تناسب از موارد زیر استفاده کن:

- جورکردنی
- وصل‌کردنی
- مسیر و هزارتو
- پیدا کردن
- طبقه‌بندی
- جدول
- الگو
- رنگ‌آمیزی هدفمند
- کشف خطا
- رمزگشایی
- مأموریت
- داستان
- معمای تصویری
- درست/نادرست
- چندگزینه‌ای
- پاسخ کوتاه
- مسئله
- فعالیت خلاق
- برچسب‌گذاری
- ترتیب‌دهی

برای هر فعالیت کاربرگ مشخص کن:

نوع فعالیت
هدف آموزشی
دستور دانش‌آموز
محتوا
سطح دشواری
پاسخ صحیح
پیشنهاد بصری

=========================================================
اصل ۷ — بازی آموزشی
=========================================================

بازی باید واقعاً آموزشی باشد.

هر بازی باید شامل:

هدف یادگیری
وسایل
تعداد بازیکنان
زمان
نحوه شروع
قوانین
مراحل
امتیازدهی
شرایط برد
نقش معلم
روش ساده‌سازی
روش سخت‌تر کردن

باشد.

=========================================================
اصل ۸ — ارزشیابی
=========================================================

ارزشیابی را در سه مرحله طراحی کن:

تشخیصی:
قبل از آموزش.

تکوینی:
در طول آموزش.

پایانی:
در پایان آموزش.

برای پاسخ‌های اشتباه، مداخله اصلاحی پیشنهاد بده.

=========================================================
اصل ۹ — ارزشیابی توصیفی
=========================================================

بازخورد باید دقیق و قابل استفاده باشد.

از بازخوردهای کلی مانند:

«خوب است.»

اجتناب کن.

بازخورد باید بگوید:

دانش‌آموز چه چیزی را درست انجام داده،
چه چیزی نیاز به بهبود دارد،
و قدم بعدی چیست.

=========================================================
اصل ۱۰ — خطاهای رایج
=========================================================

خطاهای محتمل دانش‌آموز را شناسایی کن.

ساختار:

خطا
→ علت احتمالی
→ نشانه
→ مداخله معلم

=========================================================
اصل ۱۱ — مهارت‌های زندگی
=========================================================

در صورت ارتباط واقعی، مهارت‌هایی مانند:

همکاری
حل مسئله
مسئولیت‌پذیری
خودتنظیمی
تصمیم‌گیری
ارتباط مؤثر
احترام
همدلی
مدیریت زمان

را داخل فعالیت ادغام کن.

=========================================================
اصل ۱۲ — ضدتکرار
=========================================================

اگر تاریخچه فعالیت‌های قبلی ارائه شد:

- عنوان تکراری تولید نکن.
- سناریوی تکراری تولید نکن.
- مثال‌های یکسان استفاده نکن.
- بازی مشابه را پشت سر هم تکرار نکن.
- نوع فعالیت کاربرگ را تغییر بده.

=========================================================
اصل ۱۳ — منابع
=========================================================

فعالیت‌ها باید با وسایل ساده مدرسه قابل اجرا باشند.

در صورت امکان:

کاغذ
مداد
پاک‌کن
تخته
ماژیک
کارت دست‌ساز
اشیای ساده کلاس

را ترجیح بده.

=========================================================
اصل ۱۴ — کتاب درسی
=========================================================

اگر اطلاعات دقیق کتاب، درس، متن یا صفحه داده نشده است:

ادعای تطبیق دقیق با کتاب درسی نکن.

=========================================================
اصل ۱۵ — کیفیت
=========================================================

خروجی باید:

فارسی
دقیق
کاربردی
ساختاریافته
قابل اجرا
متناسب با پایه
متناسب با موضوع
غیرتکراری
قابل استفاده در کلاس

باشد.

فقط JSON مطابق schema تعیین‌شده برگردان.
هیچ متن دیگری خارج از JSON ننویس.
`;

/* =========================================================
   CONFIG NORMALIZATION
========================================================= */

function normalizeConfig(input = {}) {
  return {
    contentType: String(
      input.contentType || "بسته کامل تدریس"
    ),

    grade: String(
      input.grade || "پایه ابتدایی"
    ),

    subject: String(
      input.subject || "نامشخص"
    ),

    topic: String(
      input.topic || "نامشخص"
    ),

    studentLevel: String(
      input.studentLevel || "متوسط"
    ),

    duration: String(
      input.duration || "45 دقیقه"
    ),

    studentCount: String(
      input.studentCount || "20"
    ),

    method: String(
      input.method || "یادگیری فعال"
    ),

    educationalGoals: String(
      input.educationalGoals || ""
    ),

    differentiation:
      input.differentiation !== false,

    visualDesign:
      input.visualDesign !== false,

    avoidRepetition:
      input.avoidRepetition !== false,

    lifeSkills:
      input.lifeSkills !== false,

    assessment:
      input.assessment !== false,

    game:
      input.game !== false,

    history: Array.isArray(input.history)
      ? input.history.slice(-10)
      : []
  };
}

/* =========================================================
   USER PROMPT
========================================================= */

function buildUserPrompt(config) {
  return `
برای یک معلم ابتدایی ایرانی، ${config.contentType} طراحی کن.

اطلاعات ورودی:

پایه:
${config.grade}

درس:
${config.subject}

موضوع:
${config.topic}

سطح غالب دانش‌آموزان:
${config.studentLevel}

مدت کلاس:
${config.duration}

تعداد دانش‌آموز:
${config.studentCount}

روش تدریس:
${config.method}

اهداف اضافی:
${config.educationalGoals || "ندارد"}

تفاوت فردی:
${config.differentiation ? "فعال باشد" : "فعال نباشد"}

طراحی بصری کاربرگ:
${config.visualDesign ? "فعال باشد" : "فعال نباشد"}

ضدتکرار:
${config.avoidRepetition ? "فعال باشد" : "فعال نباشد"}

مهارت‌های زندگی:
${config.lifeSkills ? "در صورت ارتباط واقعی ادغام شود" : "استفاده نشود"}

ارزشیابی:
${config.assessment ? "فعال باشد" : "فعال نباشد"}

بازی:
${config.game ? "در صورت تناسب طراحی شود" : "استفاده نشود"}

تاریخچه اخیر برای جلوگیری از تکرار:

${
  config.history.length
    ? JSON.stringify(config.history)
    : "هیچ سابقه‌ای وجود ندارد."
}

اکنون یک بسته آموزشی حرفه‌ای، واقعی و قابل اجرای کلاسی تولید کن.
`;
}

/* =========================================================
   OPENAI GENERATION
========================================================= */

async function generateEducationalPackage(config) {
  if (!client) {
    const error = new Error(
      "OPENAI_API_KEY is not configured"
    );

    error.status = 503;
    error.code = "missing_api_key";

    throw error;
  }

  const response = await client.responses.create({
    model: MODEL,

    store: false,

    instructions: SYSTEM_PROMPT,

    input: buildUserPrompt(config),

    text: {
      format: {
        type: "json_schema",
        name: "hamyar_moalem_package",
        strict: true,
        schema: EDUCATIONAL_SCHEMA
      }
    }
  });

  if (!response.output_text) {
    throw new Error(
      "OpenAI returned empty output"
    );
  }

  let data;

  try {
    data = JSON.parse(
      response.output_text
    );
  } catch (error) {
    console.error(
      "[JSON_PARSE_ERROR]",
      response.output_text
    );

    error.code = "invalid_model_json";

    throw error;
  }

  return {
    data,
    responseId: response.id
  };
}

/* =========================================================
   QUALITY CHECK
========================================================= */

function qualityCheck(data) {
  const warnings = [];

  if (!data?.title) {
    warnings.push(
      "عنوان بسته آموزشی تولید نشده است."
    );
  }

  if (!data?.lessonPlan) {
    warnings.push(
      "طرح درس تولید نشده است."
    );
  }

  if (!data?.objectives) {
    warnings.push(
      "اهداف آموزشی تولید نشده است."
    );
  }

  if (!data?.worksheet) {
    warnings.push(
      "کاربرگ تولید نشده است."
    );
  }

  if (!data?.differentiation) {
    warnings.push(
      "تفاوت فردی تولید نشده است."
    );
  }

  return warnings;
}

/* =========================================================
   GENERATE API
========================================================= */

app.post(
  "/api/generate",
  generateLimiter,
  async (req, res) => {
    const requestId =
      `hm_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 8)}`;

    try {
      const config =
        normalizeConfig(req.body);

      if (
        !config.topic ||
        config.topic === "نامشخص"
      ) {
        return res.status(400).json({
          ok: false,
          requestId,
          error: "موضوع درس را وارد کنید."
        });
      }

      const result =
        await generateEducationalPackage(
          config
        );

      const warnings =
        qualityCheck(result.data);

      if (
        result.data.qualityControl &&
        warnings.length
      ) {
        result.data.qualityControl.warnings =
          [
            ...result.data.qualityControl.warnings,
            ...warnings
          ];
      }

      return res.json({
        ok: true,
        requestId,
        model: MODEL,
        data: result.data
      });

    } catch (error) {

      console.error(
        "[OPENAI_ERROR]",
        {
          requestId,

          name: error?.name,

          message: error?.message,

          status: error?.status,

          code: error?.code,

          type: error?.type,

          request_id:
            error?.request_id
        }
      );

      let message =
        "ارتباط با هوش مصنوعی برقرار نشد. لطفاً دوباره تلاش کنید.";

      let status = 500;

      if (
        error?.code ===
        "missing_api_key"
      ) {
        message =
          "کلید API در سرور تنظیم نشده است.";

        status = 503;
      }

      else if (
        error?.status === 401 ||
        error?.code ===
          "invalid_api_key"
      ) {
        message =
          "کلید API معتبر نیست یا دسترسی آن مشکل دارد.";

        status = 401;
      }

      else if (
        error?.status === 403
      ) {
        message =
          "کلید یا پروژه به مدل انتخاب‌شده دسترسی ندارد.";

        status = 403;
      }

      else if (
        error?.code ===
          "insufficient_quota"
      ) {
        message =
          "اعتبار API تمام شده یا محدودیت مصرف پروژه فعال است.";

        status = 429;
      }

      else if (
        error?.status === 429
      ) {
        message =
          "تعداد درخواست‌ها زیاد است یا محدودیت مصرف فعال شده است. کمی بعد دوباره تلاش کنید.";

        status = 429;
      }

      else if (
        error?.code ===
        "invalid_model_json"
      ) {
        message =
          "پاسخ هوش مصنوعی قابل پردازش نبود. دوباره تلاش کنید.";

        status = 502;
      }

      else if (
        error?.status >= 400 &&
        error?.status < 600
      ) {
        status = error.status;
      }

      return res.status(status).json({
        ok: false,
        requestId,
        error: message
      });
    }
  }
);

/* =========================================================
   FRONTEND FALLBACK
========================================================= */

app.get("*", (req, res) => {
  res.sendFile(
    path.join(
      __dirname,
      "public",
      "index.html"
    )
  );
});

/* =========================================================
   START SERVER
========================================================= */

app.listen(
  PORT,
  () => {
    console.log(
      `Hamyar Moalem started | port=${PORT} | model=${MODEL} | ai=${Boolean(client)}`
    );
  }
);
