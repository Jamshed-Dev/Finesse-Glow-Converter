# Finesse Glow Image Processor

Finesse Glow Image Processor is a powerful React-based tool for image processing. It enables users to watermark, crop, resize, and remove backgrounds effortlessly, making it ideal for branding and protecting images.

##Test URL
https://finesseglow.netlify.app/

## 🚀 Features

- 📷 **Image Upload:** Drag and drop or manually select images.
- 🏷️ **Custom Watermarking:** Add text or logo watermarks with adjustable opacity, size, and position.
- 🏆 **Tile Watermarking:** Repeat text or logos across the image for enhanced protection.
- ✂️ **Crop & Resize:** Adjust aspect ratios effortlessly.
- 🎭 **Background Removal:** AI-powered automatic background removal via remove.bg API.
- 🔍 **EXIF Data Removal:** Enhance privacy by stripping metadata.
- 📂 **Multiple Formats:** Supports PNG, JPEG, WebP, and AVIF.
- 📑 **Batch Processing:** Process multiple images in one go.
- 📦 **Download as ZIP:** Get all processed images in a single download.
- 🌙 **Dark Mode:** Switch between light and dark themes.

## 🛠 Installation

### Prerequisites
- Install [Node.js](https://nodejs.org/) and npm/yarn

### Quick Start
```sh
# Clone the repository
git clone https://github.com/Jamshed-Dev/finesse-glow-image-processor.git

# Navigate to the project directory
cd finesse-glow-image-processor

# Install dependencies
npm install  # or yarn install

# Start the development server
npm run dev  # or yarn dev
```

Open `http://localhost:5173` in your browser.

## 🎨 How to Use

1. Upload images using drag & drop or file selection.
2. Configure watermark settings (text/logo, placement, opacity, etc.).
3. Process the images and preview the results.
4. Download processed images individually or as a ZIP file.

## 🔑 API Key Setup (For Background Removal)

This project integrates the [remove.bg API](https://www.remove.bg/api). To enable background removal:
- Sign up on remove.bg and get an API key.
- Update `App.js` with your key:
  ```js
  const apiKey = 'your-api-key-here';
  ```

## 🏗️ Tech Stack

- React.js ⚛️
- JavaScript (ES6+)
- HTML5 & CSS3
- Axios (API handling)
- JSZip (ZIP compression)
- FileSaver.js (Download management)
- EXIF.js (Metadata handling)

## 🤝 Contributing

Want to improve this project? Contributions are welcome!

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-name`).
3. Commit your changes (`git commit -m 'Added feature XYZ'`).
4. Push your branch (`git push origin feature-name`).
5. Open a Pull Request.

## 📜 License

This project is licensed under the MIT License.

## 👤 Author

Developed by [MD Jamshed Alam](https://jamshed.dev/)

[![GitHub](https://img.shields.io/badge/GitHub-Jamshed--Dev-blue?logo=github)](https://github.com/Jamshed-Dev)  
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Jamshed--Dev-blue?logo=linkedin)](https://www.linkedin.com/in/jamshed-dev/)

