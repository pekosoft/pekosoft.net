<!DOCTYPE html>
<html lang="en">

<head>
  <?php
  require($_SERVER['DOCUMENT_ROOT'] . "/elements/head.php");
  $release = "qr";
  $releaseName = "Buy Us Coffee";
  $releasePage = "";
  $hideReleaseMenu = true;
  $bitcoinAddress = "32zzTex2RTsiARXi3Li8w81ogvbBxHfBDJ";
  ?>
  <meta name="description" content="Bitcoin QR for donations and business.">
  <link rel="stylesheet" type="text/css" href="/css/bitcoin.css?v=<?php echo filemtime($_SERVER['DOCUMENT_ROOT'] . '/css/bitcoin.css'); ?>">
</head>

<body>
  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/toc.php"); ?>

  <div class="three-columns-container">
    <div class="three-columns column-sides column-left hide-on-medium-screen">
      <svg class="speaker" viewBox="0 0 256 512" role="img">
        <use href="/assets.svg#speaker" />
      </svg>
    </div>

    <div class="three-columns column-middle">
      <div class="border">
        <div class="link-wrapper">
          <a href="bitcoin:<?php echo $bitcoinAddress; ?>">
            <svg class="standard-image assets bitcoin-qr" viewBox="0 0 812 812" role="img" aria-label="Bitcoin QR">
              <use href="/assets.svg#bitcoin_qr" />
            </svg>
          </a>
        </div>
        <div>BITCOIN ONLY ADDRESS</div>
        <div class="bitcoin-address"><?php echo $bitcoinAddress; ?></div>
      </div>
    </div>

    <div class="three-columns column-sides column-right hide-on-medium-screen">
      <svg class="speaker" viewBox="0 0 256 512" role="img">
        <use href="/assets.svg#speaker" />
      </svg>
    </div>
  </div>

  <?php require($_SERVER['DOCUMENT_ROOT'] . "/elements/footer.php"); ?>
</body>

</html>
