import React, { useState, useRef, useEffect } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import "./styles.css";
import axios from 'axios';
import * as EXIF from 'exif-js'; // Import exif-js

function App() {
  const [images, setImages] = useState([]);
  const [logo, setLogo] = useState(null);
  const [textWatermark, setTextWatermark] = useState("");
  const [fontSize, setFontSize] = useState(20);
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF");
  const [cropRatio, setCropRatio] = useState("none");
  const [outputFormat, setOutputFormat] = useState("png");
  const [processedImages, setProcessedImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null); // State to control modal
  const [logoPosition, setLogoPosition] = useState({ x: 0.5, y: 0.9 }); // Store as percentages (0-1)
  const [logoScale, setLogoScale] = useState(20); // Default to 20%
  const [logoOpacity, setLogoOpacity] = useState(100);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [previewImage, setPreviewImage] = useState(null); // State for the preview image
    const previewImageRef = useRef(null); // Ref for the preview image element
    const [qualityValue, setQualityValue] = useState(100);
    const [removeBackground, setRemoveBackground] = useState(false);
  const [logoSource, setLogoSource] = useState('upload'); // 'upload', 'preset1', 'preset2', 'preset3', 'preset4'
  const presetLogos = [
    '/image/logo1.png',
    '/image/logo2.png',
    '/image/logo3.png',
    '/image/logo4.png' // Added fourth preset logo
  ];
  const [logoRotation, setLogoRotation] = useState(0); // New state for logo rotation

  // Watermark positioning states
  const [watermarkPosition, setWatermarkPosition] = useState({ x: 0.95, y: 0.95 }); // Default bottom-right
  const [isDraggingWatermark, setIsDraggingWatermark] = useState(false);
  const watermarkRef = useRef(null);
  const [fontFamily, setFontFamily] = useState('Arial'); // Default font family
  const [fontOpacity, setFontOpacity] = useState(80); // Default font opacity
  const [watermarkColor, setWatermarkColor] = useState('#ffffff'); // Default watermark color - white
    const [removeExif, setRemoveExif] = useState(false); // State for EXIF removal option
    const [tileTextWatermarkEnabled, setTileTextWatermarkEnabled] = useState(false); // State for tile text watermark
    const [tileWatermarkText, setTileWatermarkText] = useState("Watermark Text"); // State for tile watermark text
    const [tileLogoEnabled, setTileLogoEnabled] = useState(false); // New state for tile logo


  // State Variables
  const [nameSuffix, setNameSuffix] = useState("Finesse Glow");
  const [quality, setQuality] = useState(2); // Only affects JPEG/WebP

    // Quality Mapping (Only for JPEG/WebP)
    const QUALITY_MAP = {
        1: 1.0,  // Very High
        2: 0.95, // High
        3: 0.75, // Medium
        4: 0.5   // Low
    };

    useEffect(() => {
    // Update the preview image whenever the 'images' state changes
    if (images.length > 0) {
      setPreviewImage(URL.createObjectURL(images[0]));
    } else {
      setPreviewImage(null);
    }
  }, [images]);


  const handleLogoPositionClick = (event) => {
    if (!previewImageRef.current) return;

    const rect = previewImageRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Calculate relative coordinates (percentages)
    const relativeX = x / rect.width;
    const relativeY = y / rect.height;

    setLogoPosition({ x: relativeX, y: relativeY });
  };

  const removeBg = async (imageFile) => {
    const apiKey = 'vDK8em9JeunhTP312DRqRHqX'; // Replace with your actual API key
    const formData = new FormData();
    formData.append('image_file', imageFile);
    formData.append('size', 'auto');

    try {
      const response = await axios.post(
        'https://api.remove.bg/v1.0/removebg',
        formData,
        {
          headers: {
            'X-Api-Key': apiKey,
            'Content-Type': 'multipart/form-data',
          },
          responseType: 'blob', // Important: response type should be blob
        }
      );

      return new File([response.data], 'no-bg.png', { type: 'image/png' }); // Create a File object from the blob
    } catch (error) {
      console.error('Error removing background:', error);
      alert('Error removing background. Please check your API key and try again.');
      return null;
    }
  };


  const handleProcess = async () => {
      const processed = images.map(async (image) => {
          let processedImage = image;

          if (removeBackground) {
              processedImage = await removeBg(image);
              if (!processedImage) {
                  return null; // Skip processing if background removal fails
              }
          }
          return new Promise((resolve) => {
              const img = new Image();
              img.src = URL.createObjectURL(processedImage);

              img.onload = () => {
                  const canvas = document.createElement("canvas");
                  const ctx = canvas.getContext("2d");

                  let newWidth = img.width;
                  let newHeight = img.height;
                  let imgX = 0;
                  let imgY = 0;

                  // Calculate new dimensions based on selected aspect ratio
                  if (cropRatio === "nocropimage") {
                      // Force 1:1 aspect ratio
                      if (img.width > img.height) {
                          newWidth = img.width;
                          newHeight = img.width;
                          imgY = (newHeight - img.height) / 2;
                      } else {
                          newWidth = img.height;
                          newHeight = img.height;
                          imgX = (newWidth - img.width) / 2;
                      }
                  }
                  else if (cropRatio !== "none") {
                      const [ratioW, ratioH] = cropRatio.split(":").map(Number);
                      const aspectRatio = ratioW / ratioH;
                      const imgAspectRatio = img.width / img.height;

                      if (imgAspectRatio > aspectRatio) {
                          newWidth = img.height * aspectRatio;
                      } else {
                          newHeight = img.width / aspectRatio;
                      }
                  }

                  // Set canvas dimensions
                  canvas.width = newWidth;
                  canvas.height = newHeight;

                  // Fill background color
                  ctx.fillStyle = backgroundColor;
                  ctx.fillRect(0, 0, newWidth, newHeight);

                  // Center the image

                  ctx.drawImage(img, imgX, imgY, img.width, img.height); // Draw original image

                  // Add logo and text watermark
                  addLogoAndWatermark(ctx, newWidth, newHeight, processedImage, resolve); // Pass processedImage

                  URL.revokeObjectURL(img.src);
              };

              img.onerror = (error) => {
                  console.error("Error loading image:", error);
                  URL.revokeObjectURL(img.src);
                  resolve(null);
              };
          });
      });

    Promise.all(processed).then((dataUrls) => {
      const validResults = dataUrls.filter((result) => result);
      setProcessedImages(
        validResults.map((dataUrl, index) => ({
          dataUrl,
          outputName: `${nameSuffix}_${index + 1}.${outputFormat}`,
        }))
      );
    });
  };

const addLogoAndWatermark = (ctx, newWidth, newHeight, currentImage, resolve) => { // ADD currentImage
    let logoImg = new Image();
    let logoSrc;

    if (logoSource === 'upload' && logo) {
        logoSrc = URL.createObjectURL(logo);
    } else if (logoSource.startsWith('preset')) {
        const presetIndex = parseInt(logoSource.replace('preset', '')) - 1;
        logoSrc = presetLogos[presetIndex];
    }
  if(logoSrc){
        logoImg.src = logoSrc;

        logoImg.onload = () => {
            const logoAspectRatio = logoImg.width / logoImg.height;
            let logoWidth = (newWidth * logoScale) / 100;
            let logoHeight = logoWidth / logoAspectRatio;

            // Ensure logo fits within canvas dimensions
            if (logoWidth > newWidth) {
                logoWidth = newWidth;
                logoHeight = logoWidth / logoAspectRatio;
            }
            if (logoHeight > newHeight) {
                logoHeight = newHeight;
                logoWidth = logoHeight * logoAspectRatio;
            }

            // Calculate logo position based on relative coordinates
            const logoX = Math.max(0, Math.min((newWidth * logoPosition.x - logoWidth / 2), newWidth - logoWidth));
            const logoY = Math.max(0, Math.min((newHeight * logoPosition.y - logoHeight / 2), newHeight - logoHeight));


            if (tileLogoEnabled) {
                const logoSpacingX = logoWidth * 1.5; // Example spacing, adjust as needed
                const logoSpacingY = logoHeight * 1.5; // Example spacing, adjust as needed

                ctx.globalAlpha = logoOpacity / 100; // Apply opacity for tiled logos

                for (let x = 0; x < newWidth; x += logoSpacingX) {
                    for (let y = 0; y < newHeight; y += logoSpacingY) {
                        // Rotate the logo
                        ctx.save(); // Save the current context state
                        ctx.translate(x + logoWidth / 2, y + logoHeight / 2); // Translate to the center of the logo
                        ctx.rotate(logoRotation * Math.PI / 180); // Rotate
                        ctx.translate(-(x + logoWidth / 2), -(y + logoHeight / 2)); // Translate back

                        ctx.drawImage(logoImg, x, y, logoWidth, logoHeight);

                        ctx.restore(); // Restore the context to its original state
                    }
                }
                ctx.globalAlpha = 1; // Reset opacity
            } else {
                // Rotate the logo
                ctx.save(); // Save the current context state
                ctx.translate(logoX + logoWidth / 2, logoY + logoHeight / 2); // Translate to the center of the logo
                ctx.rotate(logoRotation * Math.PI / 180); // Rotate
                ctx.translate(-(logoX + logoWidth / 2), -(logoY + logoHeight / 2)); // Translate back

                ctx.globalAlpha = logoOpacity / 100;
                ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);
                ctx.globalAlpha = 1;

                ctx.restore(); // Restore the context to its original state
            }


            addTextWatermark(ctx, newWidth, newHeight, currentImage, resolve); // Pass currentImage
        };

        logoImg.onerror = () => {
            console.error("Error loading logo image");
            resolve(null); // Resolve with null if logo loading fails
        }
    } else {
        addTextWatermark(ctx, newWidth, newHeight, currentImage, resolve); // Pass currentImage
    }
};

  const addTextWatermark = (ctx, canvasWidth, canvasHeight, currentImage, resolve) => { // ADD currentImage
    ctx.font = `${fontSize}px ${fontFamily}`; // Use selected font family
    ctx.fillStyle = watermarkColor; // Use selected watermark color
    ctx.globalAlpha = fontOpacity / 100; // Apply font opacity
    ctx.textAlign = "left"; // Align text to the left for better boundary handling
    ctx.textBaseline = "top"; // Align text to the top for better boundary handling

    if (tileTextWatermarkEnabled && tileWatermarkText) {
        const text = tileWatermarkText;
        const textMetrics = ctx.measureText(text);
        const textWidth = textMetrics.width;
        const textHeight = fontSize * 1.5; // Adjust line height

        ctx.globalAlpha = fontOpacity / 100; // Apply opacity for tiled watermark

        for (let x = 0; x < canvasWidth; x += textWidth * 2) { // Horizontal tiling
            for (let y = 0; y < canvasHeight; y += textHeight * 2) { // Vertical tiling
                ctx.fillText(text, x, y);
            }
        }
        ctx.globalAlpha = 1; // Reset opacity
    }
    else if (textWatermark) { // Single text watermark
      const textMetrics = ctx.measureText(textWatermark);
      const textWidth = textMetrics.width;
      const textHeight = fontSize; // Approximate text height

      // Calculate text position based on watermarkPosition state (percentages)
      let textX = canvasWidth * watermarkPosition.x;
      let textY = canvasHeight * watermarkPosition.y;

      // Boundary checks to keep watermark inside the image
      textX = Math.max(0, Math.min(canvasWidth - textWidth - 10, textX)); // Keep within right edge with 10px padding
      textY = Math.max(0, Math.min(canvasHeight - textHeight - 10, textY)); // Keep within bottom edge with 10px padding
      textX = Math.max(10, textX); // Keep within left edge with 10px padding
      textY = Math.max(10, textY); // Keep within top edge with 10px padding

      ctx.fillText(
        textWatermark,
        textX,
        textY
      );
      ctx.globalAlpha = 1; // Reset globalAlpha after drawing watermark
    } else {
        ctx.globalAlpha = 1; // Ensure opacity is reset even if no watermark
    }


    // Quality only affects JPEG/WebP/AVIF
    const mimeType = `image/${outputFormat}`;
    const qualityValueToUse =
      outputFormat === "jpeg" || outputFormat === "webp" || outputFormat === "avif"
        ? qualityValue / 100
        : undefined; // Pass undefined for PNG, which doesn't use quality

    // Get the processed data URL
    let dataURL = ctx.canvas.toDataURL(mimeType, qualityValueToUse);

    if (removeExif) { // Apply EXIF removal for all formats if checked
        EXIF.getData(currentImage, function() { // Use currentImage File object
            EXIF.getAllTags(this);
            // EXIF.deleteAllTags(this); // Incorrect function!

            // Correct way to remove EXIF tags:
            const tags = EXIF.getAllTags(this);
            for (const tag in tags) {
                if (tags.hasOwnProperty(tag)) {
                    delete this.tags[tag]; // Delete each tag individually
                }
            }


            // Re-render the canvas to data URL after EXIF removal - important to use the *same* canvas
            dataURL = ctx.canvas.toDataURL(mimeType, qualityValueToUse);
            resolve(dataURL); // Resolve with data URL after EXIF removal
        });
    } else {
        resolve(dataURL); // Resolve immediately if no EXIF removal or for PNG
    }
  };

  const handleDownloadAll = () => {
    const zip = new JSZip();

    processedImages.forEach(({ dataUrl, outputName }) => {
      const byteString = atob(dataUrl.split(",")[1]);
      const mimeString = dataUrl.split(",")[0].split(":")[1].split(";")[0];
      const arrayBuffer = new ArrayBuffer(byteString.length);
      const uint8Array = new Uint8Array(arrayBuffer);

      for (let i = 0; i < byteString.length; i++) {
        uint8Array[i] = byteString.charCodeAt(i);
      }

      zip.file(outputName, uint8Array, { binary: true });
    });

    zip.generateAsync({ type: "blob" }).then((content) => {
      saveAs(content, "processed_images.zip");
    });
  };

  const openModal = (dataUrl) => {
    setSelectedImage(dataUrl);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  const toggleDarkMode = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  const removeImage = (index) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
      if (updatedImages.length > 0) {
        setPreviewImage(URL.createObjectURL(updatedImages[0]));
    } else {
        setPreviewImage(null); // Clear preview if no images
    }
  };

  const handleRemoveProcessedImage = (event, indexToRemove) => { // ADD event argument
    event.stopPropagation(); // Stop event propagation
    const updatedProcessedImages = processedImages.filter((_, index) => index !== indexToRemove);
    setProcessedImages(updatedProcessedImages);
  };


  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files).filter(
      (file) => file.type.startsWith("image/")
    );

    if (files.length > 0) {
      setImages([...images, ...files]);
    } else {
      alert("Please upload image files only.");
    }
  };

  const handleFileSelect = (e) => {
    const newFiles = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
    if (newFiles.length > 0) {
        setImages([...images, ...newFiles]);
    } else {
        alert("Please upload image files only.");
    }
};

