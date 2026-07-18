# -*- coding: utf-8 -*-
"""Student-facing pages of CourseFlix."""

# ---------------------------------------------------------------- login
LOGIN_BODY = r"""
<div class="login-wrap">
  <div class="login-card">
    <a class="logo" href="index.html">COURSEFLIX</a>
    <p class="tag">منصة الفيزياء للمرحلتين الإعدادية والثانوية</p>
    <form id="loginForm">
      <div class="tf">
        <label for="email">البريد الإلكتروني</label>
        <input type="email" id="email" placeholder="name@example.com" autocomplete="email" required>
      </div>
      <div class="tf">
        <label for="password">كلمة المرور</label>
        <input type="password" id="password" placeholder="********" autocomplete="current-password" required>
        <span class="hint">يتم توجيهك تلقائيًا حسب نوع الحساب (طالب أو معلم)</span>
      </div>
      <button class="btn big" type="submit" style="width:100%"><span class="ms">login</span>تسجيل الدخول</button>
    </form>
    <div class="or"><span>دخول تجريبي</span></div>
    <div class="demo-row">
      <a class="btn tonal" href="dashboard.html"><span class="ms">school</span>كطالب</a>
      <a class="btn outlined" href="teacher-dashboard.html"><span class="ms">co_present</span>كمعلم</a>
    </div>
  </div>
  <p class="foot">جميع الحقوق محفوظة لمنصة CourseFlix · 2026</p>
</div>
"""

LOGIN_CSS = r"""
body{display:grid;place-items:center;padding:20px}
.login-wrap{width:min(440px,100%);display:flex;flex-direction:column;gap:18px}
.login-card{
  background:var(--surface);border-radius:28px;padding:44px 38px;
  display:flex;flex-direction:column;box-shadow:var(--shadow);
}
.login-card .logo{font-size:34px;text-align:center;margin-bottom:6px}
.login-card .tag{text-align:center;color:var(--on-surface-variant);font-size:14px;margin-bottom:30px}
.or{display:flex;align-items:center;gap:14px;margin:24px 0 16px;color:var(--on-surface-variant);font-size:13px;font-weight:600}
.or::before,.or::after{content:"";flex:1;border-top:1px solid var(--outline-variant)}
.demo-row{display:flex;gap:10px}
.demo-row .btn{flex:1}
.foot{text-align:center;color:var(--on-surface-variant);font-size:12.5px}
"""

LOGIN_JS = r"""
document.getElementById('loginForm').addEventListener('submit',function(e){
  e.preventDefault();
  var em=document.getElementById('email').value.toLowerCase();
  location.href=em.indexOf('teacher')>-1?'teacher-dashboard.html':'dashboard.html';
});
"""

# ---------------------------------------------------------------- dashboard
def course_card(title, grade, pct, href="course.html"):
    return (
        '<div class="card course-card lift">'
        '<div class="row">'
        '<div class="info">'
        '<h3><a href="' + href + '">' + title + "</a></h3>"
        '<span class="meta">' + grade + "</span>"
        '<div class="actions">'
        '<a class="btn" href="lesson.html"><span class="ms fill">play_arrow</span>إكمال</a>'
        '<span class="chip green">نسبة الإنجاز ' + str(pct) + "%</span>"
        "</div></div>"
        '<div class="thumb" aria-hidden="true"><i class="t1"></i><i class="t2"></i><i class="t3"></i></div>'
        "</div>"
        '<div class="progress" role="progressbar" aria-valuenow="' + str(pct) + '" aria-valuemin="0" aria-valuemax="100">'
        '<div class="bar" style="width:' + str(pct) + '%"></div></div>'
        "</div>"
    )


def hw_card(title, course, due, days_chip):
    return (
        '<div class="card lift">'
        "<h3>" + title + "</h3>"
        '<span class="meta">' + course + " · الدرجة العظمى 20</span>"
        '<div class="actions">'
        '<a class="btn" href="course.html#homework"><span class="ms">upload</span>تسليم</a>'
        '<span class="chip pink">' + days_chip + "</span>"
        "</div>"
        '<span class="meta"><span class="ms sm" style="vertical-align:-4px">event</span> آخر موعد: ' + due + "</span>"
        "</div>"
    )


DASH_BODY = (
    '<div class="section">'
    '<div class="section-head"><h2>دوراتي الحالية</h2>'
    '<a class="see-all" href="courses.html">عرض الكل<span class="ms">chevron_left</span></a></div>'
    '<div class="grid-3">'
    + course_card("الميكانيكا الكلاسيكية", "الصف الأول الثانوي · أ. محمد عبدالرحمن", 89)
    + course_card("الكهرومغناطيسية", "الصف الثالث الثانوي · أ. محمد عبدالرحمن", 64)
    + course_card("مقدمة في القياس", "الصف الثالث الإعدادي · أ. محمد عبدالرحمن", 18)
    + "</div></div>"
    '<hr class="divider">'
    '<div class="section">'
    '<div class="section-head"><h2>واجبات وتسليمات قادمة</h2>'
    '<a class="see-all" href="course.html#homework">عرض الكل<span class="ms">chevron_left</span></a></div>'
    '<div class="grid-3">'
    + hw_card("ورقة عمل: قوانين نيوتن للحركة", "دورة الميكانيكا", "الأربعاء 16 يوليو", "تبقى يومان")
    + hw_card("تقرير معملي: قياس العجلة", "دورة الميكانيكا", "الجمعة 18 يوليو", "تبقى 4 أيام")
    + hw_card("مسائل: المجال الكهربي المنتظم", "دورة الكهرومغناطيسية", "الأحد 20 يوليو", "تبقى 6 أيام")
    + "</div></div>"
    '<div class="section">'
    '<div class="section-head"><h2>آخر التنبيهات</h2>'
    '<a class="see-all" href="notifications.html">عرض الكل<span class="ms">chevron_left</span></a></div>'
    '<div class="list">'
    '<a class="list-item" href="quiz.html"><span class="lead"><span class="ms">quiz</span></span>'
    '<div class="body"><div class="t">اختبار قصير جديد جاهز لك</div>'
    '<div class="s">أنشأ المساعد اختبارًا قصيرًا حول «قوانين نيوتن» بناءً على أسئلتك الأخيرة</div></div>'
    '<div class="end">منذ ساعة<span class="unread-dot"></span></div></a>'
    '<a class="list-item" href="course.html#posts"><span class="lead green"><span class="ms">campaign</span></span>'
    '<div class="body"><div class="t">إعلان جديد من أ. محمد</div>'
    '<div class="s">تم رفع مذكرة المراجعة النهائية لدرس الحركة في خط مستقيم</div></div>'
    '<div class="end">منذ 3 ساعات<span class="unread-dot"></span></div></a>'
    "</div></div>"
)

