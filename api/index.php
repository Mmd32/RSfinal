<?php
/**
 * Retail Solutions — content API for the admin panel (/admin).
 * Requires PHP 7.4+ on any normal host (cPanel / DirectAdmin / …). No database.
 *
 * Files it manages:
 *   content/content.json      the published site content
 *   content/backups/*.json    automatic backup before each save (last 50 kept)
 *   uploads/                  images uploaded from the admin panel
 *   api/data/auth.json        admin password hash (PBKDF2-SHA256)
 *
 * The local dev server (tools/dev-server.ps1) implements the same API for testing on Windows.
 */

declare(strict_types=1);

const ROOT         = __DIR__ . '/..';
const CONTENT_FILE = ROOT . '/content/content.json';
const BACKUP_DIR   = ROOT . '/content/backups';
const UPLOAD_DIR   = ROOT . '/uploads';
const DATA_DIR     = __DIR__ . '/data';
const AUTH_FILE    = DATA_DIR . '/auth.json';
const ATTEMPT_FILE = DATA_DIR . '/attempts.json';
const MSG_FILE     = DATA_DIR . '/messages.jsonl';     // contact-form submissions, one JSON object per line
const MSG_RL_FILE  = DATA_DIR . '/contact-rate.json';
const MSG_FIELDS   = ['fullName' => 120, 'company' => 120, 'jobTitle' => 120, 'mobile' => 30, 'email' => 160, 'industry' => 80,
                      'branches' => 20, 'city' => 80, 'preferredContactMethod' => 40, 'preferredContactTime' => 80,
                      'primaryChallenge' => 3000, 'page' => 200];

const PBKDF2_ITER      = 100000;
const MAX_CONTENT_SIZE = 2 * 1024 * 1024;   // 2 MB of JSON
const MAX_UPLOAD_SIZE  = 8 * 1024 * 1024;   // 8 MB per image (after decoding)
const KEEP_BACKUPS     = 50;
const SESSION_TTL      = 8 * 3600;          // 8 hours
const REQUIRED_KEYS    = ['site', 'nav', 'hero', 'about', 'services', 'pains', 'difference', 'solutions', 'industries', 'footer'];

date_default_timezone_set('Asia/Tehran');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
session_name('rs_admin');
session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => $https, 'httponly' => true, 'samesite' => 'Strict']);
session_start();

foreach ([DATA_DIR, BACKUP_DIR, UPLOAD_DIR] as $dir) {
    if (!is_dir($dir)) @mkdir($dir, 0755, true);
}

/* ---------------- helpers ---------------- */

function respond(int $code, array $data): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function fail(int $code, string $msg): void { respond($code, ['ok' => false, 'error' => $msg]); }

function body(): array {
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') return [];
    $data = json_decode($raw, true);
    if (!is_array($data)) fail(400, 'درخواست نامعتبر است.');
    return $data;
}

function read_json(string $file, $default) {
    if (!is_file($file)) return $default;
    $d = json_decode((string)file_get_contents($file), true);
    return is_array($d) ? $d : $default;
}

function write_atomic(string $file, string $data): void {
    $tmp = $file . '.tmp-' . bin2hex(random_bytes(4));
    if (file_put_contents($tmp, $data, LOCK_EX) === false || !rename($tmp, $file)) {
        @unlink($tmp);
        fail(500, 'نوشتن فایل روی سرور ممکن نشد. دسترسی پوشه‌ها را بررسی کنید.');
    }
}

function derive(string $password, string $salt): string {
    return hash_pbkdf2('sha256', $password, $salt, PBKDF2_ITER, 64);
}

function has_password(): bool { return is_file(AUTH_FILE); }

function set_password(string $password): void {
    $len = function_exists('mb_strlen') ? mb_strlen($password, 'UTF-8') : strlen($password);
    if ($len < 8) fail(400, 'رمز عبور باید حداقل ۸ کاراکتر باشد.');
    $salt = bin2hex(random_bytes(16));
    write_atomic(AUTH_FILE, json_encode(['salt' => $salt, 'hash' => derive($password, $salt), 'iter' => PBKDF2_ITER]));
}

