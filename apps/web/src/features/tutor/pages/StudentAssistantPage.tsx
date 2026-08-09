import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router";
import { EmptyState } from "../../../shared/components/EmptyState";
import { ErrorState } from "../../../shared/components/ErrorState";
import { NotFoundState } from "../../../shared/components/NotFoundState";
import { handleChatInputKeyDown } from "../../../shared/utils/chatInput";
import { CitationList } from "../components/CitationList";
import { useTutorChat } from "../hooks/useTutorChat";

export function StudentAssistantPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { messages, isLoadingHistory, isSending, error, send, retryLast } =
    useTutorChat(courseId ?? "");
  const [draft, setDraft] = useState("");

  if (!courseId) {
    return <NotFoundState />;
  }

  async function handleSubmit(event?: FormEvent<HTMLFormElement>) {
    if (event) event.preventDefault();
    const message = draft.trim();
    if (!message || isSending || isLoadingHistory) return;
    setDraft("");
    await send(message);
  }

  return (
    <>
      <div className="section-head">
        <div>
          <h1 className="page-title">مساعد الدورة</h1>
          <p className="subtitle" style={{ marginBottom: 0 }}>
            اسأل عن المادة المرفوعة لهذه الدورة فقط
          </p>
        </div>
        <Link to={`/student/courses/${courseId}`} className="btn text">
          <span className="ms">arrow_forward</span>
          الرجوع للدورة
        </Link>
      </div>

      {isLoadingHistory && messages.length === 0 ? (
        <div className="card" role="status">
          <span className="meta">جارٍ تحميل المحادثة...</span>
        </div>
      ) : messages.length === 0 ? (
        <EmptyState
          title="ابدأ بسؤال من محتوى الدورة"
          message="لو المادة المرفوعة لا تغطي السؤال، هيظهر لك رد واضح بدون مصادر وهمية"
        />
      ) : (
        <div className="section" style={{ display: "grid", gap: 14 }}>
          {messages.map((message) => (
            <article
              key={message.id}
              className="card"
              style={{
                maxWidth: message.role === "student" ? 640 : 760,
                marginInlineStart: message.role === "student" ? "auto" : 0,
                background:
                  message.role === "student"
                    ? "var(--primary-container)"
                    : "var(--surface-container-low)",
              }}
            >
              <div
                style={{ display: "flex", gap: 10, alignItems: "flex-start" }}
              >
                <span className="lead">
                  <span className="ms">
                    {message.role === "student" ? "person" : "smart_toy"}
                  </span>
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                    {message.text}
                  </p>
                  {message.status === "no_answer" && (
                    <span className="chip outline" style={{ marginTop: 10 }}>
                      بدون مصادر
                    </span>
                  )}
                  {!message.failed && message.status === "answered" && (
                    <CitationList citations={message.citations ?? []} />
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {isSending && (
        <div className="card" role="status" style={{ marginTop: 14 }}>
          <span className="meta">المساعد بيجهز الرد...</span>
        </div>
      )}

      {error && !isSending && (
        <ErrorState
          title="تعذر إرسال السؤال"
          message="المساعد غير متاح مؤقتًا، جرب إعادة الإرسال"
          onRetry={() => void retryLast()}
        />
      )}

      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="card"
        style={{ gap: 12, marginTop: 18 }}
      >
        <div className="tf">
          <label htmlFor="tutor-message">سؤالك</label>
          <textarea
            id="tutor-message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) =>
              handleChatInputKeyDown(
                event,
                () => void handleSubmit(),
                isSending || isLoadingHistory || draft.trim().length === 0,
              )
            }
            rows={3}
            maxLength={1000}
            placeholder="مثلاً: اشرح قانون نيوتن الثالث من الملفات المرفوعة"
            disabled={isSending || isLoadingHistory}
          />
        </div>
        <button
          className="btn big"
          type="submit"
          disabled={isSending || isLoadingHistory || draft.trim().length === 0}
        >
          <span className="ms">send</span>
          {isSending ? "جارٍ الإرسال..." : "إرسال السؤال"}
        </button>
      </form>
    </>
  );
}