# ---------------------------------------------------------------- courses
COURSES_BODY = (
    '<h1 class="page-title">دوراتي</h1>'
    '<p class="subtitle">كل دورات الفيزياء المسجّل بها — تقدر تكمل من آخر نقطة وقفت عندها</p>'
    '<div class="actions" style="margin-bottom:26px">'
    '<button class="chip clickable selected" data-filter="all">الكل</button>'
    '<button class="chip outline clickable" data-filter="prep">إعدادي</button>'
    '<button class="chip outline clickable" data-filter="sec">ثانوي</button>'
    "</div>"
    '<div class="grid-3" id="courseGrid">'
    '<div data-cat="sec">' + course_card("الميكانيكا الكلاسيكية", "الصف الأول الثانوي · 24 درسًا", 89) + "</div>"
    '<div data-cat="sec">' + course_card("الكهرومغناطيسية", "الصف الثالث الثانوي · 30 درسًا", 64) + "</div>"
    '<div data-cat="prep">' + course_card("مقدمة في القياس", "الصف الثالث الإعدادي · 12 درسًا", 18) + "</div>"
    '<div data-cat="sec">' + course_card("الموجات والصوت", "الصف الثاني الثانوي · 18 درسًا", 42) + "</div>"
    '<div data-cat="prep">' + course_card("الضوء وانعكاسه", "الصف الثاني الإعدادي · 10 دروس", 100) + "</div>"
    '<div data-cat="sec">' + course_card("الفيزياء الحديثة", "الصف الثالث الثانوي · 22 درسًا", 7) + "</div>"
    "</div>"
)

COURSES_JS = r"""
$$('[data-filter]').forEach(function(c){
  c.addEventListener('click',function(){
    $$('[data-filter]').forEach(function(x){x.classList.remove('selected');x.classList.add('outline')});
    c.classList.add('selected');c.classList.remove('outline');
    $$('#courseGrid > div').forEach(function(d){
      d.style.display=(c.dataset.filter==='all'||d.dataset.cat===c.dataset.filter)?'':'none';
    });
  });
});
"""

