# -*- coding: utf-8 -*-
"""Teacher-facing pages of CourseFlix."""

# ---------------------------------------------------------------- dashboard
T_DASH_BODY = r"""
<h1 class="page-title">أهلاً أ. محمد</h1>
<p class="subtitle">نظرة سريعة على منصتك اليوم — الاثنين 14 يوليو 2026</p>

<div class="tiles section">
  <div class="tile"><span class="lead-ic"><span class="ms">group</span></span>
    <span class="lbl">إجمالي الطلاب</span><span class="num">128</span><span class="sub">+6 هذا الأسبوع</span></div>
  <div class="tile"><span class="lead-ic"><span class="ms">menu_book</span></span>
    <span class="lbl">الدورات المنشورة</span><span class="num">6</span><span class="sub">ودورة واحدة مسودة</span></div>
  <div class="tile"><span class="lead-ic"><span class="ms">grading</span></span>
    <span class="lbl">تسليمات بانتظار الاعتماد</span><span class="num">14</span><span class="sub">صححها المساعد — تحتاج اعتمادك</span></div>
  <div class="tile"><span class="lead-ic"><span class="ms">flag</span></span>
    <span class="lbl">تقارير تقدم جديدة</span><span class="num">3</span><span class="sub">طلاب يحتاجون متابعة</span></div>
</div>

<div class="section">
  <div class="section-head"><h2>إجراءات سريعة</h2></div>
  <div class="actions">
    <a class="btn" href="teacher-course.html#files"><span class="ms">upload_file</span>رفع ملف جديد</a>
    <a class="btn tonal" href="teacher-course.html#homework"><span class="ms">assignment_add</span>إنشاء واجب</a>
    <a class="btn tonal" href="teacher-course.html#content"><span class="ms">sensors</span>جدولة بث مباشر</a>
    <a class="btn outlined" href="teacher-quizzes.html"><span class="ms">neurology</span>توليد اختبار بالذكاء الاصطناعي</a>
  </div>
</div>

<div class="section">
  <div class="section-head"><h2>تقارير المساعد — طلاب يحتاجون متابعة</h2>
  <a class="see-all" href="teacher-students.html#reports">عرض الكل<span class="ms">chevron_left</span></a></div>
  <div class="list">
    <div class="list-item"><span class="lead pink"><span class="ms">flag</span></span>
      <div class="body"><div class="t">عبدالله حبسه — قانون نيوتن الثالث</div>
      <div class="s">دورة الميكانيكا · تكررت أسئلته حول المفهوم، وأنشأ المساعد اختبارًا قصيرًا تلقائيًا</div></div>
      <div class="end"><span class="chip pink">جديد</span><a class="btn text" href="teacher-students.html#reports">التفاصيل</a></div></div>
    <div class="list-item"><span class="lead pink"><span class="ms">flag</span></span>
      <div class="body"><div class="t">مريم مصطفى — قانون كولوم</div>
      <div class="s">دورة الكهرومغناطيسية · درجة الاختبار القصير 2/5 بعد المحاولة الثانية</div></div>
      <div class="end"><span class="chip pink">جديد</span><a class="btn text" href="teacher-students.html#reports">التفاصيل</a></div></div>
    <div class="list-item"><span class="lead"><span class="ms">flag</span></span>
      <div class="body"><div class="t">يوسف الجندي — تحويل وحدات القياس</div>
      <div class="s">مقدمة في القياس · تم إرسال بريد إلكتروني لك بالتفاصيل أمس</div></div>
      <div class="end">أمس</div></div>
  </div>
</div>

<div class="section">
  <div class="section-head"><h2>آخر التسليمات</h2></div>
  <div class="list">
    <div class="list-item"><span class="lead"><span class="ms">description</span></span>
      <div class="body"><div class="t">أحمد سامي — ورقة عمل قوانين نيوتن</div>
      <div class="s">اقتراح المساعد: 18/20 · «حل نموذجي مع خطأ حسابي بسيط في المسألة 3»</div></div>
      <div class="end"><button class="btn tonal btn-approve"><span class="ms">check</span>اعتماد</button></div></div>
    <div class="list-item"><span class="lead"><span class="ms">description</span></span>
      <div class="body"><div class="t">ملك إبراهيم — تقرير معملي: قياس العجلة</div>
      <div class="s">اقتراح المساعد: 15/20 · «التحليل جيد لكن جدول النتائج ناقص»</div></div>
      <div class="end"><button class="btn tonal btn-approve"><span class="ms">check</span>اعتماد</button></div></div>
    <div class="list-item"><span class="lead red"><span class="ms">warning</span></span>
      <div class="body"><div class="t">عمر فاروق — ورقة عمل قوانين نيوتن</div>
      <div class="s">اقتراح المساعد: 6/20 — أقل من حد النجاح (10). الاعتماد سيوقف اشتراكه تلقائيًا</div></div>
      <div class="end"><button class="btn danger btn-approve"><span class="ms">check</span>اعتماد</button></div></div>
  </div>
</div>
"""