const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
        setLogoSource('upload');
        setLogo(file);
    }
};

const handlePresetLogoSelect = (preset) => {
    setLogoSource(preset);
    //  Don't setLogo here; we'll use the preset URL directly.
};

const handleWatermarkDragStart = (e) => {
    setIsDraggingWatermark(true);
    watermarkRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initialPosition: watermarkPosition,
    };
};

const handleWatermarkDrag = (e) => {
    if (!isDraggingWatermark || previewImageRef.current || !watermarkRef.current) return;

    const rect = previewImageRef.current.getBoundingClientRect();
    const deltaX = e.clientX - watermarkRef.current.startX;
    const deltaY = e.clientY - watermarkRef.current.startY;

    // Calculate position deltas as percentages of the image dimensions
    const deltaXPercent = deltaX / rect.width;
    const deltaYPercent = deltaY / rect.height;


    setWatermarkPosition({
        x: Math.max(0, Math.min(1, watermarkRef.current.initialPosition.x + deltaXPercent)),
        y: Math.max(0, Math.min(1, watermarkRef.current.initialPosition.y + deltaYPercent)),
    });
};


const handleWatermarkDragEnd = () => {
    setIsDraggingWatermark(false);
    watermarkRef.current = null;
};


const handlePresetWatermarkPosition = (position) => {
    setWatermarkPosition(position);
};


