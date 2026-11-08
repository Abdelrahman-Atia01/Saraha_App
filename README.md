
## هيكل المشروع

```text
saraha-project/
├── backend/       # Express 5 + Mongoose + JWT + Socket.IO
├── frontend/      # Vue 3 + Vite + Pinia + Vue Router
├── README.md
└── TEST_REPORT.md
```

## المتطلبات

- Node.js **22.18 أو أحدث**.
- npm **10 أو أحدث**.
- MongoDB محلي أو MongoDB Atlas يمكن الوصول إليه من جهازك.
- SMTP صالح لتفعيل الحسابات واستعادة كلمات المرور وإعادة تأكيد البريد عند تغييره.

تحقق من إصدار Node قبل التثبيت:

```bat
node -v
npm -v
```

## 1) إعداد وتشغيل Backend — Windows CMD

افتح نافذة CMD أولى:

```bat
cd /d C:\path\to\saraha-project\backend
copy .env.example .env
notepad .env
```

عدّل القيم داخل `backend\.env`:

| المتغير | المطلوب |
|---|---|
| `MONGO_URI` | رابط قاعدة بيانات MongoDB. محليًا: `mongodb://127.0.0.1:27017/saraha` |
| `token_user_key` | Secret عشوائي طويل مستقل لتوقيع JWT الخاص بتسجيل الدخول. |
| `email_token` | Secret عشوائي مستقل لتوقيع روابط التفعيل واستعادة كلمة المرور. |
| `phone_private_key` | Secret مستقل لتشفير أرقام الهاتف. إذا كنت تستخدم قاعدة بيانات قديمة، استعد المفتاح الأصلي حتى لا تفقد القدرة على فك تشفير الأرقام القديمة. |
| `FRONTEND_ORIGIN` | قائمة origins مفصولة بفواصل، مثل `http://localhost:5173,http://localhost:4173`. |
| `FRONTEND_URL` | عنوان Frontend واحد تُنشأ عليه روابط التفعيل والاستعادة، مثل `http://localhost:5173`. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` | إعدادات مزود البريد، مثل Gmail SMTP. |
| `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | بيانات SMTP. استخدم App Password عند الحاجة، وليس كلمة مرور حسابك العادية. |
| `PORT` | منفذ Backend؛ الافتراضي `5000`. |

يجب استبدال قيم الـSecrets التجريبية في `.env.example`. يرفض Backend بدء التشغيل إذا كانت أسرار JWT أو البريد أو تشفير الهاتف مفقودة أو ما زالت بالقيم الافتراضية.

إذا كنت تستخدم MongoDB Atlas، تأكد من إضافة عنوان IP الخاص بجهازك في **Network Access**، وأن مستخدم قاعدة البيانات لديه صلاحيات القراءة والكتابة على قاعدة Saraha.

ثبّت وشغّل:

```bat
npm ci
npm run dev
```

عنوان فحص الحالة:

`http://localhost:5000/health`

يعرض `200` عند اتصال MongoDB، و`503 degraded` إذا كان الخادم يعمل لكن قاعدة البيانات غير متاحة.

## 2) إعداد وتشغيل Frontend — نافذة CMD ثانية

```bat
cd /d C:\path\to\saraha-project\frontend
copy .env.example .env
notepad .env
npm ci
npm run dev
```

افتح:

`http://localhost:5173`

الإعداد الافتراضي يرسل `/api` إلى Backend على `http://localhost:5000` من خلال Vite proxy، ويحوّل `/socket.io` و`/uploads` إلى Backend أيضًا.

لبناء نسخة الإنتاج:

```bat
npm run build
npm run preview
```

## 3) إعداد الإنتاج

إذا كان Frontend وBackend على نطاقين مختلفين:

- اضبط `VITE_API_BASE_URL` في Frontend على عنوان API العام.
- اضبط `VITE_SOCKET_URL` على أصل Socket.IO الخاص بالـBackend إذا لم يكن الاتصال same-origin.
- أضف أصل Frontend إلى `FRONTEND_ORIGIN` في Backend.
- اضبط `FRONTEND_URL` على عنوان Frontend العام الذي يجب أن يصل إليه المستخدم من روابط البريد.
- اضبط reverse proxy لتمرير `/socket.io` مع دعم WebSocket upgrades، وتمرير `/uploads` إلى Backend. إذا استخدمت `/api`، اجعل reverse proxy يزيل بادئة `/api` قبل تمرير الطلبات إلى Express.

## 4) البريد الإلكتروني

- التفعيل واستعادة كلمة المرور يعتمدان على `email_token` وإعدادات SMTP الصحيحة.
- رابط استعادة كلمة المرور صالح لمدة 15 دقيقة، ويصبح غير صالح بعد استخدامه بنجاح.
- إذا لم تضبط SMTP، لن تصل رسائل التفعيل أو الاستعادة؛ مسار استعادة كلمة المرور يعيد `503` بوضوح.

## 5) Socket.IO

يحمّل Vue عميل Socket.IO من `/socket.io/socket.io.js` الذي يقدمه نفس إصدار Socket.IO المثبت في Backend، لذلك لا توجد نسخة عميل مستقلة قد تتعارض في الإصدارات. يرسل Frontend الـJWT في `handshake.auth.token`.

الأحداث المستخدمة:

- `message:new`: رسالة جديدة لصندوق الوارد.
- `message:sent`: رسالة جديدة لصندوق الصادر.
- `message:deleted`: حذف رسالة؛ يتم تحديث صندوقي المستخدمين المعنيين.

يتم الانضمام إلى غرفة المستخدم بعد التحقق من JWT ووجود المستخدم في MongoDB. لا تُعتبر الأحداث اللحظية مكتملة في بيئة لا تتصل بقاعدة البيانات.

## 6) ملاحظات التوافق والأمان

- يشتق Backend هوية المرسل ومالك Inbox/Outbox من JWT؛ لا يعتمد على IDs يرسلها المتصفح.
- لا يعيد Inbox هوية المرسل، ولا يعيد البريد الإلكتروني للطرف الآخر في تفاصيل الرسائل.
- لا يُسمح إلا للمرسل أو المستلم بعرض الرسالة أو حذفها.
- تغيير كلمة المرور أو استعادتها يبطل الجلسات السابقة.
- رفع الصور يتطلب جلسة مصادقًا عليها، ويقبل JPEG/PNG/WEBP/GIF فقط، بحد أقصى 5 MB، مع فحص توقيع الملف.
- ملفات `.env` الحقيقية و`node_modules` غير موجودة في الحزمة.
- الأرشيف الأصلي احتوى على كلمة مرور SMTP مكتوبة داخل كود قديم؛ لم يتم تضمينها أو استخدامها. غيّر/ألغِ بيانات الاعتماد القديمة قبل نشر التطبيق.
- عند استخدام قاعدة بيانات قديمة، لا تغيّر `phone_private_key` دون خطة ترحيل؛ تغيير المفتاح قد يمنع فك تشفير أرقام الهاتف المحفوظة سابقًا.

## 7) الاختبارات

راجع `TEST_REPORT.md` لمعرفة الاختبارات التي نُفذت بالفعل، وما نجح منها، وما تعذر بسبب عدم توفر الشبكة أو MongoDB أو SMTP. لا تعتبر المشروع جاهزًا للإنتاج قبل إعادة الاختبارات المحجوبة في بيئة متصلة وتشغيل رحلة مستخدم كاملة.
