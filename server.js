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
   STATIC FRONTEND
========================================================= */

app.use(express.static(path.join(__dirname, "public")));

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "Hamyar Moalem",
    aiConfigured: Boolean(client),
    model: MODEL,
    version: "2.0.0"
  });
});

/* =========================================================
   EDUCATIONAL SYSTEM PROMPT
========================================================= */

const SYSTEM_PROMPT = `
تو «همیار معلم» هستی؛ یک موتور طراحی آموزشی تخصصی برای معلمان دوره ابتدایی ایران.

تو نباید مثل یک چت‌بات عمومی پاسخ بدهی.

نقش تو ترکیبی از:

- معلم خبره دوره ابتدایی
- کارشناس آموزش ابتدایی
- طراح آموزشی
- متخصص روان‌شناسی یادگیری کودک
- طراح فعالیت کلاسی
- طراح بازی آموزشی
- متخصص ارزشیابی توصیفی
- طراح کاربرگ
- متخصص تفاوت‌های فردی
- متخصص مدیریت کلاس
- طراح محتوای چاپی آموزشی

است.

=========================================================
اصل شماره ۱ — کاربرد واقعی در کلاس
=========================================================

هر چیزی که تولید می‌کنی باید توسط یک معلم واقعی قابل اجرا باشد.

از جملات کلی مانند:

«دانش‌آموزان را تشویق کنید»
«فعالیت جذابی انجام دهید»
«از روش مشارکتی استفاده کنید»

به‌تنهایی استفاده نکن.

به‌جای آن دقیق بگو:

معلم چه کاری انجام دهد؟
چه چیزی بگوید؟
دانش‌آموز چه کاری انجام دهد؟
چه پاسخی انتظار می‌رود؟
اگر پاسخ اشتباه بود معلم چه کند؟
چقدر زمان لازم است؟
چه وسایلی لازم است؟

=========================================================
اصل شماره ۲ — تناسب با سن
=========================================================

سطح شناختی، زبانی، حرکتی و اجتماعی کودک را متناسب با پایه در نظر بگیر.

برای پایه‌های پایین:
- جمله کوتاه
- دستور ساده
- فعالیت تصویری
- بازی
- حرکت
- رنگ
- دسته‌بندی
- مشاهده
- لمس و دست‌کاری

برای پایه‌های بالاتر:
- مسئله
- استدلال
- مقایسه
- تحلیل
- کشف الگو
- حل مسئله
- فعالیت گروهی
- تفکر انتقادی
- خلاقیت

=========================================================
اصل شماره ۳ — یادگیری فعال
=========================================================

تا جای ممکن یادگیری را از حالت سخنرانی خارج کن.

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
اصل شماره ۴ — اهداف قابل سنجش
=========================================================

اهداف باید قابل مشاهده و سنجش باشند.

از افعال مبهم مانند:
«آشنا شود»
«بداند»
«درک کند»

کمتر استفاده کن.

از افعالی مانند:
تشخیص دهد
محاسبه کند
مقایسه کند
طبقه‌بندی کند
توضیح دهد
حل کند
مثال بزند
تولید کند
استدلال کند
اجرا کند
استفاده کن.

=========================================================
اصل شماره ۵ — تفاوت فردی
=========================================================

حداقل سه سطح طراحی کن:

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
- سؤال باز
- استدلال
- خلاقیت
- انتقال مفهوم به موقعیت جدید

سطح قوی نباید فقط «تعداد سؤال بیشتر» باشد.

=========================================================
اصل شماره ۶ — کاربرگ حرفه‌ای
=========================================================

کاربرگ نباید فقط یک صفحه پر از سؤال متنی باشد.

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

برای هر فعالیت مشخص کن:

نوع فعالیت
هدف آموزشی
دستور دانش‌آموز
محتوا
سطح دشواری
پاسخ صحیح
فضای موردنیاز
پیشنهاد بصری

=========================================================
اصل شماره ۷ — بازی آموزشی
=========================================================

بازی باید واقعاً آموزشی باشد.

هر بازی باید داشته باشد:

هدف یادگیری
وسایل
تعداد بازیکنان
زمان
نحوه شروع
قوانین
مراحل
نحوه امتیازدهی
شرایط برد
نقش معلم
نحوه ساده‌سازی
نحوه سخت‌تر کردن

بازی نباید صرفاً سرگرمی بدون ارتباط با هدف آموزشی باشد.

=========================================================
اصل شماره ۸ — ارزشیابی
=========================================================

ارزشیابی را در سه مرحله طراحی کن:

تشخیصی:
قبل از آموزش چه چیزی باید بررسی شود؟

تکوینی:
در طول تدریس چگونه بفهمیم دانش‌آموز یاد گرفته؟

پایانی:
در پایان چگونه تحقق هدف را بررسی کنیم؟

برای پاسخ‌های اشتباه نیز پیشنهاد مداخله بده.

=========================================================
اصل شماره ۹ — ارزشیابی توصیفی
=========================================================

بازخورد باید دقیق و قابل استفاده باشد.

مثلاً به جای:

«خوب است.»

از چیزی مانند:

«در تشخیص مفهوم اصلی موفق بودی؛ در مرحله بعد هنگام حل مسئله، اطلاعات مهم سؤال را مشخص کن.»

استفاده کن.

=========================================================
اصل شماره ۱۰ — خطاهای رایج
=========================================================

برای هر موضوع مهم، خطاهای محتمل دانش‌آموز را شناسایی کن.

ساختار:

خطای احتمالی
→ علت احتمالی
→ نشانه‌ای که معلم می‌بیند
→ مداخله پیشنهادی

=========================================================
اصل شماره ۱۱ — مهارت‌های زندگی
=========================================================

اگر ارتباط واقعی وجود دارد، مهارت‌هایی مانند:

همکاری
حل مسئله
مسئولیت‌پذیری
خودتنظیمی
تصمیم‌گیری
ارتباط مؤثر
احترام
همدلی
مدیریت زمان

را در خود فعالیت قرار بده.

مهارت زندگی نباید مصنوعی و جدا از درس باشد.

=========================================================
اصل شماره ۱۲ — ضدتکرار
=========================================================

اگر تاریخچه فعالیت‌های قبلی ارائه شد:

- عنوان‌ها را تکرار نکن.
- سناریو را تکرار نکن.
- نوع فعالیت را پشت سر هم تکرار نکن.
- بازی مشابه را دوباره تولید نکن.
- مثال‌های یکسان را تکرار نکن.
- اگر فعالیت قبلی «جورکردنی» بود، ترجیحاً از قالب متفاوت استفاده کن.

=========================================================
اصل شماره ۱۳ — محدودیت منابع
=========================================================

فعالیت‌ها باید با وسایل ساده مدرسه قابل اجرا باشند.

در صورت امکان از:

کاغذ
مداد
پاک‌کن
تخته
ماژیک
کارت‌های دست‌ساز
اشیای ساده کلاس

استفاده کن.

فعالیت نباید به تجهیزات گران‌قیمت وابسته باشد مگر اینکه کاربر درخواست کرده باشد.

=========================================================
اصل شماره ۱۴ — کتاب درسی
=========================================================

اگر کاربر اطلاعات دقیق کتاب، درس یا متن را ارائه نکرده است:

ادعای تطبیق دقیق با صفحه یا محتوای خاص کتاب درسی نکن.

در صورت نبود اطلاعات کافی، محتوای عمومی ولی متناسب با موضوع تولید کن.

=========================================================
اصل شماره ۱۵ — خروجی
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

باشد.
`;

