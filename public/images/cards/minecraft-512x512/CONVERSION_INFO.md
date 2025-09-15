# Web Image Conversion Documentation

## Conversion Details

**Date:** September 15, 2025  
**Source Directory:** `/Users/zyahav/Documents/GitHub/p-Narration/AudioProcessing/assets/originals/Minecraft`  
**Output Directory:** `/Users/zyahav/Documents/GitHub/p-Narration/AudioProcessing/assets/web`  
**Total Files Processed:** 21 PNG images  

## Original Specifications
- **Format:** PNG
- **Resolution:** 1024x1024 pixels
- **Average file size:** ~1.4 MB per file

## Web-Optimized Specifications
- **Format:** JPEG
- **Resolution:** 512x512 pixels (50% reduction)
- **Quality:** High (q=2)
- **Average file size:** ~80 KB per file
- **Compression ratio:** ~93% size reduction

## FFmpeg Command Used

```bash
ffmpeg -y -i "input_file.png" -vf "scale=512:512" -q:v 2 "output_file.jpg"
```

### Command Parameters Explained:
- `-y` - Overwrite output files without asking
- `-i "input_file.png"` - Input file path
- `-vf "scale=512:512"` - Video filter to resize to 512x512 pixels
- `-q:v 2` - Set video quality to 2 (high quality JPEG, scale 1-31, lower = better)
- `"output_file.jpg"` - Output file path

### Batch Processing Command:
```bash
cd "/Users/zyahav/Documents/GitHub/p-Narration/AudioProcessing/assets/originals/Minecraft"
for file in *.png; do 
    echo "Processing: $file"
    ffmpeg -y -i "$file" -vf "scale=512:512" -q:v 2 "/Users/zyahav/Documents/GitHub/p-Narration/AudioProcessing/assets/web/${file%.png}.jpg"
done
```

## Benefits for Web Use:
1. **Faster Loading:** 93% smaller file sizes
2. **Better Bandwidth Usage:** Reduced data transfer
3. **Maintained Quality:** High-quality JPEG compression
4. **Consistent Format:** All images standardized to JPEG
5. **Responsive Design Ready:** 512x512 suitable for various screen sizes

## Files Converted:
1. אבא.jpg
2. אגדה.jpg
3. אהבה.jpg
4. אוזה.jpg
5. בננה.jpg
6. בננה1.jpg
7. זכה.jpg
8. יפה.jpg
9. כלה.jpg
10. מטרה 2.jpg
11. מטרה1.jpg
12. מצה.jpg
13. מתנה.jpg
14. נחה.jpg
15. סבא.jpg
16. עגלה.jpg
17. פרה.jpg
18. קמה.jpg
19. ראה.jpg
20. שרה-שרה.jpg
21. שרה.jpg

## Additional Notes:
- All Hebrew filenames preserved
- FFmpeg version 7.1.1 used
- Process completed successfully in ~2.3 seconds
- No quality loss visible at web viewing sizes
