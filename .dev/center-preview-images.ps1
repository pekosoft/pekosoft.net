param([switch]$Check)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;

public static class PreviewImageAlignment
{
    private static Rectangle Bounds(Bitmap image)
    {
        int left = image.Width, top = image.Height, right = -1, bottom = -1;
        for (int y = 0; y < image.Height; y++)
        for (int x = 0; x < image.Width; x++)
        {
            Color pixel = image.GetPixel(x, y);
            if (pixel.A == 0 || (pixel.R == 0 && pixel.G == 0 && pixel.B == 0)) continue;
            left = Math.Min(left, x);
            top = Math.Min(top, y);
            right = Math.Max(right, x);
            bottom = Math.Max(bottom, y);
        }
        if (right < 0) throw new InvalidDataException("Empty artwork");
        return Rectangle.FromLTRB(left, top, right + 1, bottom + 1);
    }

    public static string Process(string path, bool check)
    {
        string temporary = path + ".tmp";
        bool changed = false;
        string result;
        using (Bitmap source = new Bitmap(path))
        {
            Rectangle bounds = Bounds(source);
            int targetX = (source.Width - bounds.Width) / 2;
            int targetY = (source.Height - bounds.Height) / 2;
            int dx = targetX - bounds.X, dy = targetY - bounds.Y;
            result = String.Format("{0}: {1}x{2}, artwork {3}x{4}, shift {5},{6}",
                path, source.Width, source.Height, bounds.Width, bounds.Height, dx, dy);
            if (dx == 0 && dy == 0) return result + " OK";
            if (check) throw new InvalidDataException(result + " is not centered");
            using (Bitmap output = new Bitmap(source.Width, source.Height, source.PixelFormat))
            {
                using (Graphics graphics = Graphics.FromImage(output))
                {
                    graphics.Clear(source.GetPixel(0, 0));
                    graphics.CompositingMode = System.Drawing.Drawing2D.CompositingMode.SourceCopy;
                    graphics.DrawImageUnscaled(source, dx, dy);
                }
                Rectangle actual = Bounds(output);
                if (actual.X != targetX || actual.Y != targetY ||
                    actual.Size != bounds.Size)
                    throw new InvalidDataException("Artwork bounds changed: " + path);
                for (int y = 0; y < bounds.Height; y++)
                for (int x = 0; x < bounds.Width; x++)
                    if (source.GetPixel(bounds.X + x, bounds.Y + y).ToArgb() !=
                        output.GetPixel(targetX + x, targetY + y).ToArgb())
                        throw new InvalidDataException("Artwork pixels changed: " + path);
                output.Save(temporary, ImageFormat.Png);
                changed = true;
            }
        }
        if (changed)
        {
            File.Copy(temporary, path, true);
            File.Delete(temporary);
        }
        return result + " centered";
    }
}
'@

$root = Split-Path $PSScriptRoot -Parent
$images = @(
    Get-ChildItem (Join-Path $root 'png') -Filter '*.png' -File
    Get-ChildItem (Join-Path $root 'png\og') -Filter '*.png' -File
)
foreach ($image in $images) {
    [PreviewImageAlignment]::Process($image.FullName, $Check.IsPresent)
}
Write-Output "Validated $($images.Count) bitmap previews."
