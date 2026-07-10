import { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import './ImageUploader.css';

const ImageUploader = ({ label, onFileSelect, preview }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // 3D Tilt Effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [10, -10]);
  const rotateY = useTransform(x, [-100, 100], [-10, 10]);

  const handleMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(event.clientX - centerX);
    y.set(event.clientY - centerY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const onDragLeave = () => {
    setIsDragActive(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    if (!file.type.match('image.*')) {
      alert('Please upload an image file (JPEG or PNG).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      onFileSelect(file, e.target.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="uploader-container">
      <h3>{label}</h3>
      <motion.div
        className={`uploader-box glass-panel ${isDragActive ? 'drag-active' : ''}`}
        style={{ rotateX, rotateY, perspective: 1000 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current.click()}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <input
          type="file"
          accept="image/jpeg, image/png"
          ref={fileInputRef}
          onChange={handleChange}
          style={{ display: 'none' }}
        />
        
        {preview ? (
          <motion.img 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            src={preview} 
            alt={label} 
            className="preview-image" 
          />
        ) : (
          <div className="uploader-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
            </svg>
            <p>Click or drag image here</p>
            <span className="text-muted">JPEG or PNG only</span>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ImageUploader;