T_DASH_JS = r"""
$$('.btn-approve').forEach(function(b){
  b.addEventListener('click',function(){
    b.disabled=true;b.innerHTML='<span class="ms">done_all</span>معتمد';
    snack('تم اعتماد الدرجة وإشعار الطالب');
  });
});
"""

# ---------------------------------------------------------------- course manage
T_COURSE_BODY = r"""
<div class="section-head">
  <div>
    <h1 class="page-title" style="margin-bottom:2px">الميكانيكا الكلاسيكية</h1>
    <p class="subtitle" style="margin:0">الصف الأول الثانوي · 46 طالبًا · <span class="chip green" style="vertical-align:middle">منشورة</span></p>
  </div>
  <a class="btn outlined" href="teacher-students.html"><span class="ms">group</span>طلاب الدورة</a>
</div>

<div class="tabs" role="tablist" style="margin-top:22px">
  <button class="tab active" data-tab="content">المحتوى</button>
  <button class="tab" data-tab="files">الملفات</button>
  <button class="tab" data-tab="homework">الواجبات</button>
  <button class="tab" data-tab="posts">المنشورات</button>
</div>

<section class="tabpane active" id="pane-content">
  <div class="actions" style="margin-bottom:20px">
    <button class="btn" data-open-dialog="videoDialog"><span class="ms">video_call</span>إضافة درس مسجل</button>
    <button class="btn tonal" data-open-dialog="liveDialog"><span class="ms">sensors</span>جدولة بث مباشر</button>
  </div>
  <div class="list">
    <div class="list-item"><span class="lead"><span class="ms">smart_display</span></span>
      <div class="body"><div class="t">3 — قوانين نيوتن للحركة</div><div class="s">مسجل · 61 دقيقة · شاهده 41 من 46 طالبًا</div></div>
      <div class="end"><span class="chip green">منشور</span>
      <button class="icon-btn" aria-label="تعديل"><span class="ms">edit</span></button></div></div>
    <div class="list-item"><span class="lead pink"><span class="ms">sensors</span></span>
      <div class="body"><div class="t">4 — تطبيقات على قوانين نيوتن</div><div class="s">بث مباشر · الخميس 17 يوليو 7:00 م</div></div>
      <div class="end"><span class="chip pink">مجدول</span>
      <button class="icon-btn" aria-label="تعديل"><span class="ms">edit</span></button></div></div>
    <div class="list-item"><span class="lead"><span class="ms">smart_display</span></span>
      <div class="body"><div class="t">5 — الاحتكاك وقوى التلامس</div><div class="s">مسجل · 48 دقيقة</div></div>
      <div class="end"><span class="chip outline">مسودة</span>
      <button class="icon-btn" aria-label="تعديل"><span class="ms">edit</span></button></div></div>
  </div>
</section>

<section class="tabpane" id="pane-files">
  <label class="dropzone" for="docUpload" style="margin-bottom:20px">
    <span class="ms">upload_file</span>
    <strong>ارفع مذكرة أو عرضًا (PDF / PPTX)</strong>
    <span style="font-size:12.5px">تُعالج تلقائيًا ليجيب المساعد من محتواها فقط — لا معرفة خارجية</span>
    <input type="file" id="docUpload" hidden>
  </label>
  <div class="list">
    <div class="list-item"><span class="lead red"><span class="ms">picture_as_pdf</span></span>
      <div class="body"><div class="t">مذكرة قوانين نيوتن للحركة</div><div class="s">PDF · 128 مقطعًا معرفيًا · مصدر لاختبارين</div></div>
      <div class="end"><span class="chip green"><span class="ms">check_circle</span>تمت المعالجة</span></div></div>
    <div class="list-item"><span class="lead"><span class="ms">slideshow</span></span>
      <div class="body"><div class="t">عرض تقديمي: السرعة والعجلة</div><div class="s">PPTX · 96 مقطعًا معرفيًا</div></div>
      <div class="end"><span class="chip green"><span class="ms">check_circle</span>تمت المعالجة</span></div></div>
    <div class="list-item"><span class="lead red"><span class="ms">picture_as_pdf</span></span>
      <div class="body"><div class="t">بنك مسائل الوحدة الأولى</div><div class="s">PDF · رُفع منذ 20 دقيقة</div></div>
      <div class="end"><span class="chip"><span class="ms">progress_activity</span>قيد المعالجة</span></div></div>
    <div class="list-item"><span class="lead red"><span class="ms">picture_as_pdf</span></span>
      <div class="body"><div class="t">مذكرة الاحتكاك (نسخة ممسوحة)</div><div class="s">PDF · تعذّر استخراج النص — جرّب نسخة رقمية</div></div>
      <div class="end"><span class="chip red"><span class="ms">error</span>فشلت المعالجة</span>
      <button class="btn text">إعادة المحاولة</button></div></div>
  </div>
</section>

<section class="tabpane" id="pane-homework">
  <div class="grid-2" style="align-items:start">
    <div class="card">
      <h3>إنشاء واجب جديد</h3>
      <div class="tf"><label for="hwTitle">عنوان الواجب</label><input id="hwTitle" placeholder="مثال: ورقة عمل الاحتكاك"></div>
      <div class="tf"><label for="hwDesc">الوصف</label><textarea id="hwDesc" placeholder="تعليمات الحل والتسليم…"></textarea></div>
      <div style="display:flex;gap:12px">
        <div class="tf" style="flex:1"><label for="hwDue">آخر موعد</label><input type="date" id="hwDue" value="2026-07-23"></div>
        <div class="tf" style="flex:1"><label for="hwMax">الدرجة العظمى</label><input type="number" id="hwMax" value="20"></div>
        <div class="tf" style="flex:1"><label for="hwPass">حد النجاح</label><input type="number" id="hwPass" value="10"></div>
      </div>
      <span class="meta"><span class="ms sm" style="vertical-align:-4px">info</span> من ينزل عن حد النجاح يُوقف اشتراكه تلقائيًا مع إشعارك</span>
      <button class="btn" id="createHw" style="align-self:flex-start"><span class="ms">add</span>نشر الواجب</button>
    </div>
    <div class="list">
      <div class="list-item"><span class="lead"><span class="ms">assignment</span></span>
        <div class="body"><div class="t">ورقة عمل: قوانين نيوتن للحركة</div><div class="s">آخر موعد 16 يوليو · سلّم 28 من 46</div></div>
        <div class="end"><span class="chip">28 تسليمًا</span></div></div>
      <div class="list-item"><span class="lead"><span class="ms">assignment</span></span>
        <div class="body"><div class="t">تقرير معملي: قياس العجلة</div><div class="s">آخر موعد 18 يوليو · سلّم 11 من 46</div></div>
        <div class="end"><span class="chip">11 تسليمًا</span></div></div>
      <div class="list-item"><span class="lead green"><span class="ms">assignment_turned_in</span></span>
        <div class="body"><div class="t">مسائل: الحركة الدائرية</div><div class="s">مكتمل · متوسط الدرجات 15.8/20</div></div>
        <div class="end"><span class="chip green">مكتمل</span></div></div>
    </div>
  </div>
</section>

<section class="tabpane" id="pane-posts">
  <div class="card" style="margin-bottom:20px">
    <div class="tf" style="margin:0"><label for="postBox">منشور جديد للطلاب</label>
    <textarea id="postBox" placeholder="اكتب إعلانًا أو تذكيرًا…"></textarea></div>
    <div class="actions" style="justify-content:space-between;display:flex">
      <button class="btn text"><span class="ms">attach_file</span>إرفاق ملف</button>
      <button class="btn" id="publishPost"><span class="ms">send</span>نشر</button>
    </div>
  </div>
  <div class="list" id="postFeed">
    <div class="list-item" style="align-items:flex-start"><span class="avatar" style="width:46px;height:46px"><span class="ms">person</span></span>
      <div class="body"><div class="t">أنت <span class="s" style="font-weight:400">· منذ 3 ساعات</span></div>
      <p style="margin-top:6px">رفعت لكم مذكرة المراجعة النهائية لدرس الحركة في خط مستقيم. ركزوا على مسائل الرسم البياني.</p></div></div>
  </div>
</section>

<dialog id="videoDialog">
  <h3>إضافة درس مسجل</h3>
  <div class="tf"><label>عنوان الدرس</label><input placeholder="مثال: 6 — كمية الحركة"></div>
  <label class="dropzone" for="vidFile" style="padding:22px">
    <span class="ms">movie</span><strong>اختر ملف الفيديو</strong>
    <input type="file" id="vidFile" hidden>
  </label>
  <div class="dialog-actions">
    <button class="btn text" data-close-dialog>إلغاء</button>
    <button class="btn" data-close-dialog>رفع ونشر</button>
  </div>
</dialog>

<dialog id="liveDialog">
  <h3>جدولة بث مباشر</h3>
  <div class="tf"><label>عنوان الجلسة</label><input placeholder="مثال: مراجعة ليلة الامتحان"></div>
  <div class="tf"><label>الموعد</label><input type="datetime-local" value="2026-07-17T19:00"></div>
  <p style="margin:0">سيصل إشعار تلقائي لكل طلاب الدورة، ويُحسب الحضور من مدة المشاهدة.</p>
  <div class="dialog-actions">
    <button class="btn text" data-close-dialog>إلغاء</button>
    <button class="btn" data-close-dialog>جدولة</button>
  </div>
</dialog>
"""