function check_password(string $password): bool {
    $a = read_json(AUTH_FILE, []);
    if (empty($a['salt']) || empty($a['hash'])) return false;
    return hash_equals($a['hash'], derive($password, $a['salt']));
}

function client_ip(): string { return $_SERVER['REMOTE_ADDR'] ?? 'unknown'; }

function throttle_check(): void {
    $all = read_json(ATTEMPT_FILE, []);
    $me = $all[client_ip()] ?? null;
    if ($me && ($me['until'] ?? 0) > time()) {
        fail(429, 'به دلیل تلاش‌های ناموفق زیاد، ' . ceil(($me['until'] - time()) / 60) . ' دقیقه‌ی دیگر دوباره امتحان کنید.');
    }
}
function throttle_record(bool $success): void {
    $all = read_json(ATTEMPT_FILE, []);
    $ip = client_ip();
    if ($success) { unset($all[$ip]); }
    else {
        $me = $all[$ip] ?? ['count' => 0, 'until' => 0];
        $me['count']++;
        if ($me['count'] >= 5) { $me['until'] = time() + 600; $me['count'] = 0; }
        $all[$ip] = $me;
    }
    // drop stale entries
    foreach ($all as $k => $v) if (($v['until'] ?? 0) < time() - 86400 && ($v['count'] ?? 0) === 0) unset($all[$k]);
    write_atomic(ATTEMPT_FILE, json_encode($all));
}

function login_session(): void {
    session_regenerate_id(true);
    $_SESSION['auth'] = true;
    $_SESSION['at'] = time();
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
}

function is_authed(): bool {
    if (empty($_SESSION['auth'])) return false;
    if (time() - ($_SESSION['at'] ?? 0) > SESSION_TTL) { $_SESSION = []; return false; }
    $_SESSION['at'] = time();
    return true;
}

function require_auth(bool $mutating = true): void {
    if (!is_authed()) fail(401, 'لطفاً دوباره وارد شوید.');
    if ($mutating) {
        $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
        if (!hash_equals($_SESSION['csrf'] ?? '', $token)) fail(403, 'توکن امنیتی نامعتبر است؛ صفحه را تازه کنید.');
    }
}

function require_post(): void {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail(405, 'Method not allowed');
}

function backup_current(): void {
    if (!is_file(CONTENT_FILE)) return;
    $name = 'content-' . date('Ymd-His') . '-' . bin2hex(random_bytes(2)) . '.json';
    copy(CONTENT_FILE, BACKUP_DIR . '/' . $name);
    $files = glob(BACKUP_DIR . '/content-*.json') ?: [];
    rsort($files);
    foreach (array_slice($files, KEEP_BACKUPS) as $old) @unlink($old);
}

function list_backups(): array {
    $files = glob(BACKUP_DIR . '/content-*.json') ?: [];
    rsort($files);
    return array_map(fn($f) => ['file' => basename($f), 'time' => filemtime($f), 'size' => filesize($f)], $files);
}