/* =========================================================
   JSON SCHEMA
========================================================= */

const EDUCATIONAL_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: {
      type: "string"
    },

    summary: {
      type: "string"
    },

    metadata: {
      type: "object",
      additionalProperties: false,
      properties: {
        grade: { type: "string" },
        subject: { type: "string" },
        topic: { type: "string" },
        duration: { type: "string" },
        method: { type: "string" }
      },
      required: [
        "grade",
        "subject",
        "topic",
        "duration",
        "method"
      ]
    },

    objectives: {
      type: "object",
      additionalProperties: false,
      properties: {
        knowledge: {
          type: "array",
          items: { type: "string" }
        },
        skills: {
          type: "array",
          items: { type: "string" }
        },
        attitudes: {
          type: "array",
          items: { type: "string" }
        }
      },
      required: [
        "knowledge",
        "skills",
        "attitudes"
      ]
    },

    lessonPlan: {
      type: "object",
      additionalProperties: false,
      properties: {
        opening: { type: "string" },
        discovery: { type: "string" },
        instruction: { type: "string" },
        practice: { type: "string" },
        formativeAssessment: {
          type: "array",
          items: { type: "string" }
        },
        summary: { type: "string" },
        homework: { type: "string" }
      },
      required: [
        "opening",
        "discovery",
        "instruction",
        "practice",
        "formativeAssessment",
        "summary",
        "homework"
      ]
    },

    activity: {
      type: "object",
      additionalProperties: false,
      properties: {
        title: { type: "string" },
        instructions: { type: "string" },
        materials: {
          type: "array",
          items: { type: "string" }
        },
        steps: {
          type: "array",
          items: { type: "string" }
        }
      },
      required: [
        "title",
        "instructions",
        "materials",
        "steps"
      ]
    },

    game: {
      type: "object",
      additionalProperties: false,
      properties: {
        title: { type: "string" },
        instructions: { type: "string" },
        rules: {
          type: "array",
          items: { type: "string" }
        },
        goal: { type: "string" }
      },
      required: [
        "title",
        "instructions",
        "rules",
        "goal"
      ]
    },

    worksheet: {
      type: "object",
      additionalProperties: false,
      properties: {
        title: { type: "string" },
        design: { type: "string" },
        questions: {
          type: "array",
          items: { type: "string" }
        },
        visualSuggestions: {
          type: "array",
          items: { type: "string" }
        }
      },
      required: [
        "title",
        "design",
        "questions",
        "visualSuggestions"
      ]
    },

    differentiation: {
      type: "object",
      additionalProperties: false,
      properties: {
        weak: {
          type: "array",
          items: { type: "string" }
        },
        medium: {
          type: "array",
          items: { type: "string" }
        },
        strong: {
          type: "array",
          items: { type: "string" }
        }
      },
      required: [
        "weak",
        "medium",
        "strong"
      ]
    },

    assessment: {
      type: "object",
      additionalProperties: false,
      properties: {
        diagnostic: {
          type: "array",
          items: { type: "string" }
        },
        formative: {
          type: "array",
          items: { type: "string" }
        },
        descriptiveFeedback: {
          type: "array",
          items: { type: "string" }
        }
      },
      required: [
        "diagnostic",
        "formative",
        "descriptiveFeedback"
      ]
    },

    lifeSkills: {
      type: "array",
      items: { type: "string" }
    },

    teacherNotes: {
      type: "array",
      items: { type: "string" }
    },

    qualityControl: {
      type: "object",
      additionalProperties: false,
      properties: {
        gradeAppropriateness: { type: "string" },
        objectiveQuality: { type: "string" },
        differentiation: { type: "string" },
        assessmentQuality: { type: "string" },
        repetitionCheck: { type: "string" },
        warnings: {
          type: "array",
          items: { type: "string" }
        }
      },
      required: [
        "gradeAppropriateness",
        "objectiveQuality",
        "differentiation",
        "assessmentQuality",
        "repetitionCheck",
        "warnings"
      ]
    }
  },

  required: [
    "title",
    "summary",
    "metadata",
    "objectives",
    "lessonPlan",
    "activity",
    "game",
    "worksheet",
    "differentiation",
    "assessment",
    "lifeSkills",
    "teacherNotes",
    "qualityControl"
  ]
};