# ---------------------------------------------------------------- course detail
COURSE_BODY = r"""
<div class="course-hero card" style="background:var(--surface-container-low)">
  <div class="row" style="display:flex;gap:20px;align-items:center;flex-wrap:wrap">
    <div class="thumb" aria-hidden="true"><i class="t1"></i><i class="t2"></i><i class="t3"></i></div>
    <div style="flex:1;min-width:220px">
      <h1 class="page-title" style="margin-bottom:2px">الميكانيكا الكلاسيكية</h1>
      <p class="subtitle" style="margin-bottom:12px">الصف الأول الثانوي · أ. محمد عبدالرحمن · 24 درسًا</p>
      <div class="actions">
        <a class="btn" href="lesson.html"><span class="ms fill">play_arrow</span>إكمال المشاهدة</a>
        <a class="btn tonal" href="assistant.html"><span class="ms">smart_toy</span>اسأل المساعد</a>
        <span class="chip green">نسبة الإنجاز 89%</span>
      </div>
    </div>
  </div>
  <div class="progress" role="progressbar" aria-valuenow="89" aria-valuemin="0" aria-valuemax="100"><div class="bar" style="width:89%"></div></div>
</div>

<div class="tabs" role="tablist" style="margin-top:30px">
  <button class="tab active" data-tab="lessons">الدروس</button>
  <button class="tab" data-tab="files">الملفات</button>
  <button class="tab" data-tab="quizzes">الاختبارات</button>
  <button class="tab" data-tab="homework">الواجبات</button>
  <button class="tab" data-tab="posts">المنشورات</button>
</div>

<section class="tabpane active" id="pane-lessons">
  <div class="list">
    <a class="list-item" href="lesson.html"><span class="lead green"><span class="ms fill">check</span></span>
      <div class="body"><div class="t">1 — مقدمة في الحركة الميكانيكية</div><div class="s">فيديو مسجل · 42 دقيقة</div></div>
      <div class="end"><span class="chip green">تمت المشاهدة</span></div></a>
    <a class="list-item" href="lesson.html"><span class="lead green"><span class="ms fill">check</span></span>
      <div class="body"><div class="t">2 — السرعة والعجلة</div><div class="s">فيديو مسجل · 55 دقيقة</div></div>
      <div class="end"><span class="chip green">تمت المشاهدة</span></div></a>
    <a class="list-item" href="lesson.html"><span class="lead"><span class="ms fill">play_arrow</span></span>
      <div class="body"><div class="t">3 — قوانين نيوتن للحركة</div><div class="s">فيديو مسجل · 61 دقيقة · وصلت إلى 72%</div></div>
      <div class="end"><span class="chip">أكمل المشاهدة</span></div></a>
    <div class="list-item"><span class="lead pink"><span class="ms">sensors</span></span>
      <div class="body"><div class="t">4 — تطبيقات على قوانين نيوتن</div><div class="s">بث مباشر · الخميس 17 يوليو، 7:00 مساءً</div></div>
      <div class="end"><span class="chip pink">مجدول</span></div></div>
    <div class="list-item"><span class="lead"><span class="ms">lock</span></span>
      <div class="body"><div class="t">5 — الاحتكاك وقوى التلامس</div><div class="s">يُفتح بعد إتمام الدرس الرابع</div></div>
      <div class="end"><span class="chip outline">مقفل</span></div></div>
  </div>
</section>

<section class="tabpane" id="pane-files">
  <div class="list">
    <div class="list-item hoverable"><span class="lead red"><span class="ms">picture_as_pdf</span></span>
      <div class="body"><div class="t">مذكرة قوانين نيوتن للحركة</div><div class="s">PDF · 4.2 م.ب · جاهزة لأسئلة المساعد</div></div>
      <div class="end"><span class="chip green"><span class="ms">check_circle</span>تمت المعالجة</span>
      <button class="icon-btn" aria-label="تنزيل"><span class="ms">download</span></button></div></div>
    <div class="list-item hoverable"><span class="lead"><span class="ms">slideshow</span></span>
      <div class="body"><div class="t">عرض تقديمي: السرعة والعجلة</div><div class="s">PPTX · 8.9 م.ب</div></div>
      <div class="end"><span class="chip green"><span class="ms">check_circle</span>تمت المعالجة</span>
      <button class="icon-btn" aria-label="تنزيل"><span class="ms">download</span></button></div></div>
    <div class="list-item hoverable"><span class="lead red"><span class="ms">picture_as_pdf</span></span>
      <div class="body"><div class="t">بنك مسائل الوحدة الأولى</div><div class="s">PDF · 2.1 م.ب</div></div>
      <div class="end"><span class="chip"><span class="ms">progress_activity</span>قيد المعالجة</span>
      <button class="icon-btn" aria-label="تنزيل"><span class="ms">download</span></button></div></div>
  </div>
</section>

<section class="tabpane" id="pane-quizzes">
  <div class="list">
    <div class="list-item"><span class="lead"><span class="ms">quiz</span></span>
      <div class="body"><div class="t">اختبار: الحركة في خط مستقيم</div><div class="s">10 أسئلة · تم التسليم</div></div>
      <div class="end"><span class="chip green">الدرجة 9/10</span></div></div>
    <div class="list-item"><span class="lead"><span class="ms">quiz</span></span>
      <div class="body"><div class="t">اختبار قصير: قوانين نيوتن <span class="chip pink" style="margin-inline-start:6px">مولّد تلقائيًا</span></div>
      <div class="s">5 أسئلة · أنشأه المساعد بعد ملاحظة صعوبة في المفهوم</div></div>
      <div class="end"><a class="btn" href="quiz.html"><span class="ms fill">play_arrow</span>ابدأ</a></div></div>
    <div class="list-item"><span class="lead"><span class="ms">quiz</span></span>
      <div class="body"><div class="t">اختبار: السرعة النسبية</div><div class="s">8 أسئلة · متاح حتى 25 يوليو</div></div>
      <div class="end"><a class="btn tonal" href="quiz.html">ابدأ</a></div></div>
  </div>
</section>

<section class="tabpane" id="pane-homework">
  <div class="grid-2">
    <div class="card">
      <h3>ورقة عمل: قوانين نيوتن للحركة</h3>
      <span class="meta">الدرجة العظمى 20 · حد النجاح 10 · آخر موعد: الأربعاء 16 يوليو</span>
      <div class="actions">
        <button class="btn" data-open-dialog="hwDialog"><span class="ms">upload</span>تسليم</button>
        <span class="chip pink">تبقى يومان</span>
      </div>
    </div>
    <div class="card">
      <h3>تقرير معملي: قياس العجلة</h3>
      <span class="meta">الدرجة العظمى 20 · حد النجاح 10 · آخر موعد: الجمعة 18 يوليو</span>
      <div class="actions">
        <button class="btn" data-open-dialog="hwDialog"><span class="ms">upload</span>تسليم</button>
        <span class="chip pink">تبقى 4 أيام</span>
      </div>
    </div>
    <div class="card">
      <h3>مسائل: قوانين الحركة الدائرية</h3>
      <span class="meta">تم التسليم 6 يوليو · صحّحه المساعد الذكي</span>
      <div class="actions">
        <span class="chip green">الدرجة 17/20</span>
        <button class="btn text" data-open-dialog="fbDialog">عرض الملاحظات</button>
      </div>
    </div>
  </div>
</section>

<section class="tabpane" id="pane-posts">
  <div class="list">
    <div class="list-item" style="align-items:flex-start">
      <span class="avatar" style="width:46px;height:46px"><span class="ms">person</span></span>
      <div class="body">
        <div class="t">أ. محمد عبدالرحمن <span class="s" style="font-weight:400">· منذ 3 ساعات</span></div>
        <p style="margin-top:6px">يا شباب، رفعت لكم مذكرة المراجعة النهائية لدرس الحركة في خط مستقيم. ركزوا على مسائل الرسم البياني — بتيجي كتير في الامتحان.</p>
        <div class="actions" style="margin-top:10px"><span class="chip outline"><span class="ms">attach_file</span>مذكرة المراجعة.pdf</span></div>
      </div>
    </div>
    <div class="list-item" style="align-items:flex-start">
      <span class="avatar" style="width:46px;height:46px"><span class="ms">person</span></span>
      <div class="body">
        <div class="t">أ. محمد عبدالرحمن <span class="s" style="font-weight:400">· أمس</span></div>
        <p style="margin-top:6px">تذكير: البث المباشر «تطبيقات على قوانين نيوتن» الخميس الساعة 7 مساءً. الحضور محسوب في نسبة الحضور.</p>
      </div>
    </div>
  </div>
</section>

<dialog id="hwDialog">
  <h3>تسليم الواجب</h3>
  <p>ارفع ملف إجابتك (PDF أو صورة). سيُصحّح تلقائيًا ويعتمده المعلم.</p>
  <label class="dropzone" for="hwFile">
    <span class="ms">upload_file</span>
    <strong>اسحب الملف هنا أو اضغط للاختيار</strong>
    <span style="font-size:12.5px">بحد أقصى 20 م.ب</span>
    <input type="file" id="hwFile" hidden>
  </label>
  <div class="dialog-actions">
    <button class="btn text" data-close-dialog>إلغاء</button>
    <button class="btn" id="hwSubmit">تأكيد التسليم</button>
  </div>
</dialog>

<dialog id="fbDialog">
  <h3>ملاحظات التصحيح</h3>
  <p>إجابتك عن قانون الجذب المركزي ممتازة. راجع اشتقاق العجلة المركزية في المسألة الرابعة — الوحدات كانت غير متسقة. (صحّحه المساعد الذكي واعتمده المعلم)</p>
  <div class="dialog-actions"><button class="btn" data-close-dialog>حسنًا</button></div>
</dialog>
"""

