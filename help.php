<?php
$requestedRelease = isset($_GET['t']) ? basename((string) $_GET['t']) : '';
if ($requestedRelease === 'settings') {
  require($_SERVER['DOCUMENT_ROOT'] . '/404.php');
  exit;
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/head.php");
  require($_SERVER['DOCUMENT_ROOT'] . "/elements/release_type.php");
  $release = isset($_GET['t']) ? basename($_GET['t']) : 'default';
  $releaseName = getReleaseTitle($release);
  $releasePage = "Help";
  $filePath = $_SERVER['DOCUMENT_ROOT'] . "/help/" . $release . ".php";
  $footerPath = isBetaRelease($release) ? "/elements/beta_footer.php" : "/elements/footer.php";
  ?>
  
</head>

<body>
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/toc.php"); ?>

  <div class="three-columns-container">
    <div class="three-columns column-sides column-left hide-on-medium-screen">
      <svg class="speaker" viewBox="0 0 256 512" role="img">
        <use href="/assets.svg#speaker" />
      </svg>
    </div>

    <div class="three-columns column-middle justify">
      <?php
      if (file_exists($filePath)) {
        include($filePath);
      } else {
        echo "<div class='standard padded colored'><h1>Help file not found</h1>This help file does not exist: <code>$filePath</code></div>";
      }
      ?>
    </div>

    <div class="three-columns column-sides column-right hide-on-medium-screen">
      <svg class="speaker" viewBox="0 0 256 512" role="img">
        <use href="/assets.svg#speaker" />
      </svg>
    </div>

    <?php require($_SERVER['DOCUMENT_ROOT'] . $footerPath); ?>
</body>

</html>