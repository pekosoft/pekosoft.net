<?php
$currentScript = basename($_SERVER['SCRIPT_NAME']);
$requestPath = trim(parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?? '', '/');
$toolPages = ["tap_pad.php", "bpm_calculator.php", "metronome.php", "turntable.php", "bpm_circle.php", "bpm_curve.php", "circle_of_fifths.php", "drum_machine.php", "player.php", "piano.php", "audio_calculator.php", "blockchain.php", "icons.php", "tuner.php", "visualizer.php", "reference.php", "notepad.php"];
$toolSlugs = array_map(function ($toolPage) {
	return pathinfo($toolPage, PATHINFO_FILENAME);
}, $toolPages);
$releaseName = isset($releaseName) ? $releaseName : '';
$releaseTitleMap = [
	'tap_pad' => 'Tap Pad',
	'tap_pad.php' => 'Tap Pad',
	'bpm_calculator' => 'BPM Calculator',
	'bpm_calculator.php' => 'BPM Calculator',
	'metronome' => 'Metronome',
	'metronome.php' => 'Metronome',
	'turntable' => 'Turntable',
	'turntable.php' => 'Turntable',
	'bpm_circle' => 'BPM Circle',
	'bpm_circle.php' => 'BPM Circle',
	'bpm_curve' => 'BPM Curve',
	'bpm_curve.php' => 'BPM Curve',
	'circle_of_fifths' => 'Circle Of Fifths',
	'circle_of_fifths.php' => 'Circle Of Fifths',
	'drum_machine' => 'Drum Machine',
	'drum_machine.php' => 'Drum Machine',
	'player' => 'Player',
	'player.php' => 'Player',
	'piano' => 'Piano',
	'piano.php' => 'Piano',
	'audio_calculator' => 'Audio Calculator',
	'audio_calculator.php' => 'Audio Calculator',
	'blockchain' => 'Blockchain',
	'blockchain.php' => 'Blockchain',
	'icons' => 'Icons',
	'icons.php' => 'Icons',
	'tuner' => 'Tuner',
	'tuner.php' => 'Tuner',
	'visualizer' => 'Visualizer',
	'visualizer.php' => 'Visualizer',
	'reference' => 'Reference',
	'reference.php' => 'Reference',
	'notepad' => 'Notepad',
	'notepad.php' => 'Notepad',
	'index' => 'Pekosoft',
	'index.php' => 'Pekosoft',
	'help' => 'Help',
	'help.php' => 'Help',
	'history' => 'History',
	'history.php' => 'History',
	'about' => 'About',
	'about.php' => 'About',
	'beta' => 'Beta',
	'beta.php' => 'Beta',
	'bitcoin' => 'Buy Us Coffee',
	'bitcoin.php' => 'Buy Us Coffee',
];

if ($releaseName === '') {
	$releaseName = $releaseTitleMap[$requestPath] ?? $releaseTitleMap[$currentScript] ?? '';
}
if ($releaseName === '' && $requestPath !== '') {
	$releaseName = $releaseTitleMap[$requestPath . '.php'] ?? '';
}
if (in_array($currentScript, $toolPages, true) || in_array($requestPath, $toolSlugs, true)) {
	echo "<script>document.documentElement.classList.add('modules-page', 'modules-loading');</script>";
}
$sectionTitleMap = [
	'help.php' => 'Help',
	'history.php' => 'History',
	'about.php' => 'About',
];
$sectionTitle = $sectionTitleMap[$currentScript] ?? '';
$releaseSlug = isset($_GET['t']) ? basename((string) $_GET['t']) : '';
$releaseTitle = $releaseTitleMap[$releaseSlug] ?? $releaseTitleMap[$releaseSlug . '.php'] ?? '';
$documentTitle = $sectionTitle && $releaseTitle
	? ($releaseSlug === 'index' ? 'Pekosoft - ' . $sectionTitle : 'Pekosoft - ' . $sectionTitle . ' - ' . $releaseTitle)
	: ($releaseName && $releaseName !== 'Pekosoft' ? 'Pekosoft - ' . $releaseName : 'Pekosoft');
$canonicalSlug = $requestPath !== '' ? $requestPath : pathinfo($currentScript, PATHINFO_FILENAME);
$canonicalSlug = $canonicalSlug === 'index' ? '' : $canonicalSlug;
$canonicalUrl = 'https://pekosoft.net' . ($canonicalSlug !== '' ? '/' . $canonicalSlug : '');
$previewSlug = $releaseTitle !== '' && $sectionTitle !== ''
	? $releaseSlug
	: pathinfo($canonicalSlug, PATHINFO_FILENAME);
if ($sectionTitle && $releaseTitle) {
	$canonicalUrl .= '?t=' . rawurlencode($releaseSlug);
}
$ogImage = 'https://pekosoft.net/png/og/index.png';
if ($previewSlug !== '') {
	$ogImagePng = $_SERVER['DOCUMENT_ROOT'] . '/png/og/' . $previewSlug . '.png';
	if (file_exists($ogImagePng)) {
		$ogImage = 'https://pekosoft.net/png/og/' . $previewSlug . '.png';
	}
}
?>
<script>
try {
	const resetStorageLockKey = 'pekosoft.reset-storage-lock';
	const nativeSetItem = Storage.prototype.setItem;
	Storage.prototype.setItem = function (key, value) {
		if (this === localStorage && sessionStorage.getItem(resetStorageLockKey) === '1') return;
		nativeSetItem.call(this, key, value);
	};

	const releaseResetStorageLock = (event) => {
		if (!event.isTrusted) return;
		sessionStorage.removeItem(resetStorageLockKey);
	};
	document.addEventListener('pointerdown', releaseResetStorageLock, true);
	document.addEventListener('keydown', releaseResetStorageLock, true);
} catch (_) {}

try {
	let theme = localStorage.getItem('global.theme');
	if (theme !== 'dark' && theme !== 'light') {
		const legacyMode = localStorage.getItem('global.mode');
		const legacySemantics = localStorage.getItem('global.mode_semantics');
		theme = legacySemantics === 'dark-default-v2'
			? (legacyMode === 'light' ? 'light' : 'dark')
			: (legacyMode === 'dark' ? 'light' : 'dark');
		localStorage.setItem('global.theme', theme);
		localStorage.removeItem('global.mode');
		localStorage.removeItem('global.mode_semantics');
	}
	if (theme === 'light') {
		document.documentElement.classList.add('invert-colors');
	}
	if (localStorage.getItem('global.layout') !== 'false') {
		document.documentElement.classList.add('layout-two-columns');
	}
	if (localStorage.getItem('global.footer') === 'false') {
		document.documentElement.classList.add('footer-hidden');
	}
} catch (_) {}
</script>
<title><?php echo htmlspecialchars($documentTitle, ENT_QUOTES, 'UTF-8'); ?></title>
<meta charset="utf-8">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" type="text/css" href="/css/index.css?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/css/index.css'); ?>">
<script src="/js/guides.js?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/js/guides.js'); ?>"></script>
<link rel="canonical" href="<?php echo htmlspecialchars($canonicalUrl, ENT_QUOTES, 'UTF-8'); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">

<meta property="og:title" content="<?php echo htmlspecialchars($documentTitle, ENT_QUOTES, 'UTF-8'); ?>">
<meta property="og:type" content="website">
<meta property="og:url" content="<?php echo htmlspecialchars($canonicalUrl, ENT_QUOTES, 'UTF-8'); ?>">
<meta property="og:image" content="<?php echo htmlspecialchars($ogImage, ENT_QUOTES, 'UTF-8'); ?>">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:description" content="Official website for the experimental audio software company Pekosoft.">