COURSE_JS = r"""
var hwBtn=document.getElementById('hwSubmit');
if(hwBtn)hwBtn.addEventListener('click',function(){
  hwBtn.closest('dialog').close();
  snack('تم تسليم الواجب بنجاح — سيصلك إشعار بالدرجة');
});
"""

# ---------------------------------------------------------------- lesson
LESSON_BODY = r"""
<div class="lesson-grid">
  <div>
    <div class="player">
      <button class="play-big" id="playBtn" aria-label="تشغيل"><span class="ms fill">play_arrow</span></button>
      <span class="vmeta">3 — قوانين نيوتن للحركة · 61 دقيقة</span>
    </div>
    <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-top:20px">
      <h1 class="page-title" style="margin:0;flex:1;min-width:200px">قوانين نيوتن للحركة</h1>
      <span class="chip green"><span class="ms">how_to_reg</span>حاضر</span>
    </div>
    <p class="subtitle" style="margin-bottom:14px">الميكانيكا الكلاسيكية · الدرس الثالث</p>
    <div class="card" style="gap:10px">
      <div style="display:flex;justify-content:space-between;font-size:13.5px;font-weight:700">
        <span style="color:var(--on-surface-variant)">نسبة المشاهدة (تُحسب في الحضور)</span><span id="watchPct">72%</span>
      </div>
      <div class="progress"><div class="bar" id="watchBar" style="width:72%"></div></div>
      <span class="meta">تُعتبر حاضرًا عند مشاهدة 70% على الأقل من الدرس</span>
    </div>
    <div class="actions" style="margin-top:18px">
      <a class="btn tonal" href="assistant.html"><span class="ms">smart_toy</span>اسأل المساعد عن هذا الدرس</a>
      <a class="btn outlined" href="quiz.html"><span class="ms">quiz</span>اختبر نفسك</a>
    </div>
  </div>
  <aside>
    <h2 style="font-size:17px;margin-bottom:14px">باقي دروس الوحدة</h2>
    <div class="list">
      <a class="list-item" href="lesson.html"><span class="lead green"><span class="ms fill">check</span></span>
        <div class="body"><div class="t">2 — السرعة والعجلة</div><div class="s">55 دقيقة</div></div></a>
      <a class="list-item" href="lesson.html" style="background:var(--secondary-container)"><span class="lead"><span class="ms fill">play_arrow</span></span>
        <div class="body"><div class="t">3 — قوانين نيوتن للحركة</div><div class="s">الحالي · 61 دقيقة</div></div></a>
      <a class="list-item" href="course.html"><span class="lead pink"><span class="ms">sensors</span></span>
        <div class="body"><div class="t">4 — تطبيقات (بث مباشر)</div><div class="s">الخميس 7:00 م</div></div></a>
      <a class="list-item" href="course.html"><span class="lead"><span class="ms">lock</span></span>
        <div class="body"><div class="t">5 — الاحتكاك</div><div class="s">مقفل</div></div></a>
    </div>
  </aside>
</div>
"""

LESSON_CSS = r"""
.lesson-grid{display:grid;grid-template-columns:1fr 320px;gap:34px;align-items:start}
@media (max-width:1080px){.lesson-grid{grid-template-columns:1fr}}
"""

LESSON_JS = r"""
(function(){
  var pct=72,playing=false,timer=null;
  var btn=document.getElementById('playBtn');
  btn.addEventListener('click',function(){
    playing=!playing;
    btn.querySelector('.ms').textContent=playing?'pause':'play_arrow';
    if(playing){
      timer=setInterval(function(){
        if(pct>=100){clearInterval(timer);return}
        pct++;
        document.getElementById('watchBar').style.width=pct+'%';
        document.getElementById('watchPct').textContent=pct+'%';
      },800);
    }else clearInterval(timer);
  });
})();
"""

