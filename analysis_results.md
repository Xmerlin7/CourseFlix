# 🔍 تحليل مشاكل الـ AI في CourseFlix

## ملخص التجربة

شغلت الـ Application كاملة (API + Web + Infrastructure) وسجلت دخول كـ student وجربت الـ AI features:

### 1️⃣ فيتشر "اسأل عن هذا الفيديو" (Video Q&A) ← ❌ **مش شغال خالص**

![المساعد غير متاح](file:///C:/Users/user/.gemini/antigravity-ide/brain/1bbf9046-17ab-4235-90a6-2da369e6f456/assistant_not_available_coulomb_1786188828241.png)

### 2️⃣ فيتشر "مساعد الدورة" (Tutor/سيف) ← ⚠️ **بيرد بس بيقول "المواد المرفوعة لا تغطي هذا السؤال"**

![المواد لا تغطي](file:///C:/Users/user/.gemini/antigravity-ide/brain/1bbf9046-17ab-4235-90a6-2da369e6f456/assistant_response_no_source_1786189042895.png)

---

## المشاكل بالتفصيل

### 🎬 مشكلة 1: Video Q&A — "المساعد الذكي غير متاح لهذا الفيديو"

> [!CAUTION]
> **السبب الجذري**: كل الـ video transcripts في حالة `failed` أو مفيش transcript أصلاً.

| الحالة | عدد الفيديوهات | التفاصيل |
|--------|---------------|----------|
| `failed` (YouTube captions) | 5 فيديوهات | "Video X has no captions available on YouTube" |
| `failed` (Whisper) | 1 فيديو | "Whisper transcription failed with status 403" |
| **مفيش transcript** | كل فيديوهات كورس الكهرومغناطيسية | الفيديوهات عبارة عن MDN sample videos (flower.mp4, stream-of-water.mp4) بدون transcripts |

**تسلسل المشكلة:**
1. الفيديوهات في كورس "الكهرومغناطيسية" هي placeholder videos من MDN (مش YouTube)
2. لما الـ Video Ingestion بتشغل `detectCaptionProvider()` على URLs زي `interactive-examples.mdn.mozilla.net` بترجع `local` (يعني يستخدم Whisper)
3. لكن مفيش transcript row أصلاً لهذه الفيديوهات — يعني الـ `enqueueForVideo()` مش اتنادت عليهم
4. الفيديوهات اللي عندها YouTube URLs فشلت لأن الفيديوهات على YouTube مفيش عليها captions
5. النتيجة: الـ frontend بيعمل `GET /api/v1/student/videos/:videoId/qa-status` → بيرجع `not_available` → بيعرض "المساعد الذكي غير متاح"

**الملفات المعنية:**
- [video-qa.service.ts](file:///e:/iti/CourseFlix/apps/api/src/modules/video-qa/video-qa.service.ts#L104-L113) — بيشيك على transcript status
- [VideoQaPanel.tsx](file:///e:/iti/CourseFlix/apps/web/src/features/video-qa/components/VideoQaPanel.tsx#L15-L19) — بيعرض الرسالة
- [video-ingestion.service.ts](file:///e:/iti/CourseFlix/apps/api/src/modules/video-ingestion/video-ingestion.service.ts) — بيعمل enqueue للفيديوهات

---

### 🤖 مشكلة 2: Tutor (سيف) — "المواد المرفوعة لا تغطي هذا السؤال بعد"

> [!WARNING]
> **السبب**: مزيج من عدة مشاكل في الـ RAG pipeline

**التسلسل:**
1. الطالب بيسأل سؤال → الـ Tutor بيستدعي `retrievalPort.search({ courseId, query })`
2. الـ `RetrievalService` بيعمل embed للسؤال عن طريق **OpenAI real API** (لأن الـ API key موجود في `.env`)
3. بيبعت الـ embedding لـ ChromaDB بفلتر `courseId` + `isActive`
4. ChromaDB بترجع chunks مع distances
5. الـ `AnswerPolicyService` بيفلتر chunks اللي الـ `score > 1.35` (`TUTOR_MAX_DISTANCE`)
6. **لو كل الـ chunks بعيدة semantically (score > 1.35)** → بيرجع `no_answer` ← "المواد المرفوعة لا تغطي هذا السؤال"

**أسباب المشكلة المتداخلة:**

#### 2a. مشكلة في الـ Data — محتوى ضعيف
- كورس "الكهرومغناطيسية" عنده **10 document chunks فقط** من ملف واحد ("الدرس الأول - الفصل الثاني.pdf")
- الكورس التاني "الميكانيكا الكلاسيكية" عنده 35 chunk لكن من مواد تانية
- **السؤال اللي اتسأل** ("what are the topics of this course") بالإنجليزي، والمحتوى كله عربي → الـ semantic distance هتبقى كبيرة

#### 2b. Embedding Mismatch محتمل
- الـ embeddings اللي في ChromaDB ممكن تكون اتعملت بـ model مختلف أو في وقت تاني
- لو الـ chunks اتعمل لها embed بـ `MockEmbeddingProvider` (وقت الـ seed) بس الـ query بيتعمل embed بـ `OpenAIEmbeddingProvider` (real API) → **الـ vectors مش في نفس الـ embedding space** → الـ distances هتبقى كبيرة جداً وكلها > 1.35

> [!IMPORTANT]
> **ده أكبر مشكلة**: لو الـ seed script عمل embed بالـ Mock Provider بعدين الـ runtime بيستخدم Real OpenAI → الـ search مش هيلاقي أي حاجة relevant أبداً.

#### 2c. فيديوهات بدون transcript
حتى لو الـ Tutor شغال على documents، الفيديوهات مش بتتضاف للـ knowledge base بتاعت الـ Tutor (الـ Tutor بيشتغل على documents فقط مش video transcripts)

**الملفات المعنية:**
- [tutor.service.ts](file:///e:/iti/CourseFlix/apps/api/src/modules/tutor/tutor.service.ts#L193-L212) — الـ retrieval و no_answer flow
- [retrieval.service.ts](file:///e:/iti/CourseFlix/apps/api/src/modules/retrieval/retrieval.service.ts#L99-L174) — الـ Chroma search
- [answer-policy.service.ts](file:///e:/iti/CourseFlix/apps/api/src/modules/tutor/prompt/answer-policy.service.ts#L10-L16) — الـ distance filter
- [embedding.adapter.ts](file:///e:/iti/CourseFlix/apps/api/src/modules/retrieval/embedding.adapter.ts) — Mock vs Real embedding

---

## 📊 حالة الداتا في النظام

| Component | الحالة | التفاصيل |
|-----------|--------|----------|
| **Documents** | ✅ موجودة | ~10+ PDFs عربية |
| **Document Chunks** (Postgres) | ✅ 45 chunk | 35 chunk في "الميكانيكا" + 10 في "الكهرومغناطيسية" |
| **ChromaDB Vectors** | ✅ 45 vector | metadata بـ `courseId`, `documentId`, `isActive` |
| **Video Transcripts** | ❌ 6 failed + باقي مفيش | YouTube captions مش متاحة + MDN sample videos |
| **Video Chunks** | ❌ 0 chunks | مفيش ولا chunk لأن الـ transcription فشلت |

---

## 🎯 ملخص الأسباب الجذرية

1. **Video Q&A مش شغال** لأن:
   - الفيديوهات placeholder (MDN samples) مش real content
   - YouTube videos مفيش عليها captions
   - مفيش Whisper transcription ناجح
   - الـ worker مش شغال لمعالجة الفيديوهات

2. **Tutor بيرجع "لا تغطي"** بسبب:
   - **Embedding space mismatch** — الـ chunks اتعمل لها embed بالـ Mock بس الـ queries بالـ Real OpenAI
   - محتوى عربي والسؤال اتسأل بالإنجليزي
   - عدد الـ chunks محدود (10-35 chunk بس)