/* =========================================================
   VALIDATION
========================================================= */

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

/* =========================================================
   NORMALIZE CONFIG
========================================================= */

function normalizeConfig(config) {
  return {
    contentType: String(config.contentType || ""),
    grade: String(config.grade || ""),
    subject: String(config.subject || ""),
    topic: String(config.topic || ""),
    studentLevel: String(config.studentLevel || "متوسط"),
    template: String(config.template || "خودکار"),
    duration: String(config.duration || "۴۵ دقیقه"),
    studentCount: String(config.studentCount || "نامشخص"),
    method: String(config.method || "ترکیبی"),
    educationalGoals: Boolean(config.educationalGoals),
    pedagogicalPrinciples: Boolean(config.pedagogicalPrinciples),
    differentiation: Boolean(config.differentiation),
    visualDesign: Boolean(config.visualDesign),
    avoidRepetition: Boolean(config.avoidRepetition),
    lifeSkills: Boolean(config.lifeSkills),
    assessment: Boolean(config.assessment),
    game: Boolean(config.game),
    history: Array.isArray(config.history)
      ? config.history.slice(-15)
      : []
  };
}

/* =========================================================
   BUILD USER PROMPT
========================================================= */

function buildUserPrompt(config) {
  return `
یک بسته آموزشی حرفه‌ای برای معلم ابتدایی طراحی کن.

مشخصات:

پایه:
${config.grade}

درس:
${config.subject}

موضوع:
${config.topic}

نوع محتوا:
${config.contentType}

سطح دانش‌آموز:
${config.studentLevel}

قالب:
${config.template}

زمان:
${config.duration}

تعداد دانش‌آموزان:
${config.studentCount}

روش تدریس:
${config.method}

اهداف آموزشی:
${config.educationalGoals ? "حتماً طراحی شود." : "در صورت نیاز طراحی شود."}

اصول آموزشی:
${config.pedagogicalPrinciples ? "حتماً رعایت شود." : "رعایت شود."}

تفاوت فردی:
${config.differentiation ? "حتماً برای سه سطح طراحی شود." : "در صورت امکان طراحی شود."}

طراحی بصری:
${config.visualDesign ? "حتماً پیشنهادهای بصری کاربردی ارائه شود." : "در صورت تناسب ارائه شود."}

ضدتکرار:
${config.avoidRepetition ? "حتماً فعال باشد." : "در صورت وجود تاریخچه رعایت شود."}

مهارت‌های زندگی:
${config.lifeSkills ? "در فعالیت‌ها ادغام شود." : "فقط در صورت ارتباط واقعی."}

ارزشیابی:
${config.assessment ? "به‌صورت کامل طراحی شود." : "در حد لازم."}

بازی:
${config.game ? "یک بازی آموزشی واقعی و قابل اجرا طراحی شود." : "در صورت تناسب."}

=========================================================
تاریخچه محتوا برای جلوگیری از تکرار
=========================================================

${JSON.stringify(config.history, null, 2)}

=========================================================
الزامات تخصصی
=========================================================

۱. محتوای تولیدی باید واقعاً قابل استفاده در کلاس باشد.

۲. فعالیت‌ها باید متناسب با سن دانش‌آموز باشند.

۳. طرح درس باید دارای توالی منطقی باشد.

۴. فعالیت اکتشافی باید دانش‌آموز را به کشف مفهوم هدایت کند.

۵. تمرین باید از ساده به پیچیده حرکت کند.

۶. اگر موضوع اجازه می‌دهد، فعالیت دست‌ورزی یا بصری طراحی کن.

۷. برای دانش‌آموز ضعیف داربست واقعی ارائه کن.

۸. برای دانش‌آموز قوی چالش مفهومی ایجاد کن.

۹. کاربرگ باید ترکیبی از فعالیت‌ها باشد و فقط فهرست سؤال نباشد.

۱۰. پیشنهادهای بصری باید قابل تبدیل به گرافیک واقعی باشند.

۱۱. بازی باید مستقیماً با هدف آموزشی ارتباط داشته باشد.

۱۲. ارزشیابی باید اطلاعاتی برای تصمیم بعدی معلم تولید کند.

۱۳. خطاهای رایج دانش‌آموز را در teacherNotes یا فعالیت‌ها لحاظ کن.

۱۴. از محتوای تکراری موجود در history استفاده نکن.

۱۵. اگر اطلاعات دقیق کتاب درسی ارائه نشده، ادعای تطبیق با صفحه یا متن مشخص نکن.

=========================================================
کیفیت مورد انتظار
=========================================================

اگر بین «تولید سریع» و «تولید باکیفیت» مجبور به انتخاب شدی،
کیفیت آموزشی را انتخاب کن.

پاسخ باید شبیه خروجی یک معلم خبره و کارشناس آموزش ابتدایی باشد،
نه یک متن عمومی تولیدشده توسط چت‌بات.
`;
}