# ---------------------------------------------------------------- quiz
QUIZ_BODY = r"""
<div style="max-width:760px;margin:0 auto">
  <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:6px">
    <h1 class="page-title" style="margin:0">اختبار قصير: قوانين نيوتن</h1>
    <span class="chip pink">مولّد تلقائيًا</span>
  </div>
  <p class="subtitle">الميكانيكا الكلاسيكية · 4 أسئلة · أنشأه المساعد من مذكرة الدرس الثالث</p>

  <form id="quizForm">
    <div class="qcard">
      <div class="qnum">السؤال 1 من 4 · اختيار من متعدد</div>
      <div class="qtext">جسم ساكن على سطح أفقي أملس، أثّرت عليه قوة محصلتها صفر. ماذا يحدث للجسم؟</div>
      <label class="opt"><input type="radio" name="q1" value="a">يتحرك بعجلة منتظمة</label>
      <label class="opt"><input type="radio" name="q1" value="b">يبقى ساكنًا</label>
      <label class="opt"><input type="radio" name="q1" value="c">يتحرك بسرعة متزايدة</label>
      <label class="opt"><input type="radio" name="q1" value="d">يتحرك ثم يتوقف</label>
    </div>
    <div class="qcard">
      <div class="qnum">السؤال 2 من 4 · اختيار من متعدد</div>
      <div class="qtext">قوة مقدارها 10 نيوتن تؤثر على جسم كتلته 2 كجم. ما مقدار العجلة الناتجة؟</div>
      <label class="opt"><input type="radio" name="q2" value="a">20 م/ث²</label>
      <label class="opt"><input type="radio" name="q2" value="b">0.2 م/ث²</label>
      <label class="opt"><input type="radio" name="q2" value="c">5 م/ث²</label>
      <label class="opt"><input type="radio" name="q2" value="d">12 م/ث²</label>
    </div>
    <div class="qcard">
      <div class="qnum">السؤال 3 من 4 · صح أم خطأ</div>
      <div class="qtext">قوتا الفعل ورد الفعل تؤثران على نفس الجسم، لذلك تلغي إحداهما الأخرى.</div>
      <label class="opt"><input type="radio" name="q3" value="a">صح</label>
      <label class="opt"><input type="radio" name="q3" value="b">خطأ</label>
    </div>
    <div class="qcard">
      <div class="qnum">السؤال 4 من 4 · إجابة قصيرة</div>
      <div class="qtext">اذكر نص قانون نيوتن الأول للحركة.</div>
      <div class="tf" style="margin:0"><textarea name="q4" placeholder="اكتب إجابتك هنا…"></textarea>
      <span class="hint">تُصحّح الإجابات القصيرة بالمساعد الذكي ويعتمدها المعلم</span></div>
    </div>
    <div class="actions" style="justify-content:flex-end;display:flex">
      <a class="btn text" href="course.html#quizzes">إلغاء</a>
      <button class="btn big" type="submit"><span class="ms">check</span>تسليم الإجابات</button>
    </div>
  </form>
</div>

<dialog id="resultDialog">
  <h3 id="resultTitle">نتيجتك</h3>
  <p id="resultText"></p>
  <div class="dialog-actions">
    <a class="btn text" href="progress.html">عرض تقدمي</a>
    <a class="btn" href="course.html#quizzes">العودة للدورة</a>
  </div>
</dialog>
"""

QUIZ_JS = r"""
document.getElementById('quizForm').addEventListener('submit',function(e){
  e.preventDefault();
  var key={q1:'b',q2:'c',q3:'b'},score=0,total=3;
  Object.keys(key).forEach(function(q){
    var sel=document.querySelector('input[name="'+q+'"]:checked');
    if(sel&&sel.value===key[q])score++;
  });
  var short=document.querySelector('textarea[name="q4"]').value.trim();
  document.getElementById('resultTitle').textContent='نتيجتك: '+score+' من '+total;
  document.getElementById('resultText').textContent=
    (short?'تم إرسال إجابتك القصيرة للتصحيح بالمساعد الذكي. ':'لم تُجب عن السؤال الرابع. ')+
    (score===total?'ممتاز! المفهوم واضح عندك تمامًا.':'راجع درس قوانين نيوتن — المساعد جاهز يشرح لك أي جزئية.');
  document.getElementById('resultDialog').showModal();
});
"""

# ---------------------------------------------------------------- assistant
ASSISTANT_BODY = r"""
<div class="chat-wrap" style="margin-top:-6px">
  <div class="chat-main">
    <div class="chat-head">
      <span class="avatar"><span class="ms">smart_toy</span></span>
      <span class="t">مساعد الفيزياء — دورة الميكانيكا</span>
      <button class="icon-btn" aria-label="إرفاق"><span class="ms">attach_file</span></button>
      <button class="icon-btn" aria-label="خيارات"><span class="ms">more_vert</span></button>
    </div>
    <div class="chat-scroll" id="chatScroll">
      <div class="msg ai">أهلاً عبدالله! أنا مساعدك في دورة الميكانيكا الكلاسيكية. إجاباتي كلها من مذكرات ومحاضرات أ. محمد فقط. اسألني عن أي جزء مش واضح.</div>
      <div class="msg sent">مش فاهم الفرق بين كتلة الجسم ووزنه</div>
      <div class="msg ai">سؤال ممتاز! الكتلة هي مقدار ما يحتويه الجسم من مادة وتُقاس بالكيلوجرام، وهي ثابتة في أي مكان. أما الوزن فهو قوة جذب الأرض للجسم ويساوي الكتلة مضروبة في عجلة الجاذبية (و = ك × جـ)، لذلك يتغير من مكان لآخر. مثال: كتلتك على القمر هي نفسها، لكن وزنك يقل لأن جاذبية القمر أضعف.
        <div class="src"><span>المصدر: مذكرة قوانين نيوتن — ص 4</span><span>محاضرة 3 — الدقيقة 12</span></div>
      </div>
    </div>
    <div class="chat-suggest">
      <button class="chip outline clickable" data-suggest="لخص لي الدرس الثالث في نقاط">لخص الدرس الثالث</button>
      <button class="chip outline clickable" data-suggest="اعمل لي اختبار قصير على قوانين نيوتن">اختبار قصير</button>
      <button class="chip outline clickable" data-suggest="اشرح لي قانون نيوتن الثاني بمثال من الحياة">اشرح بمثال</button>
    </div>
    <div class="chat-inputbar">
      <button class="icon-btn" aria-label="إضافة"><span class="ms">add_circle</span></button>
      <button class="icon-btn" aria-label="رموز"><span class="ms">mood</span></button>
      <div class="chat-field">
        <input type="text" id="chatInput" placeholder="اكتب سؤالك عن الدورة…" aria-label="رسالتك">
        <button class="send-btn" id="sendBtn" aria-label="إرسال"><span class="ms fill">send</span></button>
      </div>
    </div>
  </div>
  <div class="convo-list">
    <h2>المحادثات</h2>
    <a class="convo active" href="#"><span class="avatar"><span class="ms">smart_toy</span></span>
      <div class="body"><div class="t">دورة الميكانيكا</div><div class="s">الكتلة هي مقدار ما يحتويه الجسم من مادة…</div></div>
      <span class="time">الآن</span></a>
    <a class="convo" href="#"><span class="avatar"><span class="ms">smart_toy</span></span>
      <div class="body"><div class="t">دورة الكهرومغناطيسية</div><div class="s">شرح قانون كولوم مع مثال محلول خطوة بخطوة</div></div>
      <span class="time">أمس</span></a>
    <a class="convo" href="#"><span class="avatar"><span class="ms">smart_toy</span></span>
      <div class="body"><div class="t">مقدمة في القياس</div><div class="s">جدول وحدات النظام الدولي والتحويل بينها</div></div>
      <span class="time">3 أيام</span></a>
    <a class="convo" href="#"><span class="avatar"><span class="ms">smart_toy</span></span>
      <div class="body"><div class="t">الموجات والصوت</div><div class="s">ليه سرعة الصوت بتزيد في الأوساط الأكثف؟</div></div>
      <span class="time">أسبوع</span></a>
  </div>
</div>
"""

