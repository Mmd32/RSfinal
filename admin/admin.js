/* Retail Solutions — admin panel
   Edits content/content.json through api/index.php (or tools/dev-server.ps1 locally). */
(function () {
  'use strict';

  const API = '../api/index.php';

  /* =========================================================
     Schema — what can be edited, with Persian labels.
     Field types: text, textarea, url, image, number, toggle,
                  group (nested object), list (objects), strings (list of text)
     ========================================================= */
  const RICH_HINT = 'برای پررنگ کردن یک کلمه آن را بین دو ستاره بگذارید: **کلمه**';
  const PROSE_HINT = 'پاراگراف‌ها را با یک خط خالی جدا کنید. «## » اول خط = تیتر، «- » = فهرست، «> » = نقل‌قول، **کلمه** = پررنگ.';
  const GROUPS = { home: 'صفحه‌ی اصلی', pages: 'صفحات داخلی', settings: 'تنظیمات سایت' };
  const BLOCK_LABELS = {
    about: 'ما کی هستیم',
    services: 'ما چه می‌کنیم (بخش آبی + کارت‌ها)',
    pains: 'درد مشتری‌ها',
    difference: 'تفاوت ما',
    solutions: 'کاشی‌های خدمات',
    industries: 'صنایع'
  };
  const SCHEMA = [
    { key: 'layout', title: 'ترتیب بخش‌ها', intro: 'ترتیب بخش‌های صفحه را با کشیدن یا فلش‌ها عوض کنید. با خاموش کردن «نمایش»، آن بخش از سایت پنهان می‌شود (محتوایش پاک نمی‌شود). اسلایدشو همیشه بالای صفحه و فوتر همیشه پایین است.', fields: [
      { key: 'sections', type: 'order' }
    ] },
    { key: 'hero', title: 'اسلایدشو', intro: 'بخش اول صفحه‌ی اصلی. هر اسلاید یک عکس، یک تیتر و یک متن دارد؛ ترتیب اسلایدها را با فلش‌ها عوض کنید.', fields: [
      { key: 'style', type: 'select', label: 'سبک نمایش', options: [
        ['split', 'دوبخشی — متن روی پنل سرمه‌ای، عکس کامل و روشن کنار آن (پیشنهادی)'],
        ['overlay', 'تمام‌صفحه — عکس پس‌زمینه‌ی کل صفحه و متن روی آن']
      ], hint: 'در حالت دوبخشی هم متن کاملاً خواناست و هم عکس بدون تیرگی دیده می‌شود. برای متن‌های بلند مناسب‌تر است.' },
      { row: [
        { key: 'panelWidth', type: 'number', label: 'عرض پنل متن در حالت دوبخشی (درصد)', min: 34, max: 60, hint: 'بین ۳۴ تا ۶۰ — پیش‌فرض ۴۴' },
        { key: 'interval', type: 'number', label: 'زمان نمایش هر اسلاید (ثانیه)', min: 2, max: 30, hint: 'برای متن‌های بلند ۸ تا ۱۰ ثانیه' }
      ] },
      { key: 'autoplay', type: 'toggle', label: 'پخش خودکار اسلایدها' },
      { key: 'slides', type: 'list', label: 'اسلایدها', itemLabel: 'اسلاید', titleKey: 'title', thumbKey: 'image', min: 1,
        template: { image: '', imagePosition: 'center', imageAlt: '', eyebrow: '', title: 'تیتر اسلاید جدید', text: '', buttonLabel: '', buttonUrl: '' },
        fields: [
          { key: 'image', type: 'image', label: 'عکس', hint: 'اندازه‌ی پیشنهادی: ۲۰۰۰×۱۶۰۰ پیکسل (نسبت ۵:۴)، حداقل ۱۴۰۰×۱۱۲۰. موضوع اصلی عکس را وسط کادر بگذارید؛ لبه‌ها در موبایل و دسکتاپ کمی بریده می‌شوند. در حالت تمام‌صفحه: ۲۴۰۰×۱۳۵۰ (۱۶:۹).' },
          { row: [
            { key: 'imagePosition', type: 'select', label: 'نقطه‌ی تمرکز عکس', options: [['center', 'وسط'], ['top', 'بالا'], ['bottom', 'پایین'], ['right', 'راست'], ['left', 'چپ']], hint: 'اگر بخش مهم عکس بریده شد، این را عوض کنید.' },
            { key: 'imageAlt', type: 'text', label: 'توضیح عکس (برای گوگل و نابینایان)' }
          ] },
          { key: 'eyebrow', type: 'text', label: 'متن کوچک بالای تیتر (اختیاری)' },
          { key: 'title', type: 'textarea', label: 'تیتر', rows: 2, hint: RICH_HINT },
          { key: 'text', type: 'textarea', label: 'متن', rows: 6, hint: 'برای پاراگراف جدید یک خط خالی بگذارید. ' + RICH_HINT },
          { row: [
            { key: 'buttonLabel', type: 'text', label: 'متن دکمه (اختیاری)' },
            { key: 'buttonUrl', type: 'url', label: 'لینک دکمه' }
          ] }
        ] }
    ] },

    { key: 'about', title: 'ما کی هستیم', fields: [
      { key: 'eyebrow', type: 'text', label: 'برچسب کوچک بالای تیتر' },
      { row: [
        { key: 'title', type: 'text', label: 'تیتر (بخش اول)' },
        { key: 'titleHighlight', type: 'text', label: 'تیتر (بخش رنگی)' }
      ] },
      { key: 'paragraphs', type: 'strings', label: 'پاراگراف‌ها', itemLabel: 'پاراگراف', multiline: true, hint: RICH_HINT },
      { key: 'stats', type: 'list', label: 'آمار', itemLabel: 'آمار', titleKey: 'label', template: { value: '۰', label: 'عنوان' }, fields: [
        { row: [ { key: 'value', type: 'text', label: 'عدد' }, { key: 'label', type: 'text', label: 'عنوان' } ] }
      ] },
      { key: 'cta', type: 'group', label: 'کادر «با هم بسازیم»', fields: [
        { key: 'eyebrow', type: 'text', label: 'برچسب کوچک' },
        { key: 'title', type: 'text', label: 'تیتر' },
        { key: 'text', type: 'textarea', label: 'متن', hint: RICH_HINT },
        { row: [ { key: 'primaryLabel', type: 'text', label: 'دکمه‌ی اصلی — متن' }, { key: 'primaryUrl', type: 'url', label: 'دکمه‌ی اصلی — لینک' } ] },
        { row: [ { key: 'secondaryLabel', type: 'text', label: 'دکمه‌ی دوم — متن' }, { key: 'secondaryUrl', type: 'url', label: 'دکمه‌ی دوم — لینک' } ] }
      ] }
    ] },

    { key: 'services', title: 'ما چه می‌کنیم', fields: [
      { key: 'eyebrow', type: 'text', label: 'برچسب کوچک' },
      { key: 'title', type: 'text', label: 'تیتر' },
      { key: 'text', type: 'textarea', label: 'متن', hint: RICH_HINT },
      { row: [ { key: 'buttonLabel', type: 'text', label: 'متن دکمه' }, { key: 'buttonUrl', type: 'url', label: 'لینک دکمه' } ] },
      { key: 'moreLabel', type: 'text', label: 'متن «بیشتر بخوانید» روی کارت‌ها' },
      { key: 'cards', type: 'list', fixed: 4, label: 'کارت‌های خدمات', itemLabel: 'کارت', titleKey: 'title', thumbKey: 'image',
        hint: 'چیدمان ثابت است: کارت ۱ و ۲ کوچک، کارت ۳ عریض، کارت ۴ بلند (ستون کنار).',
        fields: [
          { key: 'image', type: 'image', label: 'عکس', dark: true },
          { row: [ { key: 'tag', type: 'text', label: 'برچسب (انگلیسی)' }, { key: 'title', type: 'text', label: 'عنوان' } ] },
          { key: 'text', type: 'textarea', label: 'توضیح', rows: 2 },
          { key: 'url', type: 'url', label: 'لینک' }
        ] }
    ] },

    { key: 'pains', title: 'درد مشتری‌ها', fields: [
      { key: 'image', type: 'image', label: 'عکس کنار بخش' },
      { key: 'eyebrow', type: 'text', label: 'برچسب کوچک' },
      { key: 'title', type: 'text', label: 'تیتر' },
      { key: 'text', type: 'textarea', label: 'متن زیر تیتر', rows: 2, hint: RICH_HINT },
      { key: 'items', type: 'strings', label: 'موارد شماره‌دار', itemLabel: 'مورد', multiline: true },
      { key: 'closing', type: 'textarea', label: 'جمله‌ی پایانی', rows: 2, hint: RICH_HINT }
    ] },

    { key: 'difference', title: 'تفاوت ما', fields: [
      { key: 'eyebrow', type: 'text', label: 'برچسب کوچک' },
      { key: 'title', type: 'text', label: 'تیتر' },
      { key: 'text', type: 'textarea', label: 'متن', hint: RICH_HINT },
      { row: [ { key: 'buttonLabel', type: 'text', label: 'متن دکمه' }, { key: 'buttonUrl', type: 'url', label: 'لینک دکمه' } ] },
      { key: 'videoImage', type: 'image', label: 'عکس کاور ویدیو', dark: true },
      { key: 'videoUrl', type: 'url', label: 'لینک ویدیو', hint: 'لینک یوتیوب یا آپارات (مثل https://www.aparat.com/v/xxxxx). اگر خالی باشد دکمه‌ی پخش نمایش داده نمی‌شود.' }
    ] },

    { key: 'solutions', title: 'کاشی‌های خدمات', fields: [
      { key: 'eyebrow', type: 'text', label: 'برچسب کوچک' },
      { key: 'title', type: 'text', label: 'تیتر' },
      { row: [ { key: 'linkLabel', type: 'text', label: 'متن لینک کنار تیتر' }, { key: 'linkUrl', type: 'url', label: 'آدرس لینک' } ] },
      { key: 'tiles', type: 'list', fixed: 4, label: 'کاشی‌ها', itemLabel: 'کاشی', titleKey: 'title', thumbKey: 'image',
        hint: 'چیدمان ثابت است: کاشی ۱ بزرگ، کاشی ۲ عریض، کاشی ۳ و ۴ کوچک.',
        fields: [
          { key: 'image', type: 'image', label: 'عکس', dark: true },
          { row: [ { key: 'tag', type: 'text', label: 'برچسب' }, { key: 'title', type: 'text', label: 'عنوان' } ] },
          { key: 'url', type: 'url', label: 'لینک' }
        ] }
    ] },

    { key: 'industries', title: 'صنایع', fields: [
      { key: 'eyebrow', type: 'text', label: 'برچسب کوچک' },
      { key: 'items', type: 'strings', label: 'صنایع (اسلایدر)', itemLabel: 'صنعت' }
    ] },

    { key: 'nav', group: 'settings', title: 'منوی بالا', intro: 'آدرس صفحات: about.html ، solutions.html ، solution.html?id=fr ، capability.html?id=strategy ، insights.html ، article.html?id=… ، contact.html ، page.html?id=privacy — برای بخش‌های صفحه‌ی اصلی: index.html#industries', fields: [
      { key: 'items', type: 'list', label: 'آیتم‌های منو', itemLabel: 'آیتم', titleKey: 'label', template: { label: 'آیتم جدید', url: '#', children: [] }, fields: [
        { row: [ { key: 'label', type: 'text', label: 'عنوان' }, { key: 'url', type: 'url', label: 'لینک', hint: 'برای رفتن به یک بخش همین صفحه: #about ، #services ، #industries ، #contact' } ] },
        { key: 'children', type: 'list', label: 'زیرمنو (اختیاری)', itemLabel: 'زیرمنو', titleKey: 'label', template: { tag: '', label: 'زیرمنوی جدید', url: '#' }, fields: [
          { row: [ { key: 'tag', type: 'text', label: 'برچسب کوچک (اختیاری)' }, { key: 'label', type: 'text', label: 'عنوان' } ] },
          { key: 'url', type: 'url', label: 'لینک' }
        ] }
      ] },
      { row: [ { key: 'langLabel', type: 'text', label: 'دکمه‌ی زبان — متن' }, { key: 'langUrl', type: 'url', label: 'دکمه‌ی زبان — لینک' } ] }
    ] },

    { key: 'footer', group: 'settings', title: 'فوتر', fields: [
      { row: [ { key: 'brandTitle', type: 'text', label: 'تیتر ستون اول' }, { key: 'linksTitle', type: 'text', label: 'تیتر ستون لینک‌ها' } ] },
      { key: 'tagline', type: 'textarea', label: 'شعار (هر خط جدا)', rows: 2 },
      { key: 'links', type: 'list', label: 'لینک‌های دسترسی سریع', itemLabel: 'لینک', titleKey: 'label', template: { label: 'لینک جدید', url: '#' }, fields: [
        { row: [ { key: 'label', type: 'text', label: 'عنوان' }, { key: 'url', type: 'url', label: 'لینک' } ] }
      ] },
      { key: 'contactTitle', type: 'text', label: 'تیتر ستون ارتباط' },
      { row: [ { key: 'email', type: 'text', label: 'ایمیل', ltr: true }, { key: 'phone', type: 'text', label: 'تلفن (اختیاری)', ltr: true } ] },
      { row: [ { key: 'linkedin', type: 'url', label: 'لینکدین' }, { key: 'instagram', type: 'url', label: 'اینستاگرام' } ] },
      { row: [ { key: 'copyright', type: 'text', label: 'متن کپی‌رایت', hint: 'سال به‌صورت خودکار اضافه می‌شود.' }, { key: 'poweredBy', type: 'text', label: 'متن سازنده' } ] },
      { key: 'legal', type: 'list', label: 'لینک‌های پایین فوتر', itemLabel: 'لینک', titleKey: 'label', template: { label: 'لینک جدید', url: '#' }, fields: [
        { row: [ { key: 'label', type: 'text', label: 'عنوان' }, { key: 'url', type: 'url', label: 'لینک' } ] }
      ] }
    ] },

    /* ================= inner pages ================= */
    { key: 'pages.about', group: 'pages', title: 'درباره‌ی ما', view: '../about.html', fields: [
      { key: 'image', type: 'image', label: 'عکس بالای صفحه', dark: true },
      { row: [ { key: 'eyebrow', type: 'text', label: 'برچسب کوچک' }, { key: 'title', type: 'text', label: 'تیتر صفحه' } ] },
      { key: 'lead', type: 'textarea', label: 'متن زیر تیتر', rows: 2, hint: RICH_HINT },
      { key: 'introTitle', type: 'text', label: 'تیتر بخش اول' },
      { key: 'paragraphs', type: 'strings', label: 'پاراگراف‌های بخش اول', itemLabel: 'پاراگراف', multiline: true, hint: RICH_HINT },
      { row: [ { key: 'visionTitle', type: 'text', label: 'عنوان کادر اول' }, { key: 'missionTitle', type: 'text', label: 'عنوان کادر دوم' } ] },
      { row: [ { key: 'vision', type: 'textarea', label: 'متن کادر اول (چشم‌انداز)' }, { key: 'mission', type: 'textarea', label: 'متن کادر دوم (مأموریت)' } ] },
      { key: 'pillarsTitle', type: 'text', label: 'تیتر بخش ستون‌ها' },
      { key: 'pillars', type: 'list', label: 'ستون‌ها', itemLabel: 'ستون', titleKey: 'title', template: { title: 'ستون جدید', text: '' }, fields: [
        { key: 'title', type: 'text', label: 'عنوان' }, { key: 'text', type: 'textarea', label: 'توضیح (اختیاری)', rows: 2 }
      ] },
      { key: 'valuesTitle', type: 'text', label: 'تیتر بخش ارزش‌ها' },
      { key: 'values', type: 'list', label: 'ارزش‌ها', itemLabel: 'ارزش', titleKey: 'title', template: { title: 'ارزش جدید', text: '' }, fields: [
        { key: 'title', type: 'text', label: 'عنوان' }, { key: 'text', type: 'textarea', label: 'توضیح', rows: 2 }
      ] }
    ] },

    { key: 'pages.solutions', group: 'pages', title: 'صفحه‌ی خدمات', view: '../solutions.html', intro: 'صفحه‌ی اصلی خدمات. کارت‌های «راهکارهای ویژه» و «تخصص‌ها» خودکار از بخش‌های خودشان ساخته می‌شوند.', fields: [
      { key: 'image', type: 'image', label: 'عکس بالای صفحه', dark: true },
      { row: [ { key: 'eyebrow', type: 'text', label: 'برچسب کوچک' }, { key: 'title', type: 'text', label: 'تیتر صفحه' } ] },
      { key: 'lead', type: 'textarea', label: 'متن زیر تیتر (اختیاری)', rows: 2 },
      { row: [ { key: 'signatureTitle', type: 'text', label: 'تیتر بخش محصولات (راهکارهای ویژه)' }, { key: 'capabilitiesTitle', type: 'text', label: 'تیتر بخش تخصص‌ها' } ] },
      { key: 'products', type: 'group', label: 'اسلایدشوی محصولات', fields: [
        { key: 'enabled', type: 'toggle', label: 'نمایش به‌صورت اسلایدشو (خاموش = کارت‌های ساده)' },
        { key: 'source', type: 'select', label: 'چه چیزهایی در اسلایدشو باشند', options: [
          ['solutions', 'فقط راهکارهای ویژه (FR™، SVP™، FRANCH™ …)'],
          ['both', 'راهکارهای ویژه + تخصص‌ها']
        ], hint: 'عکس، عنوان، خلاصه و خروجی‌های هر اسلاید از بخش «راهکارهای ویژه» (و «تخصص‌ها») خوانده می‌شود؛ ترتیب اسلایدها همان ترتیب آن بخش است. عکس پیشنهادی: ۲۰۰۰ × ۱۶۰۰.' },
        { key: 'eyebrow', type: 'text', label: 'برچسب کوچک بالای تیتر' },
        { key: 'text', type: 'textarea', label: 'متن زیر تیتر (اختیاری)', rows: 2 },
        { row: [ { key: 'interval', type: 'number', label: 'زمان هر اسلاید (ثانیه)', min: 3, max: 30 }, { key: 'autoplay', type: 'toggle', label: 'پخش خودکار' } ] },
        { row: [ { key: 'detailLabel', type: 'text', label: 'متن دکمه‌ی «جزئیات»' }, { key: 'ctaLabel', type: 'text', label: 'متن دکمه‌ی دوم (خالی = بدون دکمه)' } ] },
        { key: 'ctaUrl', type: 'url', label: 'لینک دکمه‌ی دوم' }
      ] },
      { key: 'areasTitle', type: 'text', label: 'تیتر حوزه‌های خدمت' },
      { key: 'areas', type: 'list', label: 'حوزه‌های خدمت', itemLabel: 'حوزه', titleKey: 'title', template: { title: 'حوزه‌ی جدید', text: '', items: [] }, fields: [
        { key: 'title', type: 'text', label: 'عنوان' }, { key: 'text', type: 'textarea', label: 'توضیح', rows: 2 },
        { key: 'items', type: 'strings', label: 'برچسب‌ها', itemLabel: 'برچسب' }
      ] },
      { key: 'painsTitle', type: 'text', label: 'تیتر بخش «این حرف‌ها آشنا نیست؟»' },
      { key: 'painsText', type: 'textarea', label: 'متن زیر تیتر', rows: 2 },
      { key: 'helpLabel', type: 'text', label: 'عنوان «چطور کمک می‌کنیم»' },
      { key: 'pains', type: 'list', label: 'موقعیت‌ها', itemLabel: 'موقعیت', titleKey: 'title', template: { title: 'موقعیت جدید', problem: '', help: '' }, fields: [
        { key: 'title', type: 'text', label: 'عنوان' }, { key: 'problem', type: 'textarea', label: 'شرح مسئله', rows: 3 }, { key: 'help', type: 'textarea', label: 'چطور کمک می‌کنیم', rows: 2 }
      ] },
      { key: 'compareTitle', type: 'text', label: 'تیتر بخش مقایسه' },
      { key: 'compareText', type: 'textarea', label: 'متن بخش مقایسه', rows: 2 },
      { key: 'compareItems', type: 'strings', label: 'نشانه‌ها', itemLabel: 'نشانه', multiline: true }
    ] },

    { key: 'solutionPages', group: 'pages', title: 'راهکارهای ویژه', intro: 'هر آیتم یک صفحه‌ی کامل دارد (مثل FR™، SVP™ و FRANCH™). برای ساختن راهکار جدید «افزودن» را بزنید.', fields: [
      { key: 'items', type: 'list', label: 'راهکارها', itemLabel: 'راهکار', titleKey: 'title', thumbKey: 'image', view: '../solution.html?id=',
        template: { id: 'new-solution', tag: '', title: 'راهکار جدید', summary: '', intro: '', image: '', challenge: '', audience: '', questions: [], approach: [], outputs: [], impacts: [], disclaimer: '', faqs: [], capabilities: [], industries: [], articles: [] },
        fields: [
          { row: [ { key: 'id', type: 'slug', label: 'شناسه (در آدرس صفحه)' }, { key: 'tag', type: 'text', label: 'برچسب (مثل FR™)', ltr: true } ] },
          { key: 'title', type: 'text', label: 'عنوان' },
          { key: 'summary', type: 'textarea', label: 'خلاصه (روی کارت‌ها و زیر تیتر)', rows: 2 },
          { key: 'image', type: 'image', label: 'عکس بالای صفحه', dark: true },
          { key: 'intro', type: 'textarea', label: 'معرفی', rows: 3, hint: RICH_HINT },
          { row: [ { key: 'challenge', type: 'textarea', label: 'چالش' }, { key: 'audience', type: 'textarea', label: 'برای چه سازمان‌هایی مناسب است' } ] },
          { key: 'questions', type: 'strings', label: 'پرسش‌های تشخیصی', itemLabel: 'پرسش' },
          { key: 'approach', type: 'strings', label: 'مراحل رویکرد', itemLabel: 'مرحله' },
          { key: 'outputs', type: 'strings', label: 'خروجی‌ها', itemLabel: 'خروجی' },
          { key: 'impacts', type: 'strings', label: 'اثر موردانتظار', itemLabel: 'اثر' },
          { key: 'disclaimer', type: 'text', label: 'توضیح زیر اثرها' },
          { key: 'faqs', type: 'list', label: 'پرسش‌های متداول', itemLabel: 'پرسش', titleKey: 'q', template: { q: 'پرسش جدید؟', a: '' }, fields: [
            { key: 'q', type: 'text', label: 'پرسش' }, { key: 'a', type: 'textarea', label: 'پاسخ', rows: 3 }
          ] },
          { key: 'capabilities', type: 'refs', label: 'تخصص‌های مرتبط', source: 'capabilityPages.items' },
          { key: 'articles', type: 'refs', label: 'مقالات مرتبط', source: 'articles.items' },
          { key: 'industries', type: 'strings', label: 'صنایع مرتبط', itemLabel: 'صنعت' }
        ] },
      { key: 'detailLabels', type: 'group', label: 'عنوان بخش‌ها در صفحه‌ی راهکار', fields: [
        { row: [ { key: 'challenge', type: 'text', label: 'چالش' }, { key: 'audience', type: 'text', label: 'مخاطب' } ] },
        { row: [ { key: 'questions', type: 'text', label: 'پرسش‌ها' }, { key: 'approach', type: 'text', label: 'رویکرد' } ] },
        { row: [ { key: 'outputs', type: 'text', label: 'خروجی‌ها' }, { key: 'impacts', type: 'text', label: 'اثرها' } ] },
        { row: [ { key: 'faq', type: 'text', label: 'پرسش‌های متداول' }, { key: 'capabilities', type: 'text', label: 'تخصص‌های مرتبط' } ] },
        { key: 'industries', type: 'text', label: 'صنایع مرتبط' }
      ] }
    ] },

    { key: 'capabilityPages', group: 'pages', title: 'تخصص‌ها', intro: 'شش قابلیت یکپارچه؛ هر کدام یک صفحه دارد.', fields: [
      { key: 'items', type: 'list', label: 'تخصص‌ها', itemLabel: 'تخصص', titleKey: 'title', thumbKey: 'image', view: '../capability.html?id=',
        template: { id: 'new-capability', title: 'تخصص جدید', summary: '', body: '', image: '', solutions: [] },
        fields: [
          { row: [ { key: 'id', type: 'slug', label: 'شناسه (در آدرس صفحه)' }, { key: 'title', type: 'text', label: 'عنوان' } ] },
          { key: 'summary', type: 'textarea', label: 'خلاصه', rows: 2 },
          { key: 'image', type: 'image', label: 'عکس بالای صفحه', dark: true },
          { key: 'body', type: 'textarea', label: 'متن صفحه', rows: 6, hint: 'PROSE' },
          { key: 'solutions', type: 'refs', label: 'راهکارهای مرتبط', source: 'solutionPages.items' }
        ] },
      { key: 'relatedTitle', type: 'text', label: 'تیتر «راهکارهای مرتبط»' }
    ] },

    { key: 'articles', group: 'pages', title: 'مقالات', view: '../insights.html', intro: 'مطالب بخش دیدگاه‌ها. اولین مقاله‌ی فهرست، بزرگ‌تر نمایش داده می‌شود.', fields: [
      { key: 'items', type: 'list', label: 'مقالات', itemLabel: 'مقاله', titleKey: 'title', thumbKey: 'image', view: '../article.html?id=',
        template: { id: 'new-article', title: 'مقاله‌ی جدید', excerpt: '', type: 'مقاله', date: '', readTime: '', image: '', body: '' },
        fields: [
          { row: [ { key: 'id', type: 'slug', label: 'شناسه (در آدرس صفحه)' }, { key: 'type', type: 'text', label: 'نوع (مقاله، راهنما…)' } ] },
          { key: 'title', type: 'text', label: 'عنوان' },
          { key: 'excerpt', type: 'textarea', label: 'خلاصه', rows: 2 },
          { row: [ { key: 'date', type: 'text', label: 'تاریخ' }, { key: 'readTime', type: 'text', label: 'زمان مطالعه' } ] },
          { key: 'image', type: 'image', label: 'عکس' },
          { key: 'body', type: 'textarea', label: 'متن کامل', rows: 12, hint: 'PROSE' }
        ] }
    ] },

    { key: 'pages.insights', group: 'pages', title: 'صفحه‌ی دیدگاه‌ها', view: '../insights.html', fields: [
      { key: 'image', type: 'image', label: 'عکس بالای صفحه', dark: true },
      { row: [ { key: 'eyebrow', type: 'text', label: 'برچسب کوچک' }, { key: 'title', type: 'text', label: 'تیتر صفحه' } ] },
      { key: 'lead', type: 'textarea', label: 'متن زیر تیتر', rows: 2 },
      { row: [ { key: 'readMoreLabel', type: 'text', label: 'متن «ادامه‌ی مطلب»' }, { key: 'relatedTitle', type: 'text', label: 'تیتر «بینش‌های مرتبط»' } ] }
    ] },

    { key: 'pages.contact', group: 'pages', title: 'تماس با ما', view: '../contact.html', fields: [
      { key: 'image', type: 'image', label: 'عکس بالای صفحه', dark: true },
      { row: [ { key: 'eyebrow', type: 'text', label: 'برچسب کوچک' }, { key: 'title', type: 'text', label: 'تیتر صفحه' } ] },
      { key: 'lead', type: 'textarea', label: 'متن زیر تیتر', rows: 2 },
      { key: 'channelsTitle', type: 'text', label: 'تیتر کادر راه‌های ارتباطی' },
      { row: [ { key: 'email', type: 'text', label: 'ایمیل', ltr: true }, { key: 'phone', type: 'text', label: 'تلفن', ltr: true } ] },
      { row: [ { key: 'website', type: 'text', label: 'وب‌سایت', ltr: true }, { key: 'linkedin', type: 'url', label: 'لینکدین' } ] },
      { key: 'phoneNote', type: 'text', label: 'توضیح وقتی تلفن خالی است' },
      { key: 'formTitle', type: 'text', label: 'تیتر فرم' },
      { key: 'formIntro', type: 'textarea', label: 'متن بالای فرم', rows: 2 },
      { key: 'industryOptions', type: 'strings', label: 'گزینه‌های «صنعت»', itemLabel: 'گزینه' },
      { key: 'contactMethods', type: 'strings', label: 'گزینه‌های «روش تماس»', itemLabel: 'گزینه' },
      { key: 'consentText', type: 'text', label: 'متن تأیید ذخیره‌ی اطلاعات' },
      { row: [ { key: 'submitLabel', type: 'text', label: 'متن دکمه‌ی ارسال' }, { key: 'notifyEmail', type: 'text', label: 'ایمیل دریافت اعلان (اختیاری)', ltr: true, hint: 'روی هاست واقعی، هر درخواست جدید به این ایمیل هم فرستاده می‌شود (اگر هاست ارسال ایمیل را پشتیبانی کند).' } ] },
      { key: 'successMessage', type: 'text', label: 'پیام بعد از ارسال موفق' }
    ] },

    { key: 'legalPages', group: 'pages', title: 'صفحات ساده', intro: 'صفحه‌های متنی مثل حریم خصوصی و شرایط استفاده. آدرس هر صفحه: page.html?id=شناسه', fields: [
      { key: 'items', type: 'list', label: 'صفحات', itemLabel: 'صفحه', titleKey: 'title', view: '../page.html?id=',
        template: { id: 'new-page', title: 'صفحه‌ی جدید', body: '' },
        fields: [
          { row: [ { key: 'id', type: 'slug', label: 'شناسه (در آدرس صفحه)' }, { key: 'title', type: 'text', label: 'عنوان' } ] },
          { key: 'body', type: 'textarea', label: 'متن', rows: 10, hint: 'PROSE' }
        ] }
    ] },

    { key: 'cta', group: 'pages', title: 'نوار «رزرو جلسه»', intro: 'نوار آبی پایین همه‌ی صفحات داخلی (به جز تماس و صفحات ساده). اگر تیتر خالی باشد نمایش داده نمی‌شود.', fields: [
      { row: [ { key: 'eyebrow', type: 'text', label: 'برچسب کوچک' }, { key: 'title', type: 'text', label: 'تیتر' } ] },
      { key: 'text', type: 'textarea', label: 'متن', rows: 2 },
      { row: [ { key: 'buttonLabel', type: 'text', label: 'متن دکمه' }, { key: 'buttonUrl', type: 'url', label: 'لینک دکمه' } ] }
    ] },

    /* ================= settings ================= */
    { key: 'typography', group: 'settings', title: 'تایپوگرافی (فونت و اندازه)', intro: 'فونت و اندازه‌ی متن‌های کل سایت. برای تغییر یک متنِ خاص، دکمه‌ی «Aa» کنار همان متن را در بخش خودش بزنید.', fields: [
      { row: [
        { key: 'fontBody', type: 'select', label: 'فونت متن‌ها', options: [['vazirmatn', 'وزیرمتن'], ['iransans', 'ایران‌سنس'], ['noto-kufi', 'نوتو کوفی'], ['noto-naskh', 'نوتو نسخ']] },
        { key: 'fontHeading', type: 'select', label: 'فونت تیترها', options: [['', 'مثل متن‌ها'], ['vazirmatn', 'وزیرمتن'], ['iransans', 'ایران‌سنس'], ['noto-kufi', 'نوتو کوفی'], ['noto-naskh', 'نوتو نسخ'], ['lalezar', 'لاله‌زار (نمایشی)']] }
      ] },
      { key: 'scale', type: 'range', label: 'اندازه‌ی کلی همه‌ی متن‌ها', min: 70, max: 150, step: 5, unit: '٪', def: 100 },
      { row: [
        { key: 'headingScale', type: 'range', label: 'اندازه‌ی تیترها', min: 60, max: 160, step: 5, unit: '٪', def: 100 },
        { key: 'bodyScale', type: 'range', label: 'اندازه‌ی متن‌های معمولی', min: 70, max: 150, step: 5, unit: '٪', def: 100 }
      ] },
      { type: 'typoPreview' }
    ] },
    { key: 'site', group: 'settings', title: 'تنظیمات کلی', fields: [
      { row: [ { key: 'title', type: 'text', label: 'عنوان صفحه‌ی اصلی (تب مرورگر و گوگل)' }, { key: 'brandName', type: 'text', label: 'نام برند (در عنوان صفحات داخلی)' } ] },
      { key: 'description', type: 'textarea', label: 'توضیح سایت برای گوگل', rows: 2 },
      { key: 'logo', type: 'image', label: 'لوگوی هدر (روی زمینه‌ی تیره)', dark: true, keepFormat: true, hint: 'PNG با پس‌زمینه‌ی شفاف' },
      { key: 'logoFooter', type: 'image', label: 'لوگوی فوتر (روی زمینه‌ی آبی)', dark: true, keepFormat: true },
      { row: [ { key: 'logoAlt', type: 'text', label: 'متن جایگزین لوگو' }, { key: 'homeUrl', type: 'url', label: 'لینک لوگو' } ] }
    ] }
  ];

  // keep sidebar groups together: home → pages → settings (stable sort keeps order inside a group)
  const GROUP_ORDER = Object.keys(GROUPS);
  SCHEMA.sort((a, b) => GROUP_ORDER.indexOf(a.group || 'home') - GROUP_ORDER.indexOf(b.group || 'home'));

  /* =========================================================
     State & helpers
     ========================================================= */
  let content = null, savedJson = '', csrf = null, current = SCHEMA[0].key, mediaPick = null;
  const $ = (s, r = document) => r.querySelector(s);
  const h = (tag, attrs = {}, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'text') el.textContent = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    kids.flat().forEach(k => k != null && el.append(k.nodeType ? k : document.createTextNode(k)));
    return el;
  };
  const fa = n => String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
  const clone = o => JSON.parse(JSON.stringify(o));
  const imgSrc = u => !u ? '' : /^(https?:|data:|\/)/i.test(u) ? u : '../' + u;

  function toast(msg, kind = '') {
    const t = h('div', { class: 'toast ' + kind, text: msg });
    $('#toasts').append(t);
    setTimeout(() => t.remove(), kind === 'err' ? 6000 : 3000);
  }

  async function api(action, body, method = body ? 'POST' : 'GET') {
    const res = await fetch(`${API}?action=${action}`, {
      method, credentials: 'same-origin',
      headers: Object.assign({ 'Content-Type': 'application/json' }, csrf ? { 'X-CSRF-Token': csrf } : {}),
      // save sends {"content":…} pretty-printed so the stored file stays readable
      body: !body ? undefined : action === 'save' ? '{"content":' + JSON.stringify(body.content, null, 2) + '}' : JSON.stringify(body)
    });
    let data;
    try { data = await res.json(); } catch (e) { throw new Error('پاسخ نامعتبر از سرور (' + res.status + ')'); }
    if (res.status === 401 && action !== 'login') { showAuth(false); }
    if (!res.ok || data.ok === false) throw new Error(data.error || ('خطا ' + res.status));
    return data;
  }

  const isDirty = () => JSON.stringify(content) !== savedJson;
  function markDirty() {
    const d = isDirty();
    $('#dirty').hidden = !d;
    $('#save-btn').disabled = !d;
    liveUpdaters.forEach(fn => fn());
  }

  /* =========================================================
     Auth
     ========================================================= */
  function showAuth(setup) {
    $('#app').hidden = true; $('#auth').hidden = false;
    $('#auth-title').textContent = setup ? 'تعیین رمز عبور مدیر' : 'ورود به پنل مدیریت';
    $('#auth-sub').textContent = setup ? 'اولین ورود است. یک رمز عبور قوی (حداقل ۸ کاراکتر) انتخاب کنید.' : 'برای ویرایش محتوای سایت وارد شوید.';
    $('#pw2-wrap').hidden = !setup;
    $('#pw1').autocomplete = setup ? 'new-password' : 'current-password';
    $('#auth-btn').textContent = setup ? 'ذخیره‌ی رمز و ورود' : 'ورود';
    $('#auth-form').dataset.mode = setup ? 'setup' : 'login';
    $('#pw1').focus();
  }

  $('#auth-form').addEventListener('submit', async e => {
    e.preventDefault();
    const err = $('#auth-error'); err.hidden = true;
    const pw = $('#pw1').value, setup = e.target.dataset.mode === 'setup';
    if (setup && pw !== $('#pw2').value) { err.textContent = 'دو رمز وارد شده یکسان نیستند.'; err.hidden = false; return; }
    $('#auth-btn').disabled = true;
    try {
      const r = await api(setup ? 'setup' : 'login', { password: pw });
      csrf = r.csrf; $('#pw1').value = ''; $('#pw2').value = '';
      await startApp();
    } catch (ex) { err.textContent = ex.message; err.hidden = false; }
    $('#auth-btn').disabled = false;
  });

  $('#logout').addEventListener('click', async () => {
    if (isDirty() && !confirm('تغییرات ذخیره نشده از بین می‌رود. خارج می‌شوید؟')) return;
    try { await api('logout', {}); } catch (e) {}
    csrf = null; savedJson = JSON.stringify(content); showAuth(false);
  });

  /* =========================================================
     App shell
     ========================================================= */
  async function startApp() {
    const res = await fetch('../content/content.json?v=' + Date.now(), { cache: 'no-store' });
    content = await res.json();
    savedJson = JSON.stringify(content);
    $('#auth').hidden = true; $('#app').hidden = false;
    renderNav(); show(current); markDirty();
    api('messages').then(r => updateBadge(r.items)).catch(() => {});
  }

  function renderNav() {
    const nav = $('#side-nav'); nav.innerHTML = '';
    let lastGroup = null, n = 0;
    SCHEMA.forEach(s => {
      const g = s.group || 'home';
      if (g !== lastGroup) { nav.append(h('div', { class: 'side-group', text: GROUPS[g] })); lastGroup = g; n = 0; }
      nav.append(h('button', {
        class: 'side-link' + (s.key === current ? ' active' : ''), 'data-key': s.key,
        onclick: () => { show(s.key); $('#sidebar').classList.remove('open'); }
      }, h('span', { class: 'num', text: fa(++n) }), s.title));
    });
  }

  // "pages.about" → content.pages.about (created if missing)
  function getPath(root, path) {
    return path.split('.').reduce((o, k) => (o[k] = (o[k] && typeof o[k] === 'object') ? o[k] : {}), root);
  }

  function show(key) {
    current = key;
    document.querySelectorAll('.side-link').forEach(b => b.classList.toggle('active', b.dataset.key === key || b.dataset.tool === key));
    const box = $('#content'); box.innerHTML = '';
    headUpdaters.clear();
    liveUpdaters.clear();
    window.scrollTo(0, 0);
    const viewBtn = $('#view-btn');
    viewBtn.href = '../';
    if (key === 'backups') return renderBackups(box);
    if (key === 'password') return renderPassword(box);
    if (key === 'messages') return renderMessages(box);
    const sec = SCHEMA.find(s => s.key === key);
    $('#page-title').textContent = sec.title;
    viewBtn.href = sec.view || '../';
    const obj = getPath(content, key);
    const panel = h('div', { class: 'panel' });
    if (sec.intro) panel.append(h('p', { class: 'panel-intro', text: sec.intro }));
    sec.fields.forEach(f => panel.append(renderField(obj, f)));
    box.append(panel);
  }

  /* =========================================================
     Field renderers
     ========================================================= */
  function renderField(obj, f) {
    if (f.row) return h('div', { class: 'grid-2' }, f.row.map(x => renderField(obj, x)));
    switch (f.type) {
      case 'toggle': {
        const input = h('input', { type: 'checkbox' }); input.checked = obj[f.key] !== false;
        input.addEventListener('change', () => { obj[f.key] = input.checked; markDirty(); });
        return h('div', { class: 'field' }, h('label', { class: 'toggle' }, input, h('i'), f.label));
      }
      case 'number': {
        const input = h('input', { type: 'number', min: f.min, max: f.max, value: obj[f.key] ?? '' });
        input.addEventListener('input', () => { obj[f.key] = Number(input.value) || 0; markDirty(); });
        return wrap(f, input);
      }
      case 'textarea': {
        const input = h('textarea', { rows: f.rows || 4 }); input.value = obj[f.key] ?? '';
        const ctl = canStyle(f) ? styleCtl(obj, f.key, () => input.value) : null;
        input.addEventListener('input', () => { obj[f.key] = input.value; markDirty(); refreshHeads(); ctl && ctl.refresh(); });
        return wrap(f, input, ctl);
      }
      case 'url':
      case 'text': {
        const input = h('input', { type: 'text', class: (f.type === 'url' || f.ltr) ? 'ltr' : null, value: obj[f.key] ?? '', placeholder: f.type === 'url' ? 'https://… یا #بخش' : null });
        const ctl = canStyle(f) ? styleCtl(obj, f.key, () => input.value) : null;
        input.addEventListener('input', () => { obj[f.key] = input.value; markDirty(); refreshHeads(); ctl && ctl.refresh(); });
        return wrap(f, input, ctl);
      }
      case 'range': {
        const val = () => Number(obj[f.key]) || f.def;
        const out = h('b', { class: 'range-val' });
        const input = h('input', { type: 'range', min: f.min, max: f.max, step: f.step || 1 });
        const sync = () => { input.value = val(); out.textContent = fa(val()) + (f.unit || ''); };
        input.addEventListener('input', () => { obj[f.key] = Number(input.value); sync(); markDirty(); });
        const reset = h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => { obj[f.key] = f.def; sync(); markDirty(); } }, 'پیش‌فرض');
        sync();
        return h('div', { class: 'field' }, h('span', { class: 'field-label', text: f.label }), h('div', { class: 'range-row' }, input, out, reset));
      }
      case 'typoPreview': {
        const box = h('div', { class: 'typo-preview' },
          h('span', { class: 'tp-eyebrow', text: 'پیش‌نمایش' }),
          h('div', { class: 'tp-h1', text: 'رشد پایدار، از طریق ایجاد یک سازمان توانمند' }),
          h('div', { class: 'tp-h2', text: 'ما مسئله را می‌شناسیم.' }),
          h('p', { class: 'tp-p', text: 'ریتیل سلوشنز به برندها کمک می‌کند از کسب‌وکارهایی فروش‌محور و وابسته به افراد، به سازمان‌های ریتیل حرفه‌ای منسجم و آماده‌ی رشد تبدیل شوند.' }));
        const upd = () => {
          const t = obj, s = (Number(t.scale) || 100) / 100, hs = (Number(t.headingScale) || 100) / 100, bs = (Number(t.bodyScale) || 100) / 100;
          const body = FONT_CSS[t.fontBody] || FONT_CSS.vazirmatn, head = FONT_CSS[t.fontHeading] || body;
          box.querySelector('.tp-h1').style.cssText = `font-family:${head};font-size:${40 * s * hs}px`;
          box.querySelector('.tp-h2').style.cssText = `font-family:${head};font-size:${28 * s * hs}px`;
          box.querySelector('.tp-p').style.cssText = `font-family:${body};font-size:${17 * s * bs}px`;
          box.querySelector('.tp-eyebrow').style.cssText = `font-family:${body}`;
        };
        liveUpdaters.add(upd); upd();
        return h('div', { class: 'field' }, h('span', { class: 'field-label', text: 'پیش‌نمایش (اندازه‌ی دسکتاپ)' }), box,
          h('small', { class: 'hint', text: 'برای دیدن نتیجه روی کل سایت، «پیش‌نمایش تغییرات» را بزنید.' }));
      }
      case 'image': return renderImage(obj, f);
      case 'group': {
        obj[f.key] = obj[f.key] || {};
        return h('div', { class: 'group' }, h('span', { class: 'field-label', text: f.label }), f.fields.map(x => renderField(obj[f.key], x)));
      }
      case 'order': return renderOrder(obj, f);
      case 'select': {
        const sel = h('select', {}, f.options.map(([v, t]) => h('option', { value: v, text: t })));
        sel.value = obj[f.key] ?? f.options[0][0];
        sel.addEventListener('change', () => { obj[f.key] = sel.value; markDirty(); });
        return wrap(f, sel);
      }
      case 'slug': {
        const input = h('input', { type: 'text', class: 'ltr', value: obj[f.key] ?? '', placeholder: 'my-page' });
        input.addEventListener('input', () => {
          const clean = input.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+/, '');
          if (clean !== input.value) input.value = clean;
          obj[f.key] = clean; markDirty();
        });
        input.addEventListener('blur', () => { input.value = obj[f.key] = String(obj[f.key] || '').replace(/-+$/, ''); });
        return wrap(Object.assign({ hint: 'فقط حروف انگلیسی کوچک، عدد و خط تیره. با تغییر آن، آدرس صفحه هم عوض می‌شود.' }, f), input);
      }
      case 'refs': {
        obj[f.key] = Array.isArray(obj[f.key]) ? obj[f.key] : [];
        const source = f.source.split('.').reduce((o, k) => (o || {})[k], content) || [];
        const box = h('div', { class: 'refs' });
        if (!source.length) box.append(h('span', { class: 'muted', text: 'موردی برای انتخاب وجود ندارد.' }));
        source.forEach(item => {
          const cb = h('input', { type: 'checkbox' }); cb.checked = obj[f.key].includes(item.id);
          cb.addEventListener('change', () => {
            const arr = obj[f.key].filter(x => x !== item.id);
            if (cb.checked) arr.push(item.id);
            obj[f.key] = arr; markDirty();
          });
          box.append(h('label', { class: 'ref' }, cb, h('span', { text: (item.tag ? item.tag + ' — ' : '') + (item.title || item.id) })));
        });
        return h('div', { class: 'field' }, h('span', { class: 'field-label', text: f.label }), box);
      }
      case 'list': return renderList(obj, f);
      case 'strings': return renderStrings(obj, f);
    }
    return h('div');
  }

  function wrap(f, input, ctl) {
    const hint = f.hint === 'PROSE' ? PROSE_HINT : f.hint;
    if (!ctl) return h('label', { class: 'field' }, h('span', { text: f.label }), input, hint ? h('small', { class: 'hint', text: hint }) : null);
    return h('div', { class: 'field' },
      h('div', { class: 'field-head' }, h('span', { class: 'field-label', text: f.label }), ctl.btn),
      input, hint ? h('small', { class: 'hint', text: hint }) : null, ctl.panel);
  }

  /* ---------- per-text style («Aa»): font, size, weight, colour, alignment — saved in obj._style[key] ---------- */
  const FONT_CSS = {
    vazirmatn: '"Vazirmatn", Tahoma, sans-serif', iransans: '"IRANSansX", "Vazirmatn", sans-serif',
    'noto-kufi': '"Noto Kufi Arabic", "Vazirmatn", sans-serif', 'noto-naskh': '"Noto Naskh Arabic", "Vazirmatn", serif',
    lalezar: '"Lalezar", "Vazirmatn", sans-serif'
  };
  const STYLE_FONTS = [['', 'پیش‌فرض سایت'], ['vazirmatn', 'وزیرمتن'], ['iransans', 'ایران‌سنس'], ['noto-kufi', 'نوتو کوفی'], ['noto-naskh', 'نوتو نسخ'], ['lalezar', 'لاله‌زار']];
  const STYLE_WEIGHTS = [['', 'پیش‌فرض'], ['300', 'نازک'], ['400', 'معمولی'], ['500', 'متوسط'], ['600', 'نیمه‌ضخیم'], ['700', 'ضخیم'], ['800', 'خیلی ضخیم']];
  const STYLE_ALIGNS = [['', 'پیش‌فرض'], ['right', 'راست‌چین'], ['center', 'وسط‌چین'], ['left', 'چپ‌چین'], ['justify', 'تراز']];
  const NO_STYLE_KEYS = ['imageAlt', 'brandName', 'logoAlt', 'id', 'date', 'readTime'];
  const liveUpdaters = new Set();
  const canStyle = f => !f.ltr && !f.noStyle && f.type !== 'url' && current !== 'site' && !NO_STYLE_KEYS.includes(f.key);

  function styleCtl(obj, key, getText) {
    const get = () => (obj._style && obj._style[key]) || {};
    const set = (prop, val) => {
      const s = Object.assign({}, get());
      if (val === '' || val == null || (prop === 'size' && Number(val) === 100)) delete s[prop]; else s[prop] = val;
      obj._style = obj._style || {};
      if (Object.keys(s).length) obj._style[key] = s; else delete obj._style[key];
      if (!Object.keys(obj._style).length) delete obj._style;
      markDirty(); refresh();
    };
    const sel = (opts, prop) => {
      const el = h('select', {}, opts.map(([v, t]) => h('option', { value: v, text: t })));
      el.addEventListener('change', () => set(prop, el.value));
      return el;
    };
    const font = sel(STYLE_FONTS, 'font'), weight = sel(STYLE_WEIGHTS, 'weight'), align = sel(STYLE_ALIGNS, 'align');
    const size = h('input', { type: 'range', min: 50, max: 250, step: 5 });
    const sizeOut = h('b', { class: 'range-val' });
    size.addEventListener('input', () => set('size', Number(size.value)));
    const color = h('input', { type: 'color' });
    const colorOn = h('input', { type: 'checkbox' });
    color.addEventListener('input', () => { colorOn.checked = true; set('color', color.value); });
    colorOn.addEventListener('change', () => set('color', colorOn.checked ? color.value : ''));
    const preview = h('div', { class: 'aa-preview' });
    const bgBtn = h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => preview.classList.toggle('dark') }, 'زمینه‌ی تیره/روشن');
    const btn = h('button', { type: 'button', class: 'aa-btn', title: 'فونت و اندازه‌ی همین متن' }, 'Aa');
    const panel = h('div', { class: 'aa-panel', hidden: true },
      h('div', { class: 'aa-grid' },
        h('label', {}, h('span', { text: 'فونت' }), font),
        h('label', {}, h('span', { text: 'ضخامت' }), weight),
        h('label', {}, h('span', { text: 'چینش' }), align),
        h('label', {}, h('span', { text: 'رنگ' }), h('span', { class: 'aa-color' }, colorOn, color, h('small', { text: 'رنگ دلخواه' })))),
      h('div', { class: 'aa-size' }, h('span', { text: 'اندازه' }), size, sizeOut,
        h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => set('size', 100) }, '۱۰۰٪')),
      h('div', { class: 'aa-preview-wrap' }, preview),
      h('div', { class: 'aa-actions' }, bgBtn,
        h('button', { type: 'button', class: 'btn btn-danger btn-sm', onclick: () => { delete (obj._style || {})[key]; if (obj._style && !Object.keys(obj._style).length) delete obj._style; markDirty(); refresh(); } }, 'برگرداندن به حالت پیش‌فرض')),
      h('small', { class: 'hint', text: 'اندازه نسبت به اندازه‌ی فعلی همین متن در سایت است (۱۰۰٪ = بدون تغییر). پیش‌نمایش تقریبی است؛ برای دیدن روی صفحه «پیش‌نمایش تغییرات» را بزنید.' }));
    function refresh() {
      const s = get();
      font.value = s.font || ''; weight.value = s.weight || ''; align.value = s.align || '';
      size.value = s.size || 100; sizeOut.textContent = fa(s.size || 100) + '٪';
      colorOn.checked = !!s.color; if (s.color) color.value = s.color;
      btn.classList.toggle('on', Object.keys(s).length > 0);
      if (panel.hidden) return;
      const text = String(getText() || '').replace(/\*\*/g, '').slice(0, 400) || 'نمونه‌ی متن';
      preview.textContent = text;
      preview.style.cssText = `font-family:${FONT_CSS[s.font] || 'inherit'};font-weight:${s.weight || 'inherit'};text-align:${s.align || 'right'};${s.color ? 'color:' + s.color + ';' : ''}font-size:${18 * (s.size || 100) / 100}px`;
    }
    btn.addEventListener('click', () => { panel.hidden = !panel.hidden; btn.classList.toggle('open', !panel.hidden); refresh(); });
    refresh();
    return { btn, panel, refresh };
  }

  /* ---------- image ---------- */
  function renderImage(obj, f) {
    const prev = h('div', { class: 'img-preview' + (f.dark ? ' dark' : '') });
    const input = h('input', { type: 'text', class: 'ltr', placeholder: 'آدرس تصویر یا آپلود کنید' });
    const file = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp,image/gif', hidden: true });
    const set = v => {
      obj[f.key] = v; input.value = v || '';
      prev.style.backgroundImage = v ? `url("${imgSrc(v).replace(/"/g, '%22')}")` : '';
      prev.classList.toggle('has-img', !!v); prev.textContent = v ? '' : 'بدون تصویر';
      if (f.dark) prev.style.backgroundSize = /logo/i.test(f.key) ? 'contain' : 'cover';
    };
    set(obj[f.key]);
    input.addEventListener('change', () => { set(input.value.trim()); markDirty(); refreshHeads(); });
    const doUpload = async fileObj => {
      if (!fileObj) return;
      const busy = h('div', { class: 'busy', text: 'در حال آپلود…' }); prev.append(busy);
      try {
        const { name, data } = await prepareImage(fileObj, f.keepFormat);
        const r = await api('upload', { name, data });
        set(r.url); markDirty(); refreshHeads(); toast('تصویر آپلود شد', 'ok');
      } catch (e) { toast(e.message, 'err'); busy.remove(); }
    };
    file.addEventListener('change', () => { doUpload(file.files[0]); file.value = ''; });
    prev.addEventListener('dragover', e => { e.preventDefault(); prev.classList.add('drag'); });
    prev.addEventListener('dragleave', () => prev.classList.remove('drag'));
    prev.addEventListener('drop', e => { e.preventDefault(); prev.classList.remove('drag'); doUpload(e.dataTransfer.files[0]); });

    return h('div', { class: 'field' },
      h('span', { class: 'field-label', text: f.label }),
      h('div', { class: 'img-field' }, prev, h('div', {},
        input,
        h('div', { class: 'img-actions' },
          h('button', { type: 'button', class: 'btn btn-primary btn-sm', onclick: () => file.click() }, 'آپلود تصویر'),
          h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => openMedia(v => { set(v); markDirty(); refreshHeads(); }) }, 'انتخاب از کتابخانه'),
          obj[f.key] !== undefined ? h('button', { type: 'button', class: 'btn btn-danger btn-sm', onclick: () => { set(''); markDirty(); refreshHeads(); } }, 'حذف') : null,
          file),
        h('small', { class: 'hint', text: (f.hint ? f.hint + ' ' : '') + 'می‌توانید عکس را روی کادر پیش‌نمایش بکشید و رها کنید.' })
      )));
  }

  // resize big photos in the browser before upload (max 2400px) to keep the site fast
  function prepareImage(fileObj, keepFormat) {
    return new Promise((resolve, reject) => {
      if (!/^image\/(jpeg|png|webp|gif)$/.test(fileObj.type)) return reject(new Error('فقط تصاویر JPG، PNG، WEBP و GIF مجاز هستند.'));
      const toB64 = blob => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.onerror = no; r.readAsDataURL(blob); });
      const MAX = 2400;
      if (fileObj.type === 'image/gif') return toB64(fileObj).then(data => resolve({ name: fileObj.name, data }), reject);
      const img = new Image(), url = URL.createObjectURL(fileObj);
      img.onload = async () => {
        URL.revokeObjectURL(url);
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        if (scale === 1 && (fileObj.size < 1.5 * 1024 * 1024 || keepFormat)) return resolve({ name: fileObj.name, data: await toB64(fileObj) });
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        const type = fileObj.type === 'image/jpeg' ? 'image/jpeg' : (keepFormat ? fileObj.type : 'image/webp');
        c.toBlob(async blob => {
          if (!blob) return reject(new Error('پردازش تصویر ممکن نشد.'));
          resolve({ name: fileObj.name, data: await toB64(blob) });
        }, type, 0.85);
      };
      img.onerror = () => reject(new Error('فایل تصویر قابل خواندن نیست.'));
      img.src = url;
    });
  }

  /* ---------- list of objects ---------- */
  const openItems = new WeakSet();
  const headUpdaters = new Set();
  function refreshHeads() { headUpdaters.forEach(fn => fn()); }

  function renderList(obj, f) {
    obj[f.key] = Array.isArray(obj[f.key]) ? obj[f.key] : [];
    const arr = obj[f.key];
    const wrapEl = h('div', { class: 'field' }, h('span', { class: 'field-label', text: f.label }));
    if (f.hint) wrapEl.append(h('small', { class: 'hint', text: f.hint, style: 'margin:-2px 0 10px' }));
    const listEl = h('div', { class: 'list' });
    wrapEl.append(listEl);

    const draw = () => {
      listEl.innerHTML = '';
      arr.forEach((item, i) => {
        const titleEl = h('span', { class: 'title' });
        const thumb = f.thumbKey ? h('span', { class: 'thumb' }) : null;
        const upd = () => {
          titleEl.textContent = String(item[f.titleKey] || '').replace(/\*\*/g, '').split('\n')[0] || `${f.itemLabel} ${fa(i + 1)}`;
          if (thumb) thumb.style.backgroundImage = item[f.thumbKey] ? `url("${imgSrc(item[f.thumbKey])}")` : '';
        };
        upd(); headUpdaters.add(upd);
        const stop = fn => e => { e.stopPropagation(); fn(); };
        const tools = h('span', { class: 'tools' },
          f.view && item.id ? h('a', { class: 'icon-btn', title: 'مشاهده‌ی صفحه (نسخه‌ی ذخیره‌شده)', href: f.view + encodeURIComponent(item.id), target: '_blank', rel: 'noopener', onclick: e => e.stopPropagation() }, '↗') : null,
          h('button', { type: 'button', class: 'icon-btn', title: 'بالا', disabled: i === 0, onclick: stop(() => move(i, -1)) }, '↑'),
          h('button', { type: 'button', class: 'icon-btn', title: 'پایین', disabled: i === arr.length - 1, onclick: stop(() => move(i, 1)) }, '↓'),
          f.fixed ? null : h('button', { type: 'button', class: 'icon-btn', title: 'کپی', onclick: stop(() => { arr.splice(i + 1, 0, clone(item)); openItems.add(arr[i + 1]); changed(); }) }, '⧉'),
          f.fixed ? null : h('button', { type: 'button', class: 'icon-btn danger', title: 'حذف', disabled: f.min && arr.length <= f.min, onclick: stop(() => {
            if (confirm(`این ${f.itemLabel} حذف شود؟`)) { arr.splice(i, 1); changed(); }
          }) }, '✕'));
        const body = h('div', { class: 'item-body' }, f.fields.map(x => renderField(item, x)));
        const el = h('div', { class: 'item' + (openItems.has(item) ? ' open' : '') },
          h('div', { class: 'item-head', onclick: () => { el.classList.toggle('open'); el.classList.contains('open') ? openItems.add(item) : openItems.delete(item); } },
            h('span', { class: 'idx', text: fa(i + 1) }), thumb, titleEl, tools, h('span', { class: 'caret', text: '▾' })),
          body);
        listEl.append(el);
      });
      if (!f.fixed) listEl.append(h('div', { class: 'list-add' },
        h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => {
          const n = clone(f.template || {}); arr.push(n); openItems.add(n); changed();
        } }, `+ افزودن ${f.itemLabel}`)));
    };
    const move = (i, d) => { const [x] = arr.splice(i, 1); arr.splice(i + d, 0, x); changed(); };
    const changed = () => { markDirty(); draw(); };
    draw();
    return wrapEl;
  }

  /* ---------- section order (drag, arrows, show/hide) ---------- */
  function renderOrder(obj, f) {
    const keys = Object.keys(BLOCK_LABELS);
    const arr = (Array.isArray(obj[f.key]) ? obj[f.key] : []).filter(s => keys.includes(s.key));
    keys.forEach(k => { if (!arr.some(s => s.key === k)) arr.push({ key: k, visible: true }); });
    obj[f.key] = arr;   // normalised copy; identical JSON when nothing was missing, so it doesn't mark the page dirty

    const listEl = h('div', { class: 'order-list' });
    const fixedRow = text => h('div', { class: 'order-row fixed' }, h('span', { class: 'grip', text: '🔒' }), h('span', { class: 'name', text }));
    let dragFrom = null;

    const draw = () => {
      listEl.innerHTML = '';
      listEl.append(fixedRow('اسلایدشو — همیشه اول'));
      arr.forEach((s, i) => {
        const vis = h('input', { type: 'checkbox' }); vis.checked = s.visible !== false;
        vis.addEventListener('change', () => { s.visible = vis.checked; row.classList.toggle('off', !vis.checked); markDirty(); });
        const row = h('div', { class: 'order-row' + (s.visible === false ? ' off' : ''), draggable: 'true' },
          h('span', { class: 'grip', title: 'بکشید', text: '⋮⋮' }),
          h('span', { class: 'idx', text: fa(i + 1) }),
          h('span', { class: 'name', text: BLOCK_LABELS[s.key] }),
          h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => show(s.key) }, 'ویرایش محتوا'),
          h('label', { class: 'toggle' }, vis, h('i'), 'نمایش'),
          h('span', { class: 'tools' },
            h('button', { type: 'button', class: 'icon-btn', title: 'بالا', disabled: i === 0, onclick: () => move(i, i - 1) }, '↑'),
            h('button', { type: 'button', class: 'icon-btn', title: 'پایین', disabled: i === arr.length - 1, onclick: () => move(i, i + 1) }, '↓')));
        row.addEventListener('dragstart', e => { dragFrom = i; row.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(i)); });
        row.addEventListener('dragend', () => { row.classList.remove('dragging'); listEl.querySelectorAll('.drop').forEach(x => x.classList.remove('drop')); });
        row.addEventListener('dragover', e => { e.preventDefault(); row.classList.add('drop'); });
        row.addEventListener('dragleave', () => row.classList.remove('drop'));
        row.addEventListener('drop', e => { e.preventDefault(); if (dragFrom !== null && dragFrom !== i) move(dragFrom, i); dragFrom = null; });
        listEl.append(row);
      });
      listEl.append(fixedRow('فوتر — همیشه آخر'));
    };
    const move = (from, to) => { const [x] = arr.splice(from, 1); arr.splice(to, 0, x); markDirty(); draw(); };
    draw();
    return h('div', { class: 'field' }, listEl);
  }

  /* ---------- list of strings ---------- */
  function renderStrings(obj, f) {
    obj[f.key] = Array.isArray(obj[f.key]) ? obj[f.key] : [];
    const arr = obj[f.key];
    // one «Aa» style for all items of the list
    const ctl = canStyle(Object.assign({}, f, { type: 'text' })) ? styleCtl(obj, f.key, () => arr.filter(Boolean).join('\n')) : null;
    const wrapEl = h('div', { class: 'field' }, h('div', { class: 'field-head' }, h('span', { class: 'field-label', text: f.label }), ctl ? ctl.btn : null));
    if (ctl) wrapEl.append(ctl.panel);
    const listEl = h('div', { class: 'list' });
    wrapEl.append(listEl);
    if (f.hint) wrapEl.append(h('small', { class: 'hint', text: f.hint }));
    const draw = () => {
      listEl.innerHTML = '';
      arr.forEach((val, i) => {
        const input = f.multiline ? h('textarea', { rows: 3 }) : h('input', { type: 'text' });
        input.value = val;
        input.addEventListener('input', () => { arr[i] = input.value; markDirty(); });
        listEl.append(h('div', { class: 'str-row' }, input, h('span', { class: 'tools' },
          h('button', { type: 'button', class: 'icon-btn', title: 'بالا', disabled: i === 0, onclick: () => move(i, -1) }, '↑'),
          h('button', { type: 'button', class: 'icon-btn', title: 'پایین', disabled: i === arr.length - 1, onclick: () => move(i, 1) }, '↓'),
          h('button', { type: 'button', class: 'icon-btn danger', title: 'حذف', onclick: () => { arr.splice(i, 1); changed(); } }, '✕'))));
      });
      listEl.append(h('div', {}, h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => { arr.push(''); changed(); } }, `+ افزودن ${f.itemLabel}`)));
    };
    const move = (i, d) => { const [x] = arr.splice(i, 1); arr.splice(i + d, 0, x); changed(); };
    const changed = () => { markDirty(); draw(); };
    draw();
    return wrapEl;
  }

  /* =========================================================
     Media library
     ========================================================= */
  async function openMedia(onPick) {
    mediaPick = onPick;
    const grid = $('#media-grid'); grid.innerHTML = '<div class="media-empty">در حال بارگذاری…</div>';
    $('#media-modal').hidden = false;
    try {
      const r = await api('media');
      grid.innerHTML = '';
      if (!r.items.length) grid.innerHTML = '<div class="media-empty">هنوز تصویری آپلود نشده است.</div>';
      r.items.forEach(it => grid.append(h('button', { type: 'button', title: it.url, style: `background-image:url("../${it.url}")`, onclick: () => { mediaPick && mediaPick(it.url); closeMedia(); } })));
    } catch (e) { grid.innerHTML = ''; grid.append(h('div', { class: 'media-empty', text: e.message })); }
  }
  function closeMedia() { $('#media-modal').hidden = true; mediaPick = null; }
  $('#media-modal').addEventListener('click', e => { if (e.target.id === 'media-modal' || e.target.closest('[data-close]')) closeMedia(); });

  /* =========================================================
     Tools: backups & password
     ========================================================= */
  async function renderBackups(box) {
    $('#page-title').textContent = 'نسخه‌های پشتیبان';
    const panel = h('div', { class: 'panel' }, h('p', { class: 'panel-intro', text: 'قبل از هر ذخیره، نسخه‌ی قبلی سایت به‌صورت خودکار نگه داشته می‌شود (۵۰ نسخه‌ی آخر). با «بازگردانی» سایت به همان نسخه برمی‌گردد.' }));
    box.append(panel);
    try {
      const r = await api('backups');
      if (!r.items.length) { panel.append(h('p', { class: 'muted', text: 'هنوز نسخه‌ی پشتیبانی وجود ندارد.' })); return; }
      const fmt = t => new Date(t * 1000).toLocaleString('fa-IR', { dateStyle: 'medium', timeStyle: 'short' });
      panel.append(h('table', { class: 'table' },
        h('tr', {}, h('th', { text: 'تاریخ' }), h('th', { text: 'حجم' }), h('th')),
        r.items.map(it => h('tr', {},
          h('td', { text: fmt(it.time) }),
          h('td', { text: fa(Math.round(it.size / 1024)) + ' کیلوبایت' }),
          h('td', { style: 'text-align:left' }, h('button', { class: 'btn btn-ghost btn-sm', onclick: async () => {
            if (!confirm('سایت به این نسخه برگردد؟ نسخه‌ی فعلی هم پشتیبان‌گیری می‌شود.')) return;
            try { await api('restore', { file: it.file }); toast('نسخه بازگردانی شد', 'ok'); await startApp(); show('backups'); }
            catch (e) { toast(e.message, 'err'); }
          } }, 'بازگردانی'))))));
    } catch (e) { panel.append(h('p', { class: 'form-error', text: e.message })); }
  }

  const MSG_LABELS = { company: 'برند', jobTitle: 'سمت', mobile: 'شماره تماس', email: 'ایمیل', industry: 'صنعت', branches: 'تعداد شعب', city: 'شهر', preferredContactMethod: 'روش تماس', preferredContactTime: 'زمان تماس', primaryChallenge: 'چالش اصلی' };
  async function renderMessages(box) {
    $('#page-title').textContent = 'پیام‌های فرم تماس';
    const panel = h('div', { class: 'panel' }, h('p', { class: 'panel-intro', text: 'درخواست‌هایی که از صفحه‌ی «تماس با ما» ارسال شده‌اند. جدیدترین‌ها بالا هستند.' }));
    box.append(panel);
    let items;
    try { items = (await api('messages')).items; } catch (e) { panel.append(h('p', { class: 'form-error', text: e.message })); return; }
    updateBadge(items);
    if (!items.length) { panel.append(h('p', { class: 'muted', text: 'هنوز پیامی دریافت نشده است.' })); return; }
    const fmt = t => new Date(t * 1000).toLocaleString('fa-IR', { dateStyle: 'medium', timeStyle: 'short' });
    const listEl = h('div', { class: 'list' }); panel.append(listEl);
    items.forEach(m => {
      const rows = Object.keys(MSG_LABELS).filter(k => m[k]).map(k => {
        let val = m[k];
        const v = k === 'mobile' ? h('a', { href: 'tel:' + val.replace(/[^\d+۰-۹]/g, ''), class: 'ltr-text', text: val })
          : k === 'email' ? h('a', { href: 'mailto:' + val, class: 'ltr-text', text: val }) : h('span', { text: val });
        return h('div', { class: 'msg-row' }, h('b', { text: MSG_LABELS[k] }), v);
      });
      const el = h('div', { class: 'item msg' + (m.read ? '' : ' unread') },
        h('div', { class: 'item-head', onclick: async () => {
          el.classList.toggle('open');
          if (!m.read && el.classList.contains('open')) {
            try { await api('message-update', { id: m.id, read: true }); m.read = true; el.classList.remove('unread'); updateBadge(items); } catch (e) {}
          }
        } },
          h('span', { class: 'dot' }),
          h('span', { class: 'title', text: `${m.fullName} — ${m.company}` }),
          h('span', { class: 'muted', style: 'font-size:12px;white-space:nowrap', text: fmt(m.time) }),
          h('span', { class: 'caret', text: '▾' })),
        h('div', { class: 'item-body' }, rows,
          h('div', { class: 'img-actions', style: 'margin-top:14px' },
            h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: async () => {
              try { await api('message-update', { id: m.id, read: !m.read }); m.read = !m.read; el.classList.toggle('unread', !m.read); updateBadge(items); toast(m.read ? 'خوانده شد' : 'خوانده‌نشده شد', 'ok'); } catch (e) { toast(e.message, 'err'); }
            } }, 'تغییر وضعیت خوانده/نخوانده'),
            h('button', { type: 'button', class: 'btn btn-danger btn-sm', onclick: async () => {
              if (!confirm('این پیام حذف شود؟')) return;
              try { await api('message-update', { id: m.id, delete: true }); items.splice(items.indexOf(m), 1); el.remove(); updateBadge(items); toast('پیام حذف شد', 'ok'); } catch (e) { toast(e.message, 'err'); }
            } }, 'حذف'))));
      listEl.append(el);
    });
  }
  function updateBadge(items) {
    const n = items.filter(m => !m.read).length, b = $('#msg-badge');
    b.textContent = fa(n); b.hidden = !n;
  }

  function renderPassword(box) {
    $('#page-title').textContent = 'تغییر رمز عبور';
    const cur = h('input', { type: 'password', autocomplete: 'current-password' });
    const n1 = h('input', { type: 'password', autocomplete: 'new-password' });
    const n2 = h('input', { type: 'password', autocomplete: 'new-password' });
    const form = h('form', { class: 'panel', style: 'max-width:460px', onsubmit: async e => {
      e.preventDefault();
      if (n1.value !== n2.value) return toast('دو رمز جدید یکسان نیستند.', 'err');
      try { await api('password', { current: cur.value, next: n1.value }); toast('رمز عبور تغییر کرد', 'ok'); form.reset(); }
      catch (ex) { toast(ex.message, 'err'); }
    } },
      wrap({ label: 'رمز فعلی' }, cur), wrap({ label: 'رمز جدید', hint: 'حداقل ۸ کاراکتر' }, n1), wrap({ label: 'تکرار رمز جدید' }, n2),
      h('button', { class: 'btn btn-primary', type: 'submit' }, 'تغییر رمز'));
    box.append(form);
  }
  document.querySelectorAll('[data-tool]').forEach(b => b.addEventListener('click', () => { show(b.dataset.tool); $('#sidebar').classList.remove('open'); }));

  /* =========================================================
     Save / preview
     ========================================================= */
  async function save() {
    if (!isDirty()) return;
    const btn = $('#save-btn'); btn.disabled = true; btn.textContent = 'در حال ذخیره…';
    try {
      await api('save', { content });
      savedJson = JSON.stringify(content);
      toast('ذخیره شد و روی سایت منتشر شد', 'ok');
    } catch (e) { toast(e.message, 'err'); }
    btn.textContent = 'ذخیره و انتشار'; markDirty();
  }
  $('#save-btn').addEventListener('click', save);
  document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); } });
  $('#preview-btn').addEventListener('click', () => {
    try { localStorage.setItem('rs_preview_content', JSON.stringify(content)); } catch (e) { return toast('پیش‌نمایش در این مرورگر ممکن نیست.', 'err'); }
    window.open('../index.html?preview=1', 'rs_preview');
  });
  window.addEventListener('beforeunload', e => { if (content && isDirty()) { e.preventDefault(); e.returnValue = ''; } });
  $('#menu-btn').addEventListener('click', () => $('#sidebar').classList.toggle('open'));

  /* =========================================================
     Boot
     ========================================================= */
  (async () => {
    try {
      const s = await api('status');
      if (s.authenticated) { csrf = s.csrf; await startApp(); }
      else showAuth(s.needsSetup);
    } catch (e) {
      document.body.innerHTML = '<div class="auth"><div class="auth-card"><h1>اتصال به سرور برقرار نشد</h1><p class="muted" style="margin-top:12px">پنل مدیریت باید روی هاست با PHP یا با سرور محلی (tools/dev-server.ps1) اجرا شود.</p></div></div>';
    }
  })();
})();
