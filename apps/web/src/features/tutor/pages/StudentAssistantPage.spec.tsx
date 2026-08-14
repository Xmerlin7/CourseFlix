import { Route, Routes } from "react-router";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { env } from "../../../shared/lib/env";
import { server } from "../../../testing/mocks/server";
import { renderWithProviders } from "../../../testing/renderWithProviders";
import { StudentAssistantPage } from "./StudentAssistantPage";

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route
        path="/student/courses/:courseId/assistant"
        element={<StudentAssistantPage />}
      />
    </Routes>,
    { initialEntries: ["/student/courses/course-1/assistant"] },
  );
}

async function waitForQuestionInput() {
  const input = await screen.findByLabelText("سؤالك");
  await waitFor(() => {
    expect(input).not.toBeDisabled();
  });
  return input;
}

describe("StudentAssistantPage", () => {
  it("renders existing course Tutor history before a new question is sent", async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/courses/:courseId/tutor/messages`, () =>
        HttpResponse.json([
          {
            id: "history-user-1",
            role: "student",
            text: "ما معنى القصور الذاتي؟",
            createdAt: "2026-08-04T10:00:00.000Z",
          },
          {
            id: "history-assistant-1",
            role: "assistant",
            text: "حسب المادة المرفوعة: القصور الذاتي مقاومة الجسم لتغيير حالته.",
            createdAt: "2026-08-04T10:00:01.000Z",
          },
        ]),
      ),
    );

    renderPage();

    expect(
      await screen.findByText("ما معنى القصور الذاتي؟"),
    ).toBeInTheDocument();
    expect(screen.getByText(/مقاومة الجسم لتغيير حالته/)).toBeInTheDocument();
  });

  it("sends a message and renders citations for an answered response", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(await waitForQuestionInput(), "اشرح قانون نيوتن الثالث");
    await user.click(screen.getByRole("button", { name: /إرسال السؤال/ }));

    expect(await screen.findByText(/حسب المادة المرفوعة/)).toBeInTheDocument();
    expect(screen.getByText("physics.pdf")).toBeInTheDocument();
    expect(screen.getByText(/صفحة 2/)).toBeInTheDocument();
  });

  it("shows a CourseFlex AI thinking message until the response arrives", async () => {
    let releaseResponse = () => {};
    const responseGate = new Promise<void>((resolve) => {
      releaseResponse = resolve;
    });

    server.use(
      http.post(`${env.apiBaseUrl}/courses/:courseId/tutor/messages`, async () => {
        await responseGate;
        return HttpResponse.json({
          messageId: "delayed-answer-1",
          status: "answered",
          answer: "وصل الرد بعد انتهاء التفكير.",
          citations: [],
        });
      }),
    );

    const user = userEvent.setup();
    renderPage();

    await user.type(await waitForQuestionInput(), "اشرح الفكرة");
    await user.click(screen.getByRole("button", { name: /إرسال السؤال/ }));

    expect(
      await screen.findByRole("status", { name: "المساعد الذكي يحضّر الرد" }),
    ).toBeInTheDocument();

    releaseResponse();

    expect(await screen.findByText("وصل الرد بعد انتهاء التفكير.")).toBeInTheDocument();
    expect(
      screen.queryByRole("status", { name: "المساعد الذكي يحضّر الرد" }),
    ).not.toBeInTheDocument();
  });

  it("renders no citations for the no-answer state", async () => {
    server.use(
      http.post(`${env.apiBaseUrl}/courses/:courseId/tutor/messages`, () =>
        HttpResponse.json({
          messageId: "no-answer-1",
          status: "no_answer",
          answer: "المواد المرفوعة لا تغطي هذا السؤال بعد.",
          citations: [],
        }),
      ),
    );

    const user = userEvent.setup();
    renderPage();

    await user.type(await waitForQuestionInput(), "سؤال خارج المحتوى");
    await user.click(screen.getByRole("button", { name: /إرسال السؤال/ }));

    expect(
      await screen.findByText("المواد المرفوعة لا تغطي هذا السؤال بعد."),
    ).toBeInTheDocument();
    expect(screen.getByText("بدون مصادر")).toBeInTheDocument();
    expect(screen.queryByText(/صفحة/)).not.toBeInTheDocument();
  });

  it("shows retry when the API fails", async () => {
    server.use(
      http.post(`${env.apiBaseUrl}/courses/:courseId/tutor/messages`, () =>
        HttpResponse.json({ message: "unavailable" }, { status: 503 }),
      ),
    );

    const user = userEvent.setup();
    renderPage();

    await user.type(await waitForQuestionInput(), "اشرح القانون");
    await user.click(screen.getByRole("button", { name: /إرسال السؤال/ }));

    await waitFor(() => {
      expect(screen.getByText("تعذر إرسال السؤال")).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: /إعادة المحاولة/ }),
    ).toBeInTheDocument();
  });

  it("sends a message when pressing Enter", async () => {
    const user = userEvent.setup();
    renderPage();

    const input = await waitForQuestionInput();
    await user.type(input, "اشرح قانون نيوتن الثالث{Enter}");

    expect(await screen.findByText(/حسب المادة المرفوعة/)).toBeInTheDocument();
  });

  it("inserts a newline when pressing Shift+Enter instead of sending", async () => {
    const user = userEvent.setup();
    renderPage();

    const input = await waitForQuestionInput();
    await user.type(input, "السطر الأول{Shift>}{Enter}{/Shift}السطر الثاني");

    expect(input).toHaveValue("السطر الأول\nالسطر الثاني");
    expect(screen.queryByText("المساعد بيجهز الرد...")).not.toBeInTheDocument();
  });
});
