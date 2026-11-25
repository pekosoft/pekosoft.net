<?php
$interfaceConfig = json_decode(file_get_contents(__DIR__ . '/data/site_ui.json'), true, 512, JSON_THROW_ON_ERROR);
if (!is_array($interfaceConfig) || !isset($interfaceConfig['background'])
    || !is_string($interfaceConfig['background'])
    || ($interfaceConfig['background'] !== 'gradient'
        && (!str_starts_with($interfaceConfig['background'], '/')
            || !is_file(__DIR__ . $interfaceConfig['background'])))) {
    throw new RuntimeException('The site background must be a gradient or reference an existing local image.');
}
$interfaceBackground = $interfaceConfig['background'];
if ($interfaceBackground !== 'gradient') {
    $interfaceBackground .= '?v=' . filemtime(__DIR__ . $interfaceBackground);
}
?>
<link rel="stylesheet" href="/site_ui.css?v=<?php echo filemtime(__DIR__ . '/site_ui.css'); ?>">
<script src="/site_ui.js?v=<?php echo filemtime(__DIR__ . '/site_ui.js'); ?>" defer
  data-background="<?php echo htmlspecialchars($interfaceBackground, ENT_QUOTES, 'UTF-8'); ?>"
  data-root-inversion="<?php echo !empty($interfaceConfig['rootInversion']) ? 'true' : 'false'; ?>"></script>
