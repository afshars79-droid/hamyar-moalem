import express from "express";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MODEL = process.env.OPENAI_MODEL || "gpt-5";

/*
|--------------------------------------------------------------------------
| Render / Reverse Proxy
|--------------------------------------------------------------------------
| Render درخواست‌ها را از طریق Proxy به Node می‌رساند.
| این تنظیم باعث می‌شود Express هدر X-Forwarded-For را به‌درستی مدیریت کند.
*/
app.set("trust proxy", 1);

/*
|--------------------------------------------------------------------------
| Middleware
|--------------------------------------------------------------------------
*/

app.use(express.json({ limit: "2mb" }));

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      ok: false,
      error: "تعداد درخواست‌ها زیاد است. لطفاً کمی بعد دوباره امتحان کنید."
    }
  })
);

/*
|--------------------------------------------------------------------------
| OpenAI Client
|--------------------------------------------------------------------------
*/

const apiKey = process.env.OPENAI_API_KEY;

const client = apiKey
  ? new OpenAI({
      apiKey
    })
  : null;

/*
|--------------------------------------------------------------------------
| System Prompt
|--------------------------------------------------------------------------
*/

const SYSTEM_PROMPT = `
تو «همیار معلم» هستی؛ یک دستیار تخصصی برای معلمان دوره ابتدایی ایران.

نقش تو ترکیبی از این تخصص‌هاست:

1. معلم خبره دوره ابتدایی
2. متخصص برنامه‌ریزی آموزشی
3. متخصص طراحی آموزشی
4. متخصص ارزشیابی توصیفی
5. متخصص طراحی فعالیت و بازی آموزشی
6. متخصص طراحی کاربرگ کودک
7. متخصص آموزش متناسب با سن دانش‌آموز
8. متخصص آموزش افتراقی
9. متخصص مدیریت کلاس
10. متخصص تولید محتوای قابل چاپ

هدف:
تولید یک بسته آموزشی واقعی، کاربردی و قابل استفاده در کلاس؛
نه یک متن عمومی و تئوریک.

اصول بسیار مهم:

- محتوا باید متناسب با سن دانش‌آموز باشد.
- فعالیت‌ها باید قابل اجرا در کلاس باشند.
- اهداف باید قابل مشاهده و قابل سنجش باشند.
- فعالیت‌ها نباید صرفاً توضیح نظری باشند.
- کاربرگ باید واقعاً قابل چاپ و استفاده باشد.
- از فعالیت‌های تکراری اجتناب کن.
- برای دانش‌آموز ضعیف، متوسط و قوی مسیر متفاوت طراحی کن.
- ارزشیابی باید بر اساس شواهد عملکردی باشد.
- در صورت امکان از بازی، داستان، مسئله، کشف، تصویر ذهنی و فعالیت عملی استفاده کن.
- مهارت‌های زندگی باید طبیعی و مرتبط با درس باشند.
- زمان هر فعالیت مشخص باشد.
- نقش معلم و دانش‌آموز مشخص باشد.
- خطاهای احتمالی دانش‌آموز و مداخله اصلاحی مشخص باشد.

برای کاربرگ:
- سؤال‌ها باید متنوع باشند.
- از تطبیق، دسته‌بندی، جای خالی، درست/نادرست، چهارگزینه‌ای،
  جدول، الگو، معما، مسیر، داستان، مسئله و فعالیت تصویری استفاده کن.
- کاربرگ نباید فقط مجموعه‌ای از سؤال‌های ساده باشد.
- فضای کافی برای پاسخ در نظر بگیر.
- ساختار مناسب چاپ A4 داشته باشد.
- فعالیت‌ها باید هدف آموزشی مشخص داشته باشند.

همیشه خروجی را دقیقاً مطابق JSON Schema ارائه کن.
`;

