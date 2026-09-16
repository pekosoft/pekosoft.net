<?php

function isBetaRelease($release)
{
  $betaReleases = [
    'audio_calculator',
    'bpm_circle',
    'bpm_curve',
    'clock',
    'circle_of_fifths',
    'drum_machine',
    'icons',
    'notepad',
    'piano',
    'player',
    'reference',
    'system',
    'tuner',
    'visualizer',
  ];

  return in_array($release, $betaReleases, true);
}

function getReleaseTitle($release)
{
  $toolPath = $_SERVER['DOCUMENT_ROOT'] . '/tools/' . $release . '.php';
  $rootPath = $_SERVER['DOCUMENT_ROOT'] . '/' . $release . '.php';
  $filePath = is_file($toolPath) ? $toolPath : $rootPath;

  if (is_file($filePath)) {
    $source = file_get_contents($filePath);
    if ($source !== false && preg_match('/\$releaseName\s*=\s*["\']([^"\']+)["\']\s*;/', $source, $matches)) {
      return $matches[1];
    }
  }

  return $release;
}