ASSISTANT_CSS = r"""
.page{display:flex;flex-direction:column}
.sheet{max-height:calc(100vh - 28px)}
@media (max-width:860px){.sheet{max-height:none}.chat-scroll{min-height:340px;max-height:52vh}}
"""

ASSISTANT_JS = r"""
(function(){
  var scroll=document.getElementById('chatScroll'),
      input=document.getElementById('chatInput'),
      REPLIES=[
        'تمام! دي النقاط الأساسية من مذكرة الدرس: القانون الأول (القصور الذاتي)، الثاني (ق = ك × جـ)، والثالث (الفعل ورد الفعل). كل قانون له مثال محلول في صفحة 6.',
        'حاضر، جهزت لك اختبارًا قصيرًا من 4 أسئلة على هذا المفهوم — هتلاقيه في تبويب الاختبارات داخل الدورة.',
        'خد مثال بسيط: لما بتزق عربة تسوق فاضية بتتحرك بسهولة، لكن لو مليانة محتاج قوة أكبر لنفس العجلة — دي فكرة ق = ك × جـ بالظبط.'
      ],ri=0;
  function bubble(cls,html){
    var d=document.createElement('div');d.className='msg '+cls;d.innerHTML=html;
    scroll.appendChild(d);scroll.scrollTop=scroll.scrollHeight;return d;
  }
  function send(text){
    if(!text.trim())return;
    bubble('sent',text.replace(/</g,'&lt;'));
    input.value='';
    var t=bubble('ai','<span class="typing"><i></i><i></i><i></i></span>');
    setTimeout(function(){
      t.innerHTML=REPLIES[ri%REPLIES.length]+
        '<div class="src"><span>المصدر: مذكرة قوانين نيوتن — ص 6</span></div>';
      ri++;scroll.scrollTop=scroll.scrollHeight;
    },1100);
  }
  document.getElementById('sendBtn').addEventListener('click',function(){send(input.value)});
  input.addEventListener('keydown',function(e){if(e.key==='Enter')send(input.value)});
  $$('[data-suggest]').forEach(function(c){c.addEventListener('click',function(){send(c.dataset.suggest)})});
})();
"""