/*
|--------------------------------------------------------------------------
| Educational JSON Schema
|--------------------------------------------------------------------------
*/

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
        grade: {
          type: "string"
        },
        subject: {
          type: "string"
        },
        lesson: {
          type: "string"
        },
        duration: {
          type: "string"
        },
        difficulty: {
          type: "string"
        }
      },
      required: [
        "grade",
        "subject",
        "lesson",
        "duration",
        "difficulty"
      ]
    },

    objectives: {
      type: "array",
      items: {
        type: "string"
      }
    },

    lessonPlan: {
      type: "object",
      additionalProperties: false,
      properties: {
        preparation: {
          type: "string"
        },
        introduction: {
          type: "string"
        },
        exploration: {
          type: "string"
        },
        instruction: {
          type: "string"
        },
        guidedPractice: {
          type: "string"
        },
        independentPractice: {
          type: "string"
        },
        assessment: {
          type: "string"
        },
        summary: {
          type: "string"
        },
        homework: {
          type: "string"
        }
      },
      required: [
        "preparation",
        "introduction",
        "exploration",
        "instruction",
        "guidedPractice",
        "independentPractice",
        "assessment",
        "summary",
        "homework"
      ]
    },

    activity: {
      type: "object",
      additionalProperties: false,
      properties: {
        title: {
          type: "string"
        },
        objective: {
          type: "string"
        },
        materials: {
          type: "array",
          items: {
            type: "string"
          }
        },
        teacherRole: {
          type: "string"
        },
        studentRole: {
          type: "string"
        },
        steps: {
          type: "array",
          items: {
            type: "string"
          }
        },
        expectedResponse: {
          type: "string"
        }
      },
      required: [
        "title",
        "objective",
        "materials",
        "teacherRole",
        "studentRole",
        "steps",
        "expectedResponse"
      ]
    },

    game: {
      type: "object",
      additionalProperties: false,
      properties: {
        title: {
          type: "string"
        },
        objective: {
          type: "string"
        },
        story: {
          type: "string"
        },
        rules: {
          type: "array",
          items: {
            type: "string"
          }
        },
        stages: {
          type: "array",
          items: {
            type: "string"
          }
        },
        scoring: {
          type: "string"
        },
        feedback: {
          type: "string"
        },
        materials: {
          type: "array",
          items: {
            type: "string"
          }
        }
      },
      required: [
        "title",
        "objective",
        "story",
        "rules",
        "stages",
        "scoring",
        "feedback",
        "materials"
      ]
    },

    worksheet: {
      type: "object",
      additionalProperties: false,
      properties: {
        title: {
          type: "string"
        },
        instructions: {
          type: "string"
        },
        studentFields: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: {
              type: "boolean"
            },
            class: {
              type: "boolean"
            },
            date: {
              type: "boolean"
            }
          },
          required: [
            "name",
            "class",
            "date"
          ]
        },
        questions: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              type: {
                type: "string"
              },
              prompt: {
                type: "string"
              },
              options: {
                type: "array",
                items: {
                  type: "string"
                }
              },
              answerSpace: {
                type: "string"
              },
              visual: {
                type: "string"
              }
            },
            required: [
              "type",
              "prompt",
              "options",
              "answerSpace",
              "visual"
            ]
          }
        },
        answerKey: {
          type: "array",
          items: {
            type: "string"
          }
        },
        visualSuggestions: {
          type: "array",
          items: {
            type: "string"
          }
        }
      },
      required: [
        "title",
        "instructions",
        "studentFields",
        "questions",
        "answerKey",
        "visualSuggestions"
      ]
    },

    differentiation: {
      type: "object",
      additionalProperties: false,
      properties: {
        weak: {
          type: "array",
          items: {
            type: "string"
          }
        },
        medium: {
          type: "array",
          items: {
            type: "string"
          }
        },
        strong: {
          type: "array",
          items: {
            type: "string"
          }
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
        initial: {
          type: "array",
          items: {
            type: "string"
          }
        },
        formative: {
          type: "array",
          items: {
            type: "string"
          }
        },
        final: {
          type: "array",
          items: {
            type: "string"
          }
        },
        descriptiveFeedback: {
          type: "array",
          items: {
            type: "string"
          }
        },
        interventions: {
          type: "array",
          items: {
            type: "string"
          }
        }
      },
      required: [
        "initial",
        "formative",
        "final",
        "descriptiveFeedback",
        "interventions"
      ]
    },

    lifeSkills: {
      type: "array",
      items: {
        type: "string"
      }
    },

    teacherNotes: {
      type: "array",
      items: {
        type: "string"
      }
    },

    qualityControl: {
      type: "object",
      additionalProperties: false,
      properties: {
        ageAppropriate: {
          type: "boolean"
        },
        measurableObjectives: {
          type: "boolean"
        },
        differentiated: {
          type: "boolean"
        },
        printableWorksheet: {
          type: "boolean"
        },
        assessmentIncluded: {
          type: "boolean"
        },
        classroomReady: {
          type: "boolean"
        },
        nonRepetitive: {
          type: "boolean"
        },
        notes: {
          type: "array",
          items: {
            type: "string"
          }
        }
      },
      required: [
        "ageAppropriate",
        "measurableObjectives",
        "differentiated",
        "printableWorksheet",
        "assessmentIncluded",
        "classroomReady",
        "nonRepetitive",
        "notes"
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

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function clean(value, fallback = "") {
  if (value === undefined || value === null) {
    return fallback;
  }

  return String(value).trim();
}

function normalizeConfig(body = {}) {
  return {
    teacherName: clean(body.teacherName, "معلم"),
    schoolName: clean(body.schoolName, ""),
    grade: clean(body.grade, "پایه اول"),
    subject: clean(body.subject, "ریاضی"),
    lesson: clean(body.lesson, ""),
    city: clean(body.city, ""),
    duration: clean(body.duration, "45 دقیقه"),
    level: clean(body.level, "متوسط"),
    students: clean(body.students, ""),
    teachingGoal: clean(body.teachingGoal, ""),
    previousTopics: clean(body.previousTopics, ""),
    includeLesson: body.includeLesson !== false,
    includeActivity: body.includeActivity !== false,
    includeGame: body.includeGame !== false,
    includeWorksheet: body.includeWorksheet !== false,
    includeAssessment: body.includeAssessment !== false,
    includeDifferentiation: body.includeDifferentiation !== false,
    includeLifeSkills: body.includeLifeSkills !== false
  };
}

function buildUserPrompt(config) {
  return `
یک بسته تدریس کامل و حرفه‌ای طراحی کن.

اطلاعات کلاس:

نام معلم:
${config.teacherName}

مدرسه:
${config.schoolName || "ذکر نشده"}

پایه:
${config.grade}

درس:
${config.subject}

موضوع / درس:
${config.lesson}

شهر / منطقه:
${config.city || "ذکر نشده"}

زمان:
${config.duration}

سطح غالب کلاس:
${config.level}

تعداد دانش‌آموز:
${config.students || "ذکر نشده"}

هدف خاص معلم:
${config.teachingGoal || "ندارد"}

مباحث قبلی:
${config.previousTopics || "ذکر نشده"}

بخش‌های موردنیاز:

طرح درس:
${config.includeLesson ? "بله" : "خیر"}

فعالیت:
${config.includeActivity ? "بله" : "خیر"}

بازی:
${config.includeGame ? "بله" : "خیر"}

کاربرگ:
${config.includeWorksheet ? "بله" : "خیر"}

ارزشیابی:
${config.includeAssessment ? "بله" : "خیر"}

آموزش افتراقی:
${config.includeDifferentiation ? "بله" : "خیر"}

مهارت‌های زندگی:
${config.includeLifeSkills ? "بله" : "خیر"}

محتوا را به شکلی طراحی کن که معلم بتواند آن را واقعاً در کلاس اجرا کند.
از فعالیت‌های کلی، مبهم و تکراری خودداری کن.
کاربرگ باید شامل فعالیت‌های متنوع و قابل چاپ باشد.
`;
}

/*
|--------------------------------------------------------------------------
| Local Quality Control
|--------------------------------------------------------------------------
*/

function runLocalQualityCheck(pkg) {
  const notes = [];

  if (!pkg) {
    return {
      ok: false,
      notes: ["خروجی خالی است."]
    };
  }

  if (!pkg.title) {
    notes.push("عنوان بسته آموزشی وجود ندارد.");
  }

  if (!Array.isArray(pkg.objectives) || pkg.objectives.length === 0) {
    notes.push("هدف آموزشی کافی وجود ندارد.");
  }

  if (
    !pkg.lessonPlan ||
    !pkg.lessonPlan.introduction ||
    !pkg.lessonPlan.assessment
  ) {
    notes.push("طرح درس کامل نیست.");
  }

  if (
    !pkg.worksheet ||
    !Array.isArray(pkg.worksheet.questions) ||
    pkg.worksheet.questions.length < 3
  ) {
    notes.push("کاربرگ سؤال‌های کافی ندارد.");
  }

  if (!pkg.assessment) {
    notes.push("بخش ارزشیابی وجود ندارد.");
  }

  if (!pkg.differentiation) {
    notes.push("آموزش افتراقی وجود ندارد.");
  }

  return {
    ok: notes.length === 0,
    notes
  };
}

/*
|--------------------------------------------------------------------------
| Health
|--------------------------------------------------------------------------
*/

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "Hamyar Moalem",
    version: "2.2.0",
    aiConfigured: Boolean(client),
    model: MODEL,
    environment: process.env.NODE_ENV || "production",
    timestamp: new Date().toISOString()
  });
});

