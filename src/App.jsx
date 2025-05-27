import React, { useState, useRef, useEffect } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import "./styles.css";
import axios from 'axios';
import * as EXIF from 'exif-js';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isVideo, setIsVideo] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [videoResolution, setVideoResolution] = useState("original");
  const [videoFilter, setVideoFilter] = useState("none");
  const [videoFormat, setVideoFormat] = useState("mp4");
  const ffmpegRef = useRef(new FFmpeg());
  const [isFFmpegLoaded, setIsFFmpegLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize FFmpeg
  useEffect(() => {
    const loadFFmpeg = async () => {
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      const ffmpeg = ffmpegRef.current;
      try {
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        setIsFFmpegLoaded(true);
      } catch (error) {
        console.error('Error loading FFmpeg:', error);
      }
    };
    loadFFmpeg();
  }, []);

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
    if (!videoFile || !isFFmpegLoaded || isProcessing) return;

    try {
      setIsProcessing(true);
      const ffmpeg = ffmpegRef.current;
      const inputFileName = 'input' + videoFile.name.substring(videoFile.name.lastIndexOf('.'));
      const outputFileName = `output.${videoFormat}`;

      // Write input video file
      await ffmpeg.writeFile(inputFileName, await fetchFile(videoFile));

      let filters = [];

      // Add resolution filter if needed
      if (videoResolution !== "original") {
        const [width, height] = videoResolution.split('x');
        filters.push(`scale=${width}:${height}`);
      }

      // Add visual filter if selected
      if (videoFilter !== "none") {
        switch (videoFilter) {
          case "grayscale":
            filters.push('colorchannelmixer=.3:.4:.3:0:.3:.4:.3:0:.3:.4:.3');
            break;
          case "sepia":
            filters.push('colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131');
            break;
          case "blur":
            filters.push('boxblur=2:2');
            break;
        }
      }

      // Construct FFmpeg command
      let command = ['-i', inputFileName];
      
      // Add logo if present
      if (logo) {
        const logoFileName = 'logo.png';
        await ffmpeg.writeFile(logoFileName, await fetchFile(logo));
        command = [
          ...command,
          '-i', logoFileName,
          '-filter_complex', `[0:v][1:v]overlay=main_w-overlay_w-10:10`
        ];
      } else if (filters.length > 0) {
        // If no logo but filters exist, add them
        command = [...command, '-vf', filters.join(',')];
      }

      // Add output options
      command = [
        ...command,
        '-c:a', 'copy',
        outputFileName
      ];

      // Execute FFmpeg command
      await ffmpeg.exec(command);

      // Read the processed file
      const data = await ffmpeg.readFile(outputFileName);
      const processedVideo = new Blob([data.buffer], { type: `video/${videoFormat}` });
      const url = URL.createObjectURL(processedVideo);

      setVideoPreview(url);
    } catch (error) {
      console.error('Error processing video:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // ... (previous functions remain the same)

  return (
    <div className={`App ${isDarkMode ? "dark-mode" : ""}`}>
      <h1>Media Processor</h1>

      {/* File Upload Section */}
      <div className="drop-zone" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
        <p>
          Drag and drop media files here or
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileSelect}
          />
        </p>
      </div>

      {/* Video Controls */}
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

          <button 
            onClick={processVideo}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Process Video'}
          </button>
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
          <button 
            onClick={() => {
              const a = document.createElement('a');
              a.href = videoPreview;
              a.download = `processed_video.${videoFormat}`;
              a.click();
            }}
            className="download-button"
          >
            Download Processed Video
          </button>
        </div>
      )}

      {/* Rest of the existing UI components */}
      {/* ... */}
    </div>
  );
}

export default App;