function read_messages(): array {
    if (!is_file(MSG_FILE)) return [];
    $out = [];
    foreach (file(MSG_FILE, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
        $m = json_decode($line, true);
        if (is_array($m)) $out[] = $m;
    }
    return $out;
}
function write_messages(array $msgs): void {
    write_atomic(MSG_FILE, implode("\n", array_map(fn($m) => json_encode($m, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), $msgs)) . (count($msgs) ? "\n" : ''));
}

/* ---------------- routes ---------------- */

$action = $_GET['action'] ?? '';

switch ($action) {

    case 'status':
        respond(200, [
            'ok' => true,
            'needsSetup' => !has_password(),
            'authenticated' => is_authed(),
            'csrf' => is_authed() ? $_SESSION['csrf'] : null,
        ]);

    case 'setup':
        require_post();
        if (has_password()) fail(403, 'رمز عبور قبلاً تعیین شده است.');
        $b = body();
        set_password((string)($b['password'] ?? ''));
        login_session();
        respond(200, ['ok' => true, 'csrf' => $_SESSION['csrf']]);

    case 'login':
        require_post();
        throttle_check();
        $b = body();
        $okPw = has_password() && check_password((string)($b['password'] ?? ''));
        throttle_record($okPw);
        if (!$okPw) fail(401, 'رمز عبور اشتباه است.');
        login_session();
        respond(200, ['ok' => true, 'csrf' => $_SESSION['csrf']]);

    case 'logout':
        require_post();
        $_SESSION = [];
        session_destroy();
        respond(200, ['ok' => true]);

    case 'password':
        require_post(); require_auth();
        $b = body();
        if (!check_password((string)($b['current'] ?? ''))) fail(400, 'رمز فعلی اشتباه است.');
        set_password((string)($b['next'] ?? ''));
        respond(200, ['ok' => true]);

    case 'save':
        require_post(); require_auth();
        $raw = file_get_contents('php://input') ?: '';
        if (strlen($raw) > MAX_CONTENT_SIZE) fail(413, 'حجم محتوا بیش از حد مجاز است.');
        $b = json_decode($raw, true);
        $content = $b['content'] ?? null;
        if (!is_array($content)) fail(400, 'محتوای ارسالی نامعتبر است.');
        foreach (REQUIRED_KEYS as $k) if (!isset($content[$k]) || !is_array($content[$k])) fail(400, "بخش «{$k}» در محتوا وجود ندارد.");
        $json = json_encode($content, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($json === false) fail(400, 'محتوا قابل ذخیره نیست.');
        backup_current();
        write_atomic(CONTENT_FILE, $json . "\n");
        respond(200, ['ok' => true, 'savedAt' => time()]);

    case 'upload':
        require_post(); require_auth();
        $b = body();
        $data = base64_decode((string)($b['data'] ?? ''), true);
        if ($data === false || $data === '') fail(400, 'فایل ارسالی نامعتبر است.');
        if (strlen($data) > MAX_UPLOAD_SIZE) fail(413, 'حجم تصویر بیش از ۸ مگابایت است.');
        $info = @getimagesizefromstring($data);
        $types = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];
        if (!$info || !isset($types[$info['mime']])) fail(400, 'فقط تصاویر JPG، PNG، WEBP و GIF مجاز هستند.');
        $base = preg_replace('/[^a-z0-9-]+/', '-', strtolower(pathinfo((string)($b['name'] ?? 'image'), PATHINFO_FILENAME)));
        $base = trim(substr($base, 0, 40), '-') ?: 'image';
        $name = date('Ymd') . '-' . $base . '-' . bin2hex(random_bytes(3)) . '.' . $types[$info['mime']];
        if (file_put_contents(UPLOAD_DIR . '/' . $name, $data, LOCK_EX) === false) fail(500, 'ذخیره‌ی تصویر ممکن نشد.');
        respond(200, ['ok' => true, 'url' => 'uploads/' . $name, 'width' => $info[0], 'height' => $info[1]]);

    case 'media':
        require_auth(false);
        $files = glob(UPLOAD_DIR . '/*.{jpg,jpeg,png,webp,gif}', GLOB_BRACE) ?: [];
        usort($files, fn($a, $b) => filemtime($b) <=> filemtime($a));
        respond(200, ['ok' => true, 'items' => array_map(fn($f) => ['url' => 'uploads/' . basename($f), 'time' => filemtime($f), 'size' => filesize($f)], $files)]);

    case 'backups':
        require_auth(false);
        respond(200, ['ok' => true, 'items' => list_backups()]);

    case 'restore':
        require_post(); require_auth();
        $b = body();
        $file = basename((string)($b['file'] ?? ''));
        if (!preg_match('/^content-\d{8}-\d{6}-[a-f0-9]{4}\.json$/', $file) || !is_file(BACKUP_DIR . '/' . $file)) fail(404, 'نسخه‌ی پشتیبان پیدا نشد.');
        $data = (string)file_get_contents(BACKUP_DIR . '/' . $file);
        if (!is_array(json_decode($data, true))) fail(400, 'فایل پشتیبان خراب است.');
        backup_current();
        write_atomic(CONTENT_FILE, $data);
        respond(200, ['ok' => true]);

    /* ---- public: contact form ---- */
    case 'contact':
        require_post();
        $b = body();
        if (!empty($b['website_hp'])) respond(200, ['ok' => true]);           // bot honeypot: pretend success
        // rate limit: 5 submissions per IP per hour
        $rl = read_json(MSG_RL_FILE, []); $ip = client_ip(); $now = time();
        $rl[$ip] = array_values(array_filter($rl[$ip] ?? [], fn($t) => $t > $now - 3600));
        if (count($rl[$ip]) >= 5) fail(429, 'تعداد درخواست‌ها زیاد است؛ کمی بعد دوباره تلاش کنید.');
        $msg = ['id' => bin2hex(random_bytes(6)), 'time' => $now, 'read' => false];
        foreach (MSG_FIELDS as $k => $max) {
            $v = trim((string)($b[$k] ?? ''));
            $msg[$k] = function_exists('mb_substr') ? mb_substr($v, 0, $max, 'UTF-8') : substr($v, 0, $max);
        }
        if ($msg['fullName'] === '' || $msg['company'] === '' || $msg['mobile'] === '') fail(400, 'نام، نام برند و شماره تماس الزامی است.');
        if ($msg['email'] !== '' && !filter_var($msg['email'], FILTER_VALIDATE_EMAIL)) fail(400, 'ایمیل وارد شده معتبر نیست.');
        if (empty($b['consent'])) fail(400, 'لطفاً موافقت با ذخیره‌ی اطلاعات را تأیید کنید.');
        $rl[$ip][] = $now;
        foreach ($rl as $k => $v) if (!$v) unset($rl[$k]);
        write_atomic(MSG_RL_FILE, json_encode($rl));
        file_put_contents(MSG_FILE, json_encode($msg, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n", FILE_APPEND | LOCK_EX);
        // optional e-mail notification (set «ایمیل دریافت اعلان» in the admin → تماس با ما)
        $content = read_json(CONTENT_FILE, []);
        $to = trim((string)($content['pages']['contact']['notifyEmail'] ?? ''));
        if ($to !== '' && filter_var($to, FILTER_VALIDATE_EMAIL) && function_exists('mail')) {
            $lines = [];
            foreach (MSG_FIELDS as $k => $_) if ($msg[$k] !== '') $lines[] = "$k: {$msg[$k]}";
            @mail($to, '=?UTF-8?B?' . base64_encode('درخواست جلسه‌ی جدید از سایت') . '?=', implode("\n", $lines),
                "Content-Type: text/plain; charset=UTF-8\r\n");
        }
        respond(200, ['ok' => true]);

    /* ---- admin: inbox ---- */
    case 'messages':
        require_auth(false);
        respond(200, ['ok' => true, 'items' => array_reverse(read_messages())]);

    case 'message-update':
        require_post(); require_auth();
        $b = body(); $id = (string)($b['id'] ?? ''); $delete = !empty($b['delete']);
        $msgs = read_messages(); $found = false;
        foreach ($msgs as $i => $m) {
            if (($m['id'] ?? '') !== $id) continue;
            $found = true;
            if ($delete) unset($msgs[$i]); else $msgs[$i]['read'] = !empty($b['read']);
        }
        if (!$found) fail(404, 'پیام پیدا نشد.');
        write_messages(array_values($msgs));
        respond(200, ['ok' => true]);

    default:
        fail(404, 'Unknown action');
}