/*
|--------------------------------------------------------------------------
| Generate Educational Package
|--------------------------------------------------------------------------
*/

app.post("/api/generate", async (req, res) => {
  const requestId =
    "hm_" +
    Date.now() +
    "_" +
    Math.random().toString(36).slice(2, 8);

  try {
    console.log(`[GENERATE_START] ${requestId}`);

    if (!client) {
      console.error(`[OPENAI_ERROR] ${requestId} API key missing`);

      return res.status(500).json({
        ok: false,
        requestId,
        error: "OPENAI_API_KEY در Render تنظیم نشده است."
      });
    }

    const config = normalizeConfig(req.body);

    console.log(`[GENERATE_CONFIG] ${requestId}`, {
      grade: config.grade,
      subject: config.subject,
      lesson: config.lesson,
      model: MODEL
    });

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

    console.log(`[OPENAI_SUCCESS] ${requestId}`);

    const rawOutput = response.output_text;

    if (!rawOutput) {
      console.error(
        `[PARSE_ERROR] ${requestId} OpenAI returned empty output`
      );

      return res.status(502).json({
        ok: false,
        requestId,
        error: "هوش مصنوعی خروجی خالی برگرداند."
      });
    }

    let packageData;

    try {
      packageData = JSON.parse(rawOutput);
    } catch (parseError) {
      console.error(`[JSON_PARSE_ERROR] ${requestId}`, {
        message: parseError.message,
        preview: rawOutput.slice(0, 500)
      });

      return res.status(502).json({
        ok: false,
        requestId,
        error: "خروجی هوش مصنوعی JSON معتبر نبود."
      });
    }

    const quality = runLocalQualityCheck(packageData);

    console.log(`[QUALITY_CHECK] ${requestId}`, quality);

    return res.json({
      ok: true,
      requestId,
      package: packageData,
      quality
    });
  } catch (error) {
    console.error(`[OPENAI_ERROR]`, {
      requestId,

      name: error?.name,

      status: error?.status,

      code: error?.code,

      type: error?.type,

      message: error?.message,

      param: error?.param,

      request_id:
        error?.request_id ||
        error?.headers?.["x-request-id"] ||
        null
    });

    /*
    |--------------------------------------------------------------------------
    | Authentication
    |--------------------------------------------------------------------------
    */

    if (error?.status === 401) {
      return res.status(401).json({
        ok: false,
        requestId,
        error:
          "کلید OpenAI معتبر نیست یا احراز هویت OpenAI با مشکل مواجه شده است."
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Permission / Model
    |--------------------------------------------------------------------------
    */

    if (
      error?.status === 403 ||
      error?.code === "model_not_found"
    ) {
      return res.status(403).json({
        ok: false,
        requestId,
        error:
          "دسترسی به مدل انتخاب‌شده وجود ندارد. مدل و پروژه OpenAI را بررسی کنید.",
        model: MODEL
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Rate Limit / Quota
    |--------------------------------------------------------------------------
    */

    if (error?.status === 429) {
      const code = error?.code || "";

      if (
        code === "insufficient_quota" ||
        String(error?.message || "")
          .toLowerCase()
          .includes("quota")
      ) {
        return res.status(429).json({
          ok: false,
          requestId,
          error:
            "سهمیه یا اعتبار API تمام شده یا محدودیت مصرف پروژه فعال است."
        });
      }

      return res.status(429).json({
        ok: false,
        requestId,
        error:
          "تعداد درخواست‌های API زیاد است. چند لحظه صبر کنید و دوباره امتحان کنید."
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Generic Error
    |--------------------------------------------------------------------------
    */

    return res.status(500).json({
      ok: false,
      requestId,
      error:
        "ارتباط با هوش مصنوعی برقرار نشد.",
      details:
        process.env.NODE_ENV === "production"
          ? undefined
          : error?.message
    });
  }
});

/*
|--------------------------------------------------------------------------
| 404 API
|--------------------------------------------------------------------------
*/

app.use("/api", (req, res) => {
  res.status(404).json({
    ok: false,
    error: "API endpoint پیدا نشد."
  });
});

/*
|--------------------------------------------------------------------------
| Frontend
|--------------------------------------------------------------------------
*/

app.use(express.static("public"));

/*
|--------------------------------------------------------------------------
| SPA Fallback
|--------------------------------------------------------------------------
*/

app.get("*", (req, res) => {
  res.sendFile("index.html", {
    root: "public"
  });
});

/*
|--------------------------------------------------------------------------
| Error Handler
|--------------------------------------------------------------------------
*/

app.use((error, req, res, next) => {
  console.error("[SERVER_ERROR]", error);

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json({
    ok: false,
    error: "خطای داخلی سرور."
  });
});

/*
|--------------------------------------------------------------------------
| Start
|--------------------------------------------------------------------------
*/

app.listen(PORT, () => {
  console.log("======================================");
  console.log("🚀 Hamyar Moalem Server");
  console.log("======================================");
  console.log(`Port: ${PORT}`);
  console.log(`Model: ${MODEL}`);
  console.log(`AI configured: ${Boolean(client)}`);
  console.log(`Version: 2.2.0`);
  console.log("======================================");
});