# ---------------------------------------------------------------- progress
PROGRESS_BODY = r"""
<h1 class="page-title">تقدمي</h1>
<p class="subtitle">ملخص أدائك في كل الدورات — يتحدّث تلقائيًا مع كل درس واختبار وواجب</p>

<div class="tiles section">
  <div class="tile"><span class="lead-ic"><span class="ms">school</span></span>
    <span class="lbl">متوسط الإنجاز</span><span class="num">53%</span><span class="sub">عبر 6 دورات نشطة</span></div>
  <div class="tile"><span class="lead-ic"><span class="ms">how_to_reg</span></span>
    <span class="lbl">نسبة الحضور</span><span class="num">91%</span><span class="sub">محسوبة من مشاهدة الدروس والبث</span></div>
  <div class="tile"><span class="lead-ic"><span class="ms">quiz</span></span>
    <span class="lbl">متوسط الاختبارات</span><span class="num">84%</span><span class="sub">آخر اختبار: 9/10</span></div>
  <div class="tile"><span class="lead-ic"><span class="ms">assignment_turned_in</span></span>
    <span class="lbl">واجبات مسلّمة</span><span class="num">11/13</span><span class="sub">واجبان متبقيان هذا الأسبوع</span></div>
</div>

<div class="section">
  <div class="section-head"><h2>الإنجاز في كل دورة</h2></div>
  <div class="card">
    <div class="barlist" role="img" aria-label="نسب إنجاز الدورات">
      <div class="brow"><span class="blabel">الضوء وانعكاسه</span><div class="btrack"><div class="bfill" style="width:100%"></div></div><span class="bval">100%</span></div>
      <div class="brow"><span class="blabel">الميكانيكا الكلاسيكية</span><div class="btrack"><div class="bfill" style="width:89%"></div></div><span class="bval">89%</span></div>
      <div class="brow"><span class="blabel">الكهرومغناطيسية</span><div class="btrack"><div class="bfill" style="width:64%"></div></div><span class="bval">64%</span></div>
      <div class="brow"><span class="blabel">الموجات والصوت</span><div class="btrack"><div class="bfill" style="width:42%"></div></div><span class="bval">42%</span></div>
      <div class="brow"><span class="blabel">مقدمة في القياس</span><div class="btrack"><div class="bfill" style="width:18%"></div></div><span class="bval">18%</span></div>
      <div class="brow"><span class="blabel">الفيزياء الحديثة</span><div class="btrack"><div class="bfill" style="width:7%"></div></div><span class="bval">7%</span></div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-head"><h2>آخر درجات الاختبارات</h2></div>
  <div class="card">
    <div class="barlist" role="img" aria-label="درجات آخر الاختبارات">
      <div class="brow"><span class="blabel">الحركة في خط مستقيم</span><div class="btrack"><div class="bfill" style="width:90%"></div></div><span class="bval">9/10</span></div>
      <div class="brow"><span class="blabel">وحدات القياس</span><div class="btrack"><div class="bfill" style="width:80%"></div></div><span class="bval">8/10</span></div>
      <div class="brow"><span class="blabel">قانون كولوم</span><div class="btrack"><div class="bfill" style="width:70%"></div></div><span class="bval">7/10</span></div>
      <div class="brow"><span class="blabel">خصائص الموجات</span><div class="btrack"><div class="bfill" style="width:95%"></div></div><span class="bval">9.5/10</span></div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-head"><h2>ملاحظات المساعد</h2></div>
  <div class="list">
    <div class="list-item"><span class="lead pink"><span class="ms">flag</span></span>
      <div class="body"><div class="t">مفهوم يحتاج تركيز: قانون نيوتن الثالث</div>
      <div class="s">لاحظ المساعد تكرار الأسئلة حوله، فأنشأ لك اختبارًا قصيرًا وأبلغ المعلم</div></div>
      <div class="end"><a class="btn tonal" href="quiz.html">ابدأ الاختبار</a></div></div>
    <div class="list-item"><span class="lead green"><span class="ms">thumb_up</span></span>
      <div class="body"><div class="t">نقطة قوة: الرسم البياني للحركة</div>
      <div class="s">إجاباتك في مسائل الرسم البياني ممتازة وثابتة عبر آخر 3 اختبارات</div></div></div>
  </div>
</div>
"""

# ---------------------------------------------------------------- notifications
NOTIFICATIONS_BODY = r"""
<div class="section-head">
  <h1 class="page-title" style="margin:0">الإشعارات</h1>
  <button class="btn text" id="markAll"><span class="ms">done_all</span>تحديد الكل كمقروء</button>
</div>
<div class="actions" style="margin:14px 0 24px">
  <button class="chip clickable selected" data-nf="all">الكل</button>
  <button class="chip outline clickable" data-nf="unread">غير مقروء</button>
</div>
<div class="list" id="notifList">
  <div class="list-item hoverable" data-unread="1"><span class="lead"><span class="ms">quiz</span></span>
    <div class="body"><div class="t">اختبار قصير جاهز لك</div>
    <div class="s">أنشأ المساعد اختبارًا حول «قوانين نيوتن» بعد ملاحظة أسئلتك المتكررة</div></div>
    <div class="end">منذ ساعة<span class="unread-dot"></span></div></div>
  <div class="list-item hoverable" data-unread="1"><span class="lead pink"><span class="ms">assignment</span></span>
    <div class="body"><div class="t">واجب جديد: ورقة عمل قوانين نيوتن</div>
    <div class="s">آخر موعد للتسليم الأربعاء 16 يوليو — الدرجة العظمى 20</div></div>
    <div class="end">منذ 5 ساعات<span class="unread-dot"></span></div></div>
  <div class="list-item hoverable" data-unread="1"><span class="lead green"><span class="ms">campaign</span></span>
    <div class="body"><div class="t">إعلان من أ. محمد</div>
    <div class="s">مذكرة المراجعة النهائية لدرس الحركة متاحة الآن في ملفات الدورة</div></div>
    <div class="end">منذ 8 ساعات<span class="unread-dot"></span></div></div>
  <div class="list-item hoverable" data-unread="1"><span class="lead"><span class="ms">grading</span></span>
    <div class="body"><div class="t">تم تصحيح واجبك</div>
    <div class="s">مسائل الحركة الدائرية: 17/20 — صححه المساعد واعتمده المعلم</div></div>
    <div class="end">أمس<span class="unread-dot"></span></div></div>
  <div class="list-item hoverable" data-unread="0"><span class="lead"><span class="ms">sensors</span></span>
    <div class="body"><div class="t">بث مباشر مجدول</div>
    <div class="s">«تطبيقات على قوانين نيوتن» — الخميس 17 يوليو الساعة 7 مساءً</div></div>
    <div class="end">أمس</div></div>
  <div class="list-item hoverable" data-unread="0"><span class="lead"><span class="ms">monitoring</span></span>
    <div class="body"><div class="t">تقرير تقدم أسبوعي</div>
    <div class="s">نسبة حضورك هذا الأسبوع 95% — استمر!</div></div>
    <div class="end">منذ 3 أيام</div></div>
</div>
"""