T_COURSE_JS = r"""
var up=document.getElementById('docUpload');
if(up)up.addEventListener('change',function(){snack('بدأت معالجة الملف — سيكون متاحًا للمساعد خلال دقائق')});
var ch=document.getElementById('createHw');
if(ch)ch.addEventListener('click',function(){snack('تم نشر الواجب وإرسال إشعار لكل الطلاب')});
var pp=document.getElementById('publishPost');
if(pp)pp.addEventListener('click',function(){
  var box=document.getElementById('postBox');
  if(!box.value.trim())return;
  var d=document.createElement('div');
  d.className='list-item';d.style.alignItems='flex-start';
  d.innerHTML='<span class="avatar" style="width:46px;height:46px"><span class="ms">person</span></span>'+
    '<div class="body"><div class="t">أنت <span class="s" style="font-weight:400">· الآن</span></div>'+
    '<p style="margin-top:6px"></p></div>';
  d.querySelector('p').textContent=box.value;
  var feed=document.getElementById('postFeed');
  feed.insertBefore(d,feed.firstChild);
  box.value='';snack('تم نشر المنشور وإشعار الطلاب');
});
"""

# ---------------------------------------------------------------- students
T_STUDENTS_BODY = r"""
<div class="section-head">
  <div>
    <h1 class="page-title" style="margin-bottom:2px">الطلاب</h1>
    <p class="subtitle" style="margin:0">دورة الميكانيكا الكلاسيكية · 46 طالبًا</p>
  </div>
</div>

<div class="tf" style="max-width:420px;margin:18px 0 24px">
  <input type="search" id="studentSearch" placeholder="ابحث باسم الطالب…" aria-label="بحث">
</div>

<div class="table-wrap section">
  <table class="mtable" id="studentsTable">
    <thead><tr>
      <th>الطالب</th><th>الإنجاز</th><th>الحضور</th><th>متوسط الدرجات</th><th>الحالة</th><th>إجراء</th>
    </tr></thead>
    <tbody>
      <tr>
        <td><span class="student-cell"><span class="avatar"><span class="ms">person</span></span>عبدالله حبسه</span></td>
        <td><div class="progress" style="width:120px"><div class="bar" style="width:89%"></div></div></td>
        <td>91%</td><td>16.4/20</td>
        <td><span class="chip green">نشط</span></td>
        <td><button class="btn text toggle-suspend">إيقاف</button></td>
      </tr>
      <tr>
        <td><span class="student-cell"><span class="avatar"><span class="ms">person</span></span>أحمد سامي</span></td>
        <td><div class="progress" style="width:120px"><div class="bar" style="width:76%"></div></div></td>
        <td>88%</td><td>17.1/20</td>
        <td><span class="chip green">نشط</span></td>
        <td><button class="btn text toggle-suspend">إيقاف</button></td>
      </tr>
      <tr>
        <td><span class="student-cell"><span class="avatar"><span class="ms">person</span></span>مريم مصطفى</span></td>
        <td><div class="progress" style="width:120px"><div class="bar" style="width:64%"></div></div></td>
        <td>79%</td><td>12.3/20</td>
        <td><span class="chip pink">تحتاج متابعة</span></td>
        <td><button class="btn text toggle-suspend">إيقاف</button></td>
      </tr>
      <tr>
        <td><span class="student-cell"><span class="avatar"><span class="ms">person</span></span>عمر فاروق</span></td>
        <td><div class="progress" style="width:120px"><div class="bar" style="width:31%"></div></div></td>
        <td>42%</td><td>6.0/20</td>
        <td><span class="chip red">موقوف تلقائيًا</span></td>
        <td><button class="btn text toggle-suspend" data-suspended="1">تفعيل</button></td>
      </tr>
      <tr>
        <td><span class="student-cell"><span class="avatar"><span class="ms">person</span></span>ملك إبراهيم</span></td>
        <td><div class="progress" style="width:120px"><div class="bar" style="width:58%"></div></div></td>
        <td>85%</td><td>14.7/20</td>
        <td><span class="chip green">نشط</span></td>
        <td><button class="btn text toggle-suspend">إيقاف</button></td>
      </tr>
    </tbody>
  </table>
</div>
<p class="subtitle" style="margin-top:-14px">عمر فاروق: أُوقف تلقائيًا — درجة «ورقة عمل قوانين نيوتن» 6/20 أقل من حد النجاح 10</p>

<div class="section" id="reports">
  <div class="section-head"><h2>تقارير التقدم من المساعد</h2></div>
  <div class="list">
    <div class="list-item"><span class="lead pink"><span class="ms">flag</span></span>
      <div class="body"><div class="t">عبدالله حبسه — صعوبة في «قانون نيوتن الثالث»</div>
      <div class="s">رصد المساعد 7 أسئلة متكررة حول المفهوم خلال يومين، وأنشأ اختبارًا قصيرًا تلقائيًا (درجته 3/5)</div></div>
      <div class="end"><span class="chip pink">بريد مُرسل</span><button class="btn tonal notify-btn"><span class="ms">outgoing_mail</span>تواصل</button></div></div>
    <div class="list-item"><span class="lead pink"><span class="ms">flag</span></span>
      <div class="body"><div class="t">مريم مصطفى — صعوبة في «قانون كولوم»</div>
      <div class="s">درجة الاختبار القصير 2/5 بعد محاولتين · يقترح المساعد جلسة مراجعة فردية</div></div>
      <div class="end"><span class="chip pink">جديد</span><button class="btn tonal notify-btn"><span class="ms">outgoing_mail</span>تواصل</button></div></div>
    <div class="list-item"><span class="lead"><span class="ms">flag</span></span>
      <div class="body"><div class="t">يوسف الجندي — صعوبة في «تحويل وحدات القياس»</div>
      <div class="s">تمت المتابعة · تحسنت درجته إلى 4/5 في إعادة الاختبار</div></div>
      <div class="end"><span class="chip green">تمت المعالجة</span></div></div>
  </div>
</div>
"""

