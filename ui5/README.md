# CourseFlix UI

واجهة منصة CourseFlix — منصة فيزياء لمعلم واحد لطلاب المرحلتين الإعدادية والثانوية.
Material Design 3, RTL Arabic, light/dark themes, fully responsive. Every page is a
standalone HTML file with its CSS/JS inlined — open `index.html` to start.

## Pages

| File | Page |
|---|---|
| `index.html` | تسجيل الدخول (توجيه تلقائي: بريد يحتوي `teacher` → لوحة المعلم) |
| `dashboard.html` | رئيسية الطالب — الدورات الحالية والواجبات القادمة |
| `courses.html` | دوراتي مع فلترة (إعدادي / ثانوي) |
| `course.html` | تفاصيل الدورة — دروس، ملفات، اختبارات، واجبات، منشورات |
| `lesson.html` | مشغل الدرس + احتساب الحضور من نسبة المشاهدة |
| `quiz.html` | أداء اختبار قصير مع تصحيح فوري |
| `assistant.html` | المساعد الذكي (RAG) مع مصادر الإجابة من ملفات الدورة |
| `progress.html` | تقدم الطالب — إحصاءات ودرجات |
| `notifications.html` | الإشعارات |
| `settings.html` | الإعدادات — المظهر والإشعارات والأمان |
| `teacher-dashboard.html` | لوحة المعلم — اعتماد التصحيح الآلي وتقارير المتابعة |
| `teacher-course.html` | إدارة الدورة — رفع الملفات وحالة معالجة RAG |
| `teacher-students.html` | الطلاب — الإيقاف/التفعيل وتقارير المساعد |
| `teacher-quizzes.html` | الاختبارات — إنشاء يدوي أو توليد بالذكاء الاصطناعي |

## Regenerating

The HTML files are generated from `build.py` + `pages_student.py` + `pages_teacher.py`
(shared CSS/JS lives in `build.py` and is inlined into every page):

```
python3 build.py
```

Fonts/icons load from Google Fonts (Rubik, Anton, Material Symbols Rounded) — the
only external dependency.
