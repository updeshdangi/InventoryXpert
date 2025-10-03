import React, { useState, useRef, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';

const BarcodeScanner = ({ onScan }) => {
  const [scanning, setScanning] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const videoRef = useRef(null);
  const codeReader = useRef(null);

  useEffect(() => {
    codeReader.current = new BrowserMultiFormatReader();

    if (scanning) {
      console.log('Starting camera scan...');
      codeReader.current
        .listVideoInputDevices()
        .then((videoInputDevices) => {
          console.log('Video input devices:', videoInputDevices);
          if (videoInputDevices.length > 0) {
            console.log('Using device:', videoInputDevices[0].deviceId);
            codeReader.current.decodeFromVideoDevice(
              videoInputDevices[0].deviceId,
              videoRef.current,
              (result, err) => {
                if (result) {
                  console.log('Camera scanned result:', result.getText());
                  onScan(result.getText());
                }
                if (err) {
                  console.error('Camera scan error:', err);
                }
              }
            );
          } else {
            console.error('No video input devices found');
          }
        })
        .catch((err) => {
          console.error('Error listing video devices:', err);
        });
    } else {
      if (codeReader.current) {
        codeReader.current.reset();
      }
    }

    return () => {
      if (codeReader.current) {
        codeReader.current.reset();
      }
    };
  }, [scanning, onScan]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    console.log('File selected:', file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        console.log('File loaded:', reader.result);
        const img = new Image();
        img.onload = () => {
          console.log('Image loaded, decoding...');
          codeReader.current.decodeFromImage(img).then(result => {
            console.log('Decoded result:', result);
            if (result) {
              console.log('Scanned code:', result.getText());
              onScan(result.getText());
            }
          }).catch(err => {
            console.error('Error decoding barcode from image:', err);
          });
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <button
        onClick={() => setScanning((prev) => !prev)}
        className="px-4 py-2 bg-blue-600 text-white rounded mb-2"
      >
        {scanning ? 'Stop Scanning' : 'Start Scanning'}
      </button>
      {scanning && <video ref={videoRef} style={{ width: '100%', height: 'auto' }} />}
      <div className="mt-4">
        <label className="block mb-2 font-semibold">Upload Barcode Image:</label>
        <input type="file" accept="image/*" onChange={handleFileChange} />
        {selectedFile && <p>Selected file: {selectedFile.name}</p>}
      </div>
    </div>
  );
};

export default BarcodeScanner;