T_STUDENTS_JS = r"""
document.getElementById('studentSearch').addEventListener('input',function(){
  var q=this.value.trim();
  $$('#studentsTable tbody tr').forEach(function(tr){
    tr.style.display=tr.textContent.indexOf(q)>-1?'':'none';
  });
});
$$('.toggle-suspend').forEach(function(b){
  b.addEventListener('click',function(){
    var chip=b.closest('tr').querySelector('.chip');
    var suspended=b.dataset.suspended==='1';
    if(suspended){
      chip.className='chip green';chip.textContent='نشط';
      b.textContent='إيقاف';b.dataset.suspended='0';
      snack('تم إعادة تفعيل اشتراك الطالب');
    }else{
      chip.className='chip red';chip.textContent='موقوف';
      b.textContent='تفعيل';b.dataset.suspended='1';
      snack('تم إيقاف اشتراك الطالب وإرسال إشعار له');
    }
  });
});
$$('.notify-btn').forEach(function(b){
  b.addEventListener('click',function(){snack('تم إرسال رسالة متابعة للطالب ووليّ أمره')});
});
"""

# ---------------------------------------------------------------- quizzes
T_QUIZZES_BODY = r"""
<div class="section-head">
  <div>
    <h1 class="page-title" style="margin-bottom:2px">الاختبارات</h1>
    <p class="subtitle" style="margin:0">إنشاء يدوي أو توليد تلقائي من ملفات الدورة</p>
  </div>
  <div class="actions">
    <button class="btn" data-open-dialog="genDialog"><span class="ms">neurology</span>توليد بالذكاء الاصطناعي</button>
    <button class="btn tonal" data-open-dialog="manualDialog"><span class="ms">add</span>إنشاء يدوي</button>
  </div>
</div>

<div class="list" style="margin-top:26px">
  <div class="list-item"><span class="lead"><span class="ms">quiz</span></span>
    <div class="body"><div class="t">اختبار: الحركة في خط مستقيم</div>
    <div class="s">يدوي · 10 أسئلة · حلّه 44 طالبًا · المتوسط 8.2/10</div></div>
    <div class="end"><span class="chip">يدوي</span>
    <button class="icon-btn" aria-label="النتائج"><span class="ms">monitoring</span></button></div></div>
  <div class="list-item"><span class="lead"><span class="ms">quiz</span></span>
    <div class="body"><div class="t">اختبار: قوانين نيوتن للحركة</div>
    <div class="s">مولّد من «مذكرة قوانين نيوتن» · 8 أسئلة · حلّه 31 طالبًا · المتوسط 6.9/10</div></div>
    <div class="end"><span class="chip pink">مولّد تلقائيًا</span>
    <button class="icon-btn" aria-label="النتائج"><span class="ms">monitoring</span></button></div></div>
  <div class="list-item"><span class="lead pink"><span class="ms">bolt</span></span>
    <div class="body"><div class="t">اختبار قصير: قانون نيوتن الثالث</div>
    <div class="s">أنشأه المساعد تلقائيًا لعبدالله حبسه بعد رصد صعوبة في المفهوم</div></div>
    <div class="end"><span class="chip pink">اختبار قصير</span>
    <button class="icon-btn" aria-label="النتائج"><span class="ms">monitoring</span></button></div></div>
  <div class="list-item"><span class="lead"><span class="ms">quiz</span></span>
    <div class="body"><div class="t">اختبار: السرعة النسبية</div>
    <div class="s">يدوي · 8 أسئلة · متاح حتى 25 يوليو · حلّه 12 طالبًا</div></div>
    <div class="end"><span class="chip">يدوي</span>
    <button class="icon-btn" aria-label="النتائج"><span class="ms">monitoring</span></button></div></div>
</div>

<dialog id="genDialog">
  <h3>توليد اختبار من ملف</h3>
  <p>يولّد المساعد الأسئلة من محتوى الملف فقط — بلا أي معرفة خارجية. راجِع الأسئلة قبل النشر.</p>
  <div class="tf"><label>الملف المصدر</label>
    <select><option>مذكرة قوانين نيوتن للحركة</option><option>عرض السرعة والعجلة</option><option>بنك مسائل الوحدة الأولى</option></select></div>
  <div style="display:flex;gap:12px">
    <div class="tf" style="flex:1"><label>عدد الأسئلة</label><input type="number" value="8"></div>
    <div class="tf" style="flex:1"><label>النوع</label>
      <select><option>اختيار من متعدد</option><option>صح وخطأ</option><option>مختلط</option></select></div>
  </div>
  <div class="dialog-actions">
    <button class="btn text" data-close-dialog>إلغاء</button>
    <button class="btn" id="genBtn"><span class="ms">neurology</span>توليد</button>
  </div>
</dialog>

<dialog id="manualDialog">
  <h3>إنشاء اختبار يدوي</h3>
  <div class="tf"><label>عنوان الاختبار</label><input placeholder="مثال: مراجعة الوحدة الأولى"></div>
  <div class="tf"><label>السؤال الأول</label><textarea placeholder="نص السؤال…"></textarea></div>
  <div class="dialog-actions">
    <button class="btn text" data-close-dialog>إلغاء</button>
    <button class="btn" data-close-dialog>حفظ ومتابعة</button>
  </div>
</dialog>
"""

T_QUIZZES_JS = r"""
var g=document.getElementById('genBtn');
if(g)g.addEventListener('click',function(){
  g.disabled=true;g.innerHTML='<span class="ms">progress_activity</span>جارٍ التوليد…';
  setTimeout(function(){
    g.closest('dialog').close();
    g.disabled=false;g.innerHTML='<span class="ms">neurology</span>توليد';
    snack('تم توليد 8 أسئلة — راجعها قبل النشر');
  },1600);
});
"""

PAGES = [
    dict(file="teacher-dashboard.html", title="لوحة المعلم", role="teacher", active="teacher-dashboard.html", body=T_DASH_BODY, js=T_DASH_JS),
    dict(file="teacher-course.html", title="إدارة الدورة", role="teacher", active="teacher-course.html", body=T_COURSE_BODY, js=T_COURSE_JS),
    dict(file="teacher-students.html", title="الطلاب", role="teacher", active="teacher-students.html", body=T_STUDENTS_BODY, js=T_STUDENTS_JS),
    dict(file="teacher-quizzes.html", title="الاختبارات", role="teacher", active="teacher-quizzes.html", body=T_QUIZZES_BODY, js=T_QUIZZES_JS),
]