const LogoPreview = () => { //RENAME TO WatermarkPreview
  let logoSrc;

  if (logoSource === 'upload' && logo) {
      logoSrc = URL.createObjectURL(logo);
  } else if (logoSource.startsWith('preset')) {
      const presetIndex = parseInt(logoSource.replace('preset', ''), 10) - 1;
      logoSrc = presetLogos[presetIndex];
  }

  if (!logoSrc && !textWatermark && !(tileTextWatermarkEnabled && tileWatermarkText) && !tileLogoEnabled) return null; // ADD tileLogoEnabled condition

    const previewCanvasRef = useRef(null); // Ref for preview canvas

    useEffect(() => {
        if (!previewImageRef.current || !previewCanvasRef.current || !(tileTextWatermarkEnabled && tileWatermarkText)) return;

        const img = previewImageRef.current;
        const canvas = previewCanvasRef.current;
        const ctx = canvas.getContext('2d');

        canvas.width = img.naturalWidth;  // Use naturalWidth for original image dimensions
        canvas.height = img.naturalHeight; // Use naturalHeight
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas

        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.fillStyle = watermarkColor;
        ctx.globalAlpha = fontOpacity / 100;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";

        const text = tileWatermarkText;
        const textMetrics = ctx.measureText(text);
        const textWidth = textMetrics.width;
        const textHeight = fontSize * 1.5;

        for (let x = 0; x < canvas.width; x += textWidth * 2) {
            for (let y = 0; y < canvas.height; y += textHeight * 2) {
                ctx.fillText(text, x, y);
            }
        }
        ctx.globalAlpha = 1; // Reset alpha

    }, [tileTextWatermarkEnabled, tileWatermarkText, fontSize, fontFamily, watermarkColor, fontOpacity, previewImage]);


    const logoWidth = logoScale; // Use percentage for width
    const logoHeight = logoScale;

    // Logo Preview for Tiled Logos
    useEffect(() => {
        if (!previewImageRef.current || !previewCanvasRef.current || !tileLogoEnabled || !logoSrc) return;

        const img = previewImageRef.current;
        const logoPreviewCanvas = previewCanvasRef.current;
        const logoPreviewCtx = logoPreviewCanvas.getContext('2d');
        const logoImgForPreview = new Image();
        logoImgForPreview.src = logoSrc;

        logoImgForPreview.onload = () => {
            logoPreviewCanvas.width = img.naturalWidth;
            logoPreviewCanvas.height = img.naturalHeight;
            logoPreviewCtx.clearRect(0, 0, logoPreviewCanvas.width, logoPreviewCanvas.height); // Clear canvas

            const logoAspectRatio = logoImgForPreview.width / logoImgForPreview.height;
            let logoPreviewWidth = (logoPreviewCanvas.width * logoScale) / 100;
            let logoPreviewHeight = logoPreviewWidth / logoAspectRatio;
            const logoSpacingX = logoPreviewWidth * 1.5;
            const logoSpacingY = logoPreviewHeight * 1.5;

            logoPreviewCtx.globalAlpha = logoOpacity / 100; // Apply opacity

            for (let x = 0; x < logoPreviewCanvas.width; x += logoSpacingX) {
                for (let y = 0; y < logoPreviewCanvas.height; y += logoSpacingY) {
                    // Rotate the logo
                    logoPreviewCtx.save(); // Save context
                    logoPreviewCtx.translate(x + logoPreviewWidth / 2, y + logoPreviewHeight / 2); // Translate to logo center
                    logoPreviewCtx.rotate(logoRotation * Math.PI / 180); // Rotate
                    logoPreviewCtx.translate(-(x + logoPreviewWidth / 2), -(y + logoPreviewHeight / 2)); // Translate back

                    logoPreviewCtx.drawImage(logoImgForPreview, x, y, logoPreviewWidth, logoPreviewHeight);
                    logoPreviewCtx.restore(); // Restore context
                }
            }
            logoPreviewCtx.globalAlpha = 1; // Reset opacity
        };


    }, [tileLogoEnabled, logoSrc, logoScale, logoOpacity, logoRotation, previewImage]);


    return (
        <>
        {logoSrc && !tileLogoEnabled && ( // Conditionally render single logo preview
            <div
                className="logo-preview"
                style={{
                    position: 'absolute',
                    left: `calc(${logoPosition.x * 100}% - ${logoWidth / 2}%)`,
                    top: `calc(${logoPosition.y * 100}% - ${logoHeight / 2}%)`,
                    width: `${logoWidth}%`,
                    height: `${logoHeight}%`,
                    opacity: logoOpacity / 100,
                    pointerEvents: 'none',
                    transform: `rotate(${logoRotation}deg)` // Apply rotation to the preview
                }}
            >
                <img src={logoSrc} alt="Logo Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
        )}

        {tileLogoEnabled && logoSrc && ( // Render canvas for tiled logo preview
            <div
                className="tile-logo-preview"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    overflow: 'hidden' // Clip any overflow
                }}
            >
                <canvas ref={previewCanvasRef} style={{maxWidth: '100%', maxHeight: '100%'}}/>
            </div>
        )}

        {textWatermark && !tileTextWatermarkEnabled && ( // Only show single watermark if tile watermark is not enabled
            <div
                className="text-watermark-preview"
                style={{
                    position: 'absolute',
                    left: `calc(${watermarkPosition.x * 100}%)`, // Position from state
                    top: `calc(${watermarkPosition.y * 100}%)`,  // Position from state
                    transform: `translate(-${watermarkPosition.x * 100}%, -${watermarkPosition.y * 100}%)`, // Center text based on position
                    fontSize: `${fontSize}px`,
                    fontFamily: fontFamily, // Apply font family to preview
                    color: watermarkColor, // Apply watermark color to preview
                    opacity: fontOpacity / 100, // Apply font opacity to preview
                    pointerEvents: isDraggingWatermark ? 'none' : 'auto', // Only allow interaction when not dragging
                    cursor: 'grab',
                    userSelect: 'none', // Prevent text selection during drag
                }}
                draggable="true"
                onDragStart={handleWatermarkDragStart}
                onDrag={handleWatermarkDrag}
                onDragEnd={handleWatermarkDragEnd}
            >
                {textWatermark}
            </div>
        )}
         {tileTextWatermarkEnabled && tileWatermarkText && (
                <div
                    className="tile-text-watermark-preview"
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none',
                    }}
                >
                   <canvas ref={previewCanvasRef} style={{maxWidth: '100%', maxHeight: '100%'}}/>
                </div>
            )}
        </>
    );
};

  return (
    <div className={`App ${isDarkMode ? "dark-mode" : ""}`}>
      <h1>Image Processor</h1>

      {/* Dark Mode Toggle */}
      <div style={{ marginBottom: "20px" }}>
        <label>
          <input type="checkbox" checked={isDarkMode} onChange={toggleDarkMode} />
          Enable Dark Mode
        </label>
      </div>

      {/* Name Suffix */}
      <div>
        <label>
          Name Suffix (Base Name):
          <input
            type="text"
            value={nameSuffix}
            onChange={(e) => setNameSuffix(e.target.value)}
          />
        </label>
      </div>

      {/* Image Upload */}
      <div>
        <label>
          Upload Images:

        </label>
      </div>

      {/* Drag and Drop Zone */}
      <div
        className="drop-zone"
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={handleDrop}
      >
        <p>Drag and drop images here
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
          />
        </p>
        {/* Image List */}
        <div className="image-list">
          {images.map((file, index) => (
            <div key={index} className="image-item">
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="image-preview1"
              />
              <div className="image-actions">
                <button className="remove-image-button" onClick={() => removeImage(index)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      </div>

        {/* Preview Image and Logo Positioning */}
      {previewImage && (
        <div className="preview-container">
          <div className="interactive-preview">
            <img
              src={previewImage}
              alt="Preview"
              className="preview-image interactive"
              onClick={handleLogoPositionClick}
              ref={previewImageRef}
            />
             <LogoPreview />
            {/* Visual Indicator for Logo Position */}
            {logo && !tileLogoEnabled && ( //Conditionally render indicator for single logo only
              <div
                className="logo-indicator"
                style={{
                  left: `calc(${logoPosition.x * 100}% - 10px)`, // 10px is half the indicator size
                  top: `calc(${logoPosition.y * 100}% - 10px)`,  // 10px is half the indicator size
                }}
              ></div>
            )}
          </div>
        </div>
      )}


      {/* Logo Upload and Preset Selection */}
    <div>
        <label>
            Upload Logo:<br />
            <input type="file" onChange={handleLogoUpload} />
        </label>
        <div className="preset-logo-buttons">
          <label>Or select a preset logo:</label><br />
          <button onClick={() => handlePresetLogoSelect('preset1')}>Preset 1</button>
          <button onClick={() => handlePresetLogoSelect('preset2')}>Preset 2</button>
          <button onClick={() => handlePresetLogoSelect('preset3')}>Preset 3</button>
          <button onClick={() => handlePresetLogoSelect('preset4')}>Preset 4</button> {/* Added fourth preset button */}
      </div>
    </div>

          {/* Tile Logo Watermark Option */}
          <div>
        <label>
          Tile Logo:
          <input
            type="checkbox"
            checked={tileLogoEnabled}
            onChange={(e) => setTileLogoEnabled(e.target.checked)}
          />
        </label>
      </div>

      {/* Logo Settings */}
      <div>
        <div className="range-container">
        <label>
          Logo Scale (%):
          </label>
          <input
            type="range"
            min="1"
            max="100"
            step="1"
            value={logoScale}
            onChange={(e) => setLogoScale(parseInt(e.target.value))}
          />
          <span className="range-value">{logoScale}%</span>
        </div>

        <div className="range-container">
        <label>
          Logo Opacity (%):
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={logoOpacity}
            onChange={(e) => setLogoOpacity(parseInt(e.target.value))}
          />
          <span className="range-value">{logoOpacity}%</span>
        </div>
         {/* Logo Rotation */}
         <div className="range-container">
            <label>Logo Rotation (degrees):</label>
            <input
                type="range"
                min="0"
                max="360"
                step="1"
                value={logoRotation}
                onChange={(e) => setLogoRotation(parseInt(e.target.value))}
            />
            <span className="range-value">{logoRotation}°</span>
        </div>
      </div>

       {/* Quality Settings */}
       <div>
        <div className="range-container">
          <label>Quality (JPEG/WebP):</label>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={qualityValue}
            onChange={(e) => setQualityValue(parseInt(e.target.value))}
          />
          <span className="range-value">{qualityValue}%</span>
        </div>
      </div>

      {/* Output Format */}
      <div>
        <label>
          Output Format:
          <select
            value={outputFormat}
            onChange={(e) => setOutputFormat(e.target.value)}
          >
            <option value="jpeg">JPEG</option>
            <option value="png">PNG</option>
            <option value="webp">WebP</option>
            <option value="avif">AVIF</option>
          </select>
        </label>
      </div>

      {/* Text Watermark */}
      <div>
        <label>
          Text Watermark:
          <input
            type="text"
            value={textWatermark}
            onChange={(e) => setTextWatermark(e.target.value)}
          />
        </label>

        <label>
          Font Size:
          <input
            type="number"
            value={fontSize}
            min="8"
            max="72"
            onChange={(e) => setFontSize(parseInt(e.target.value))}
          />
        </label>
         {/* Font Family */}
         <label>
            Font Family:
            <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
            >
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
                <option value="Verdana">Verdana</option>
            </select>
        </label>
         {/* Font Opacity */}
         <div className="range-container">
            <label>Font Opacity (%):</label>
            <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={fontOpacity}
                onChange={(e) => setFontOpacity(parseInt(e.target.value))}
            />
            <span className="range-value">{fontOpacity}%</span>
        </div>
         {/* Watermark Color */}
         <label>
            Watermark Color:
            <input
                type="color"
                value={watermarkColor}
                onChange={(e) => setWatermarkColor(e.target.value)}
            />
        </label>
      </div>

      {/* Tile Text Watermark Options */}
      <div>
        <label>
          Tile Text Watermark:
          <input
            type="checkbox"
            checked={tileTextWatermarkEnabled}
            onChange={(e) => setTileTextWatermarkEnabled(e.target.checked)}
          />
        </label>
        {tileTextWatermarkEnabled && (
          <label>
            Tile Watermark Text:
            <input
              type="text"
              value={tileWatermarkText}
              onChange={(e) => setTileWatermarkText(e.target.value)}
            />
          </label>
        )}
      </div>

      {/* Watermark Preset Positions */}
      <div className="preset-watermark-positions">
          <label>Preset Watermark Positions:</label><br />
          <button onClick={() => handlePresetWatermarkPosition({ x: 0.025, y: 0.025 })}>Top-Left</button>
          <button onClick={() => handlePresetWatermarkPosition({ x: 0.5, y: 0.025 })}>Top-Center</button>
          <button onClick={() => handlePresetWatermarkPosition({ x: 0.95, y: 0.025 })}>Top-Right</button><br />
          <button onClick={() => handlePresetWatermarkPosition({ x: 0.025, y: 0.5 })}>Center-Left</button>
          <button onClick={() => handlePresetWatermarkPosition({ x: 0.5, y: 0.5 })}>Center</button>
          <button onClick={() => handlePresetWatermarkPosition({ x: 0.95, y: 0.5 })}>Center-Right</button><br />
          <button onClick={() => handlePresetWatermarkPosition({ x: 0.025, y: 0.95 })}>Bottom-Left</button>
          <button onClick={() => handlePresetWatermarkPosition({ x: 0.5, y: 0.95 })}>Bottom-Center</button>
          <button onClick={() => handlePresetWatermarkPosition({ x: 0.95, y: 0.95 })}>Bottom-Right</button>
      </div>


      {/* Background Color */}
      <div>
        <label>
          Background Color:
          <input
            type="color"
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
          />
        </label>
      </div>

      {/* Crop Settings */}
      <div>
        <label>
          Crop Ratio:
          <select
            value={cropRatio}
            onChange={(e) => setCropRatio(e.target.value)}
          >
            <option value="none">None</option>
            <option value="16:9">16:9</option>
            <option value="4:3">4:3</option>
            <option value="1:1">1:1</option>
            <option value="nocropimage">1:1 without image cropping</option>
          </select>
        </label>
      </div>

       {/* Remove Background Toggle */}
       <div>
        <label>
          Remove Background:
          <input
            type="checkbox"
            checked={removeBackground}
            onChange={(e) => setRemoveBackground(e.target.checked)}
          />
        </label>
      </div>

      {/* Remove EXIF Data Toggle */}
      <div>
        <label>
          Remove EXIF Data (JPEG/WebP/PNG/AVIF):
          <input
            type="checkbox"
            checked={removeExif}
            onChange={(e) => setRemoveExif(e.target.checked)}
          />
        </label>
      </div>

      {/* Process Button */}
      <button onClick={handleProcess}>Process Images</button>

      {/* Preview Section */}
      <div className="preview-container">
        {processedImages.length > 0 ? (
          processedImages.map(({ dataUrl, outputName }, index) => (
            <div key={index} className="image-preview"  onClick={() => openModal(dataUrl)}>
              <img
                src={dataUrl}
                alt={outputName}
                className="preview-image"
              />
               <button className="remove-preview-button" onClick={(event) => handleRemoveProcessedImage(event, index)}>Remove</button>
            </div>
          ))
        ) : (
          <div className="no-images">
            <p>No images to preview.</p>
          </div>
        )}
      </div>

      {/* Download All Button */}
      {processedImages.length > 0 && (
        <button onClick={handleDownloadAll}>Download All Images</button>
      )}

      {/* Modal for Image Preview */}
      {selectedImage && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="close-button" onClick={closeModal}>
              &times;
            </span>
            <img
              src={selectedImage}
              alt="Preview"
              className="modal-image"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