NOTIFICATIONS_JS = r"""
(function(){
  function apply(f){
    $$('#notifList .list-item').forEach(function(it){
      it.style.display=(f==='all'||it.dataset.unread==='1')?'':'none';
    });
  }
  $$('[data-nf]').forEach(function(c){
    c.addEventListener('click',function(){
      $$('[data-nf]').forEach(function(x){x.classList.remove('selected');x.classList.add('outline')});
      c.classList.add('selected');c.classList.remove('outline');apply(c.dataset.nf);
    });
  });
  document.getElementById('markAll').addEventListener('click',function(){
    $$('#notifList .list-item').forEach(function(it){
      it.dataset.unread='0';var d=it.querySelector('.unread-dot');if(d)d.remove();
    });
    var b=document.querySelector('.topbar .badge');if(b)b.remove();
    snack('تم تحديد كل الإشعارات كمقروءة');
  });
})();
"""

# ---------------------------------------------------------------- settings
SETTINGS_BODY = r"""
<h1 class="page-title">الإعدادات</h1>
<p class="subtitle">إدارة حسابك وتفضيلات العرض والإشعارات</p>

<div class="grid-2" style="align-items:start">
  <div class="card" id="profile">
    <h3><span class="ms sm" style="vertical-align:-3px">person</span> الملف الشخصي</h3>
    <div style="display:flex;align-items:center;gap:14px">
      <span class="avatar" style="width:56px;height:56px"><span class="ms" style="font-size:28px">person</span></span>
      <div><div style="font-weight:700">عبدالله حبسه</div>
      <div class="meta">aboda179@outlook.com · طالب — الصف الأول الثانوي</div></div>
    </div>
    <div class="tf"><label for="fullName">الاسم الكامل</label><input id="fullName" value="عبدالله حبسه"></div>
    <div class="tf"><label for="phone">رقم الهاتف</label><input id="phone" value="0100 123 4567" dir="ltr" style="text-align:end"></div>
    <button class="btn" id="saveProfile" style="align-self:flex-start"><span class="ms">save</span>حفظ التغييرات</button>
  </div>

  <div style="display:flex;flex-direction:column;gap:22px">
    <div class="card">
      <h3><span class="ms sm" style="vertical-align:-3px">palette</span> المظهر</h3>
      <div class="segmented" data-role="theme">
        <button data-value="light"><span class="ms">light_mode</span>فاتح</button>
        <button data-value="dark"><span class="ms">dark_mode</span>داكن</button>
      </div>
      <span class="meta">يُحفظ اختيارك على هذا الجهاز</span>
    </div>
    <div class="card">
      <h3><span class="ms sm" style="vertical-align:-3px">notifications</span> الإشعارات</h3>
      <div class="setting-row"><div><div style="font-weight:700">إشعارات البريد الإلكتروني</div>
        <div class="meta">الواجبات الجديدة وتقارير التقدم</div></div>
        <label class="switch"><input type="checkbox" checked><span class="track"></span></label></div>
      <div class="setting-row"><div><div style="font-weight:700">تنبيهات البث المباشر</div>
        <div class="meta">تذكير قبل بدء البث بربع ساعة</div></div>
        <label class="switch"><input type="checkbox" checked><span class="track"></span></label></div>
      <div class="setting-row"><div><div style="font-weight:700">ملخص أسبوعي</div>
        <div class="meta">تقرير تقدمك كل يوم جمعة</div></div>
        <label class="switch"><input type="checkbox"><span class="track"></span></label></div>
    </div>
    <div class="card">
      <h3><span class="ms sm" style="vertical-align:-3px">lock</span> الأمان</h3>
      <div class="tf"><label for="oldPass">كلمة المرور الحالية</label><input type="password" id="oldPass"></div>
      <div class="tf"><label for="newPass">كلمة المرور الجديدة</label><input type="password" id="newPass"></div>
      <button class="btn tonal" id="changePass" style="align-self:flex-start">تغيير كلمة المرور</button>
    </div>
  </div>
</div>
"""

SETTINGS_CSS = r"""
.setting-row{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:6px 0}
"""

SETTINGS_JS = r"""
$$('.segmented[data-role="theme"] button').forEach(function(b){
  b.addEventListener('click',function(){setTheme(b.dataset.value)});
  b.classList.toggle('selected',b.dataset.value===document.documentElement.dataset.theme);
});
document.getElementById('saveProfile').addEventListener('click',function(){snack('تم حفظ بيانات الملف الشخصي')});
document.getElementById('changePass').addEventListener('click',function(){snack('تم تغيير كلمة المرور بنجاح')});
"""

PAGES = [
    dict(file="index.html", title="تسجيل الدخول", role="bare", body=LOGIN_BODY, css=LOGIN_CSS, js=LOGIN_JS),
    dict(file="dashboard.html", title="الرئيسية", role="student", active="dashboard.html", body=DASH_BODY, fab=True),
    dict(file="courses.html", title="دوراتي", role="student", active="courses.html", body=COURSES_BODY, js=COURSES_JS, fab=True),
    dict(file="course.html", title="الميكانيكا الكلاسيكية", role="student", active="courses.html", body=COURSE_BODY, js=COURSE_JS, fab=True),
    dict(file="lesson.html", title="قوانين نيوتن للحركة", role="student", active="courses.html", body=LESSON_BODY, css=LESSON_CSS, js=LESSON_JS),
    dict(file="quiz.html", title="اختبار قصير", role="student", active="courses.html", body=QUIZ_BODY, js=QUIZ_JS),
    dict(file="assistant.html", title="المساعد الذكي", role="student", active="assistant.html", body=ASSISTANT_BODY, css=ASSISTANT_CSS, js=ASSISTANT_JS),
    dict(file="progress.html", title="التقدم", role="student", active="progress.html", body=PROGRESS_BODY),
    dict(file="notifications.html", title="الإشعارات", role="student", active="", body=NOTIFICATIONS_BODY, js=NOTIFICATIONS_JS),
    dict(file="settings.html", title="الإعدادات", role="student", active="", body=SETTINGS_BODY, css=SETTINGS_CSS, js=SETTINGS_JS),
]