/* =========================================================
   OPENAI GENERATION
========================================================= */

async function generateEducationalPackage(config) {
  const response = await client.responses.create({
    model: MODEL,

    input: [
      {
        role: "system",
        content: SYSTEM_PROMPT
      },
      {
        role: "user",
        content: buildUserPrompt(config)
      }
    ],

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
    throw new Error("EMPTY_AI_OUTPUT");
  }

  return JSON.parse(response.output_text);
}

/* =========================================================
   QUALITY CONTROL
========================================================= */

function qualityCheck(data) {
  const warnings = [];

  if (!data.title?.trim()) {
    warnings.push("عنوان تولید نشده است.");
  }

  if (!data.summary?.trim()) {
    warnings.push("خلاصه تولید نشده است.");
  }

  if (!data.objectives?.knowledge?.length) {
    warnings.push("هدف دانشی وجود ندارد.");
  }

  if (!data.objectives?.skills?.length) {
    warnings.push("هدف مهارتی وجود ندارد.");
  }

  if (!data.lessonPlan?.opening?.trim()) {
    warnings.push("مرحله شروع درس ناقص است.");
  }

  if (!data.lessonPlan?.discovery?.trim()) {
    warnings.push("مرحله اکتشاف ناقص است.");
  }

  if (!data.lessonPlan?.instruction?.trim()) {
    warnings.push("مرحله آموزش ناقص است.");
  }

  if (!data.lessonPlan?.practice?.trim()) {
    warnings.push("مرحله تمرین ناقص است.");
  }

  if (!data.activity?.steps?.length) {
    warnings.push("فعالیت اصلی فاقد مراحل اجرایی است.");
  }

  if (!data.differentiation?.weak?.length) {
    warnings.push("تفکیک سطح ضعیف وجود ندارد.");
  }

  if (!data.differentiation?.medium?.length) {
    warnings.push("تفکیک سطح متوسط وجود ندارد.");
  }

  if (!data.differentiation?.strong?.length) {
    warnings.push("تفکیک سطح قوی وجود ندارد.");
  }

  if (!data.assessment?.diagnostic?.length) {
    warnings.push("ارزشیابی تشخیصی وجود ندارد.");
  }

  if (!data.assessment?.formative?.length) {
    warnings.push("ارزشیابی تکوینی وجود ندارد.");
  }

  if (!data.worksheet?.questions?.length) {
    warnings.push("کاربرگ فاقد فعالیت است.");
  }

  if (!data.teacherNotes?.length) {
    warnings.push("یادداشت معلم وجود ندارد.");
  }

  return {
    passed: warnings.length === 0,
    warnings
  };
}

/* =========================================================
   QUALITY ENRICHMENT
========================================================= */

function enrichQualityControl(data, config, check) {
  if (!data.qualityControl) {
    data.qualityControl = {};
  }

  data.qualityControl.gradeAppropriateness =
    data.qualityControl.gradeAppropriateness ||
    `محتوا برای ${config.grade} طراحی شده است و باید از نظر سطح زبانی و شناختی بررسی شود.`;

  data.qualityControl.objectiveQuality =
    data.qualityControl.objectiveQuality ||
    "اهداف بر اساس عملکرد قابل مشاهده طراحی شده‌اند.";

  data.qualityControl.differentiation =
    data.qualityControl.differentiation ||
    "سه سطح ضعیف، متوسط و قوی در طراحی لحاظ شده است.";

  data.qualityControl.assessmentQuality =
    data.qualityControl.assessmentQuality ||
    "ارزشیابی تشخیصی و تکوینی در بسته لحاظ شده است.";

  data.qualityControl.repetitionCheck =
    data.qualityControl.repetitionCheck ||
    (config.avoidRepetition
      ? "تاریخچه قبلی برای کاهش تکرار در اختیار موتور تولید قرار گرفت."
      : "حالت ضدتکرار فعال نشده بود.");

  data.qualityControl.warnings = [
    ...(data.qualityControl.warnings || []),
    ...check.warnings
  ];

  return data;
}

/* =========================================================
   GENERATE ENDPOINT
========================================================= */

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

    const config = normalizeConfig(req.body);

    console.log(
      `[${requestId}] Generating educational package:`,
      config.grade,
      config.subject,
      config.topic
    );

    const data = await generateEducationalPackage(config);

    const check = qualityCheck(data);

    const finalData = enrichQualityControl(
      data,
      config,
      check
    );

    console.log(
      `[${requestId}] Generation completed. QA: ${
        check.passed ? "PASS" : "WARN"
      }`
    );

    return res.json({
      ok: true,
      requestId,
      model: MODEL,
      version: "2.0.0",
      quality: {
        passed: check.passed,
        warningCount: check.warnings.length
      },
      data: finalData
    });
  } catch (error) {
    console.error(
      `[${requestId}] AI generation failed:`,
      error?.message || "unknown error"
    );

    if (error?.status === 429) {
      return res.status(429).json({
        ok: false,
        requestId,
        error:
          "ظرفیت سرویس هوش مصنوعی موقتاً محدود شده است. کمی بعد دوباره تلاش کنید."
      });
    }

    if (error?.status === 401) {
      return res.status(500).json({
        ok: false,
        requestId,
        error:
          "احراز هویت سرویس هوش مصنوعی روی سرور با مشکل مواجه شده است."
      });
    }

    return res.status(500).json({
      ok: false,
      requestId,
      error:
        "تولید محتوای آموزشی با خطا مواجه شد. لطفاً دوباره تلاش کنید."
    });
  }
});

/* =========================================================
   SPA FALLBACK
========================================================= */

app.get("*", (req, res) => {
  res.sendFile(
    path.join(__dirname, "public", "index.html")
  );
});

/* =========================================================
   ERROR HANDLER
========================================================= */

app.use((err, req, res, next) => {
  console.error(
    "Server error:",
    err?.message || "unknown error"
  );

  res.status(500).json({
    ok: false,
    error: "خطای داخلی سرور."
  });
});

/* =========================================================
   START
========================================================= */

app.listen(PORT, () => {
  console.log(`
========================================
   HAMYAR MOALEM
   Educational AI Engine v2.0.0
   Server running on port ${PORT}
========================================
  `);
});
