import React, { useState, useRef, useEffect } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import "./styles.css";
import axios from 'axios';
import * as EXIF from 'exif-js';

function App() {
  const [images, setImages] = useState([]);
  const [logo, setLogo] = useState(null);
  const [textWatermark, setTextWatermark] = useState("");
  const [fontSize, setFontSize] = useState(20);
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF");
  const [cropRatio, setCropRatio] = useState("none");
  const [outputFormat, setOutputFormat] = useState("png");
  const [processedImages, setProcessedImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [logoPosition, setLogoPosition] = useState({ x: 0.5, y: 0.9 });
  const [logoScale, setLogoScale] = useState(20);
  const [logoOpacity, setLogoOpacity] = useState(100);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  const previewImageRef = useRef(null);
  const [qualityValue, setQualityValue] = useState(100);
  const [removeBackground, setRemoveBackground] = useState(false);
  const [logoSource, setLogoSource] = useState('upload');
  const presetLogos = [
    '/img/logo1.png',
    '/img/logo2.png',
    '/img/logo3.png',
    '/img/logo4.png'
  ];
  const [logoRotation, setLogoRotation] = useState(0);
  const [watermarkPosition, setWatermarkPosition] = useState({ x: 0.95, y: 0.95 });
  const [isDraggingWatermark, setIsDraggingWatermark] = useState(false);
  const watermarkRef = useRef(null);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontOpacity, setFontOpacity] = useState(80);
  const [watermarkColor, setWatermarkColor] = useState('#ffffff');
  const [removeExif, setRemoveExif] = useState(false);
  const [tileTextWatermarkEnabled, setTileTextWatermarkEnabled] = useState(false);
  const [tileWatermarkText, setTileWatermarkText] = useState("Watermark Text");
  const [tileLogoEnabled, setTileLogoEnabled] = useState(false);
  const [nameSuffix, setNameSuffix] = useState("Finesse Glow");
  const [quality, setQuality] = useState(2);
  const [isVideo, setIsVideo] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [videoResolution, setVideoResolution] = useState("original");
  const [videoFilter, setVideoFilter] = useState("none");
  const [videoFormat, setVideoFormat] = useState("mp4");
  const ffmpegRef = useRef(new FFmpeg());
  const [isFFmpegLoaded, setIsFFmpegLoaded] = useState(false);

  const QUALITY_MAP = {
    1: 1.0,
    2: 0.95,
    3: 0.75,
    4: 0.5
  };

  useEffect(() => {
    if (images.length > 0) {
      setPreviewImage(URL.createObjectURL(images[0]));
    } else {
      setPreviewImage(null);
    }
  }, [images]);

  useEffect(() => {
    const load = async () => {
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      const ffmpeg = ffmpegRef.current;
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      setIsFFmpegLoaded(true);
    };
    load();
  }, []);

  // ... (rest of the existing functions remain unchanged)

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    const mediaFiles = files.filter(file => 
      file.type.startsWith("image/") || file.type.startsWith("video/")
    );

    if (mediaFiles.length > 0) {
      const file = mediaFiles[0];
      if (file.type.startsWith("video/")) {
        setIsVideo(true);
        setVideoFile(file);
        setVideoPreview(URL.createObjectURL(file));
      } else {
        setIsVideo(false);
        setImages([...images, ...mediaFiles]);
      }
    }
  };

  const processVideo = async () => {
    if (!videoFile || !isFFmpegLoaded) return;

    const ffmpeg = ffmpegRef.current;
    const inputFileName = 'input' + videoFile.name.substring(videoFile.name.lastIndexOf('.'));
    const outputFileName = `output.${videoFormat}`;

    await ffmpeg.writeFile(inputFileName, await fetchFile(videoFile));

    let command = ['-i', inputFileName];

    if (videoResolution !== "original") {
      const [width, height] = videoResolution.split('x');
      command.push('-vf', `scale=${width}:${height}`);
    }

    if (videoFilter !== "none") {
      switch (videoFilter) {
        case "grayscale":
          command.push('-vf', 'colorchannelmixer=.3:.4:.3:0:.3:.4:.3:0:.3:.4:.3');
          break;
        case "sepia":
          command.push('-vf', 'colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131');
          break;
        case "blur":
          command.push('-vf', 'boxblur=2:2');
          break;
      }
    }

    if (logo) {
      const logoFileName = 'logo.png';
      await ffmpeg.writeFile(logoFileName, await fetchFile(logo));
      command.push('-i', logoFileName);
      command.push('-filter_complex', `[0:v][1:v] overlay=W-w-10:10`);
    }

    command.push('-c:a', 'copy');
    command.push(outputFileName);

    await ffmpeg.exec(command);

    const data = await ffmpeg.readFile(outputFileName);
    const processedVideo = new Blob([data.buffer], { type: `video/${videoFormat}` });
    const url = URL.createObjectURL(processedVideo);

    setVideoPreview(url);
  };

  // ... (rest of the component remains unchanged)

  return (
    <div className={`App ${isDarkMode ? "dark-mode" : ""}`}>
      <h1>Media Processor</h1>

      {/* ... (existing controls) ... */}

      {/* Video specific controls */}
      {isVideo && (
        <div className="video-controls">
          <label>
            Video Resolution:
            <select
              value={videoResolution}
              onChange={(e) => setVideoResolution(e.target.value)}
            >
              <option value="original">Original</option>
              <option value="1920x1080">1080p</option>
              <option value="1280x720">720p</option>
              <option value="854x480">480p</option>
            </select>
          </label>

          <label>
            Video Filter:
            <select
              value={videoFilter}
              onChange={(e) => setVideoFilter(e.target.value)}
            >
              <option value="none">None</option>
              <option value="grayscale">Grayscale</option>
              <option value="sepia">Sepia</option>
              <option value="blur">Blur</option>
            </select>
          </label>

          <label>
            Output Format:
            <select
              value={videoFormat}
              onChange={(e) => setVideoFormat(e.target.value)}
            >
              <option value="mp4">MP4</option>
              <option value="webm">WebM</option>
              <option value="mov">MOV</option>
            </select>
          </label>

          <button onClick={processVideo}>Process Video</button>
        </div>
      )}

      {/* Video Preview */}
      {isVideo && videoPreview && (
        <div className="video-preview">
          <video 
            controls 
            src={videoPreview}
            style={{ maxWidth: '100%', marginTop: '20px' }}
          />
        </div>
      )}

      {/* ... (rest of the existing components) ... */}
    </div>
  );
}

export default App;