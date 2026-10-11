<?php
$requestPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
if (!in_array($requestPath, ['/contact', '/contact/', '/contact.php'], true)) {
  require($_SERVER['DOCUMENT_ROOT'] . '/404.php');
  exit;
}

header('Cache-Control: no-store');
set_error_handler(static function ($severity, $message) {
  error_log('Contact session: ' . $message);
  return true;
}, E_WARNING);
try {
  $sessionStarted = session_start([
    'cookie_httponly' => true,
    'cookie_secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    'cookie_samesite' => 'Lax',
    'use_strict_mode' => true,
  ]);
} finally {
  restore_error_handler();
}
$categories = [
  'general' => 'General',
  'bug-report' => 'Bug report',
  'feature-request' => 'Feature request',
];
$values = ['name' => '', 'email' => '', 'category' => 'general', 'message' => ''];
$errors = [];
$messageSent = false;

if (!$sessionStarted) {
  error_log('Contact: unable to start a session.');
  http_response_code(503);
  $errors['form'] = 'The contact form is temporarily unavailable. Please try again later.';
} else {
  if (!isset($_SESSION['contact_token'])) {
    $_SESSION['contact_token'] = bin2hex(random_bytes(32));
  }
  $messageSent = !empty($_SESSION['contact_sent']);
  unset($_SESSION['contact_sent']);
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'POST' && ($_POST['action'] ?? '') === 'reset') {
  header('Location: /contact', true, 303);
  exit;
}
if ($method === 'POST') {
  $messageSent = false;
  foreach ($values as $field => $value) {
    $values[$field] = isset($_POST[$field]) && is_string($_POST[$field]) ? trim($_POST[$field]) : '';
  }

  $token = $_POST['token'] ?? '';
  if ($sessionStarted && (!is_string($token) || !hash_equals($_SESSION['contact_token'], $token))) {
    http_response_code(403);
    $errors['form'] = 'The form expired or could not be verified. Please send your message again.';
  }
  if (!preg_match('/\A[^\x00-\x1F\x7F]{1,100}\z/u', $values['name'])) {
    $errors['name'] = 'Enter a name of up to 100 characters.';
  }
  if (strlen($values['email']) > 254 || preg_match('/[\r\n]/', $values['email']) || !filter_var($values['email'], FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'Enter a valid email address.';
  }
  if (!isset($categories[$values['category']])) {
    $errors['category'] = 'Choose General, Bug report or Feature request.';
  }
  if (!preg_match('/\A[^\x00-\x08\x0B\x0C\x0E-\x1F\x7F]{1,10000}\z/u', $values['message'])) {
    $errors['message'] = 'Enter a message of up to 10,000 characters.';
  }
  if (!isset($_POST['website']) || !is_string($_POST['website']) || $_POST['website'] !== '') {
    $errors['form'] = 'The submission could not be verified. Please try again.';
  }
  if ($sessionStarted && isset($_SESSION['contact_last_sent']) && time() - $_SESSION['contact_last_sent'] < 60) {
    http_response_code(429);
    header('Retry-After: 60');
    $errors['form'] = 'Please wait a minute before sending another message.';
  }

  if (!$errors) {
    $category = $categories[$values['category']];
    $message = str_replace(["\r\n", "\r"], "\n", $values['message']);
    $body = "Category: {$category}\nName: {$values['name']}\nEmail: {$values['email']}\n\n{$message}\n";
    $headers = [
      'From' => 'Pekosoft <contact@pekosoft.net>',
      'Reply-To' => $values['email'],
      'MIME-Version' => '1.0',
      'Content-Type' => 'text/plain; charset=UTF-8',
      'Content-Transfer-Encoding' => 'quoted-printable',
    ];
    set_error_handler(static function ($severity, $message) {
      error_log('Contact mail: ' . $message);
      return true;
    }, E_WARNING);
    try {
      $sent = mail('ole@peko.net', 'Pekosoft - ' . $category, quoted_printable_encode($body), $headers);
    } finally {
      restore_error_handler();
    }

    if ($sent) {
      $_SESSION['contact_last_sent'] = time();
      $_SESSION['contact_sent'] = true;
      $_SESSION['contact_token'] = bin2hex(random_bytes(32));
      header('Location: /contact', true, 303);
      exit;
    }
    error_log('Contact: the mail service did not accept the message.');
    http_response_code(503);
    $errors['form'] = 'Your message could not be sent. Please try again later. Your text has been kept below.';
  } elseif (http_response_code() === 200) {
    http_response_code(422);
  }
} elseif (!in_array($method, ['GET', 'HEAD'], true)) {
  header('Allow: GET, HEAD, POST');
  http_response_code(405);
  $errors['form'] = 'This request method is not supported.';
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
  <?php
  $release = 'contact';
  $releaseName = 'Contact';
  $releasePage = '';
  $hideReleaseMenu = true;
  require($_SERVER['DOCUMENT_ROOT'] . '/elements/head.php');
  ?>
  <meta name="description" content="Contact Pekosoft with a general message, bug report or feature request.">
  <link rel="stylesheet" type="text/css" href="/css/contact.css?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/css/contact.css'); ?>">
</head>

<body>
  <?php require($_SERVER['DOCUMENT_ROOT'] . '/elements/toc.php'); ?>

  <main id="contact" class="standard padded border">
    <?php if ($messageSent): ?>
      <p class="contact-notice" role="status">Your message has been sent. Thank you.</p>
    <?php endif; ?>
    <?php if ($errors): ?>
      <div id="contact-errors" class="contact-notice" role="alert">
        <p>Your message was not sent.</p>
        <ul>
          <?php foreach ($errors as $error): ?>
            <li><?php echo htmlspecialchars($error, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); ?></li>
          <?php endforeach; ?>
        </ul>
      </div>
    <?php endif; ?>

    <form id="contact-form" action="/contact" method="post">
      <input type="hidden" name="token" value="<?php echo htmlspecialchars($_SESSION['contact_token'] ?? '', ENT_QUOTES, 'UTF-8'); ?>">
      <div class="contact-honeypot" aria-hidden="true">
        <label for="contact-website">Website:</label>
        <input type="text" id="contact-website" name="website" tabindex="-1" autocomplete="off">
      </div>
      <div class="contact-fields">
        <div class="pair">
          <label for="contact-name">Name:</label>
          <input type="text" id="contact-name" name="name" required maxlength="100" autocomplete="name" value="<?php echo htmlspecialchars($values['name'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); ?>"<?php if (isset($errors['name'])): ?> aria-invalid="true" aria-describedby="contact-errors"<?php endif; ?>>
        </div>
        <div class="pair">
          <label for="contact-email">Email:</label>
          <input type="email" id="contact-email" name="email" required maxlength="254" autocomplete="email" value="<?php echo htmlspecialchars($values['email'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); ?>"<?php if (isset($errors['email'])): ?> aria-invalid="true" aria-describedby="contact-errors"<?php endif; ?>>
        </div>
        <div class="pair">
          <label for="contact-category">Category:</label>
          <select id="contact-category" name="category"<?php if (isset($errors['category'])): ?> aria-invalid="true" aria-describedby="contact-errors"<?php endif; ?>>
            <?php foreach ($categories as $value => $label): ?>
              <option value="<?php echo $value; ?>"<?php if ($values['category'] === $value): ?> selected<?php endif; ?>><?php echo $label; ?></option>
            <?php endforeach; ?>
          </select>
        </div>
      </div>
      <textarea id="contact-message" name="message" aria-label="Message" required maxlength="10000" rows="10"<?php if (isset($errors['message'])): ?> aria-invalid="true" aria-describedby="contact-errors"<?php endif; ?>><?php echo htmlspecialchars($values['message'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); ?></textarea>
      <div class="wrapper">
        <button id="contact-send-button" type="submit" title="Send message" aria-label="Send"<?php if (!$sessionStarted): ?> disabled<?php endif; ?>>
          <svg class="icons" role="img"><use href="/icons.svg#arrow_right"></use></svg>
          <span class="button-text">Send</span>
        </button>
        <button id="contact-reset-button" type="submit" name="action" value="reset" formnovalidate title="Reset to default" aria-label="Reset">
          <svg class="icons" role="img"><use href="/icons.svg#reset"></use></svg>
          <span class="button-text">Reset</span>
        </button>
      </div>
    </form>
  </main>

  <?php require($_SERVER['DOCUMENT_ROOT'] . '/elements/footer.php'); ?>
</body>

</html>
