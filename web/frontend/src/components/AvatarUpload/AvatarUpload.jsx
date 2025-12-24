import React, { useState, useRef } from 'react'
import './AvatarUpload.css'

const AvatarUpload = ({ currentAvatar, onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [cropData, setCropData] = useState({ x: 0, y: 0, size: 200 })
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [avatarKey, setAvatarKey] = useState(Date.now()) // For cache busting
  const fileInputRef = useRef(null)
  const imageRef = useRef(null)
  const canvasRef = useRef(null)

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result)
        setCropData({ x: 0, y: 0, size: 200 })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDragStart = (e) => {
    setIsDragging(true)
    const startX = e.clientX - cropData.x
    const startY = e.clientY - cropData.y

    const handleDragMove = (moveEvent) => {
      if (imageRef.current) {
        const rect = imageRef.current.getBoundingClientRect()
        let newX = moveEvent.clientX - startX
        let newY = moveEvent.clientY - startY
        
        // Constrain within image bounds
        newX = Math.max(0, Math.min(newX, rect.width - cropData.size))
        newY = Math.max(0, Math.min(newY, rect.height - cropData.size))
        
        setCropData(prev => ({ ...prev, x: newX, y: newY }))
      }
    }

    const handleDragEnd = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleDragMove)
      document.removeEventListener('mouseup', handleDragEnd)
    }

    document.addEventListener('mousemove', handleDragMove)
    document.addEventListener('mouseup', handleDragEnd)
  }

  const handleResize = (e, direction) => {
    e.stopPropagation()
    const startSize = cropData.size
    const startX = e.clientX
    const startY = e.clientY

    const handleResizeMove = (moveEvent) => {
      if (imageRef.current) {
        const rect = imageRef.current.getBoundingClientRect()
        const deltaX = moveEvent.clientX - startX
        const deltaY = moveEvent.clientY - startY
        const delta = Math.max(deltaX, deltaY)
        
        let newSize = startSize + delta
        const maxSize = Math.min(rect.width - cropData.x, rect.height - cropData.y)
        newSize = Math.max(100, Math.min(newSize, maxSize))
        
        setCropData(prev => ({ ...prev, size: newSize }))
      }
    }

    const handleResizeEnd = () => {
      document.removeEventListener('mousemove', handleResizeMove)
      document.removeEventListener('mouseup', handleResizeEnd)
    }

    document.addEventListener('mousemove', handleResizeMove)
    document.addEventListener('mouseup', handleResizeEnd)
  }

  const getCroppedImage = () => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current
      const image = imageRef.current
      
      if (!canvas || !image) {
        resolve(null)
        return
      }

      const scaleX = image.naturalWidth / image.width
      const scaleY = image.naturalHeight / image.height

      canvas.width = 400
      canvas.height = 400

      const ctx = canvas.getContext('2d')
      ctx.drawImage(
        image,
        cropData.x * scaleX,
        cropData.y * scaleY,
        cropData.size * scaleX,
        cropData.size * scaleY,
        0,
        0,
        400,
        400
      )

      canvas.toBlob((blob) => {
        resolve(blob)
      }, 'image/jpeg', 0.9)
    })
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    try {
      const croppedBlob = await getCroppedImage()
      const formData = new FormData()
      formData.append('file', croppedBlob, 'avatar.jpg')

      const token = localStorage.getItem('access_token')
      // console.log('Token from localStorage:', token)
      
      if (!token) {
        alert('Không tìm thấy token. Vui lòng đăng nhập lại.')
        setIsUploading(false)
        return
      }

      const response = await fetch('http://localhost:5000/api/v1/user/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      console.log('Upload response status:', response.status)
      const data = await response.json()
      console.log('Upload response data:', data)
      
      if (data.status === 'success') {
        alert('Upload avatar thành công!')
        setSelectedFile(null)
        setPreview(null)
        setAvatarKey(Date.now()) // Update key to force image reload
        if (onUploadSuccess) {
          onUploadSuccess(data.url)
        }
      } else {
        alert('Upload thất bại: ' + data.message)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Lỗi khi upload avatar: ' + error.message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownload = async () => {
    if (!currentAvatar) {
      alert('Vui lòng Upload avatar trước.')
      return
    }

    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        alert('Vui lòng đăng nhập lại.')
        return
      }

      // ============================= NEED CHECK ====================================
      // Call backend proxy endpoint to download with proper headers
      const link = document.createElement('a')
      link.href = `http://localhost:5000/api/v1/user/download-avatar?token=${token}`
      link.download = `avatar_${Date.now()}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Download error:', error)
      alert('Lỗi khi tải xuống avatar: ' + error.message)
    }
  }

  return (
    <div className="avatar-upload-container">
      <div className="avatar-display">
        <div className="avatar-circle">
          {currentAvatar ? (
            <img src={`${currentAvatar}?v=${avatarKey}`} alt="Avatar" key={avatarKey} />
          ) : (
            <div className="avatar-placeholder">
              <span>👤</span>
            </div>
          )}
        </div>
        <div className="avatar-actions">
          <button 
            className="btn-change-avatar"
            onClick={() => fileInputRef.current?.click()}
          >
            📷 Change Avatar
          </button>
          {currentAvatar && (
            <button 
              className="btn-download-avatar"
              onClick={handleDownload}
            >
              ⬇️ Download
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      {preview && (
        <div className="crop-modal">
          <div className="crop-modal-content">
            <h3>Crop Avatar</h3>
            <div className="crop-container">
              <img
                ref={imageRef}
                src={preview}
                alt="Preview"
                className="crop-image"
              />
              <div
                className="crop-box"
                style={{
                  left: cropData.x,
                  top: cropData.y,
                  width: cropData.size,
                  height: cropData.size,
                  cursor: isDragging ? 'grabbing' : 'grab'
                }}
                onMouseDown={handleDragStart}
              >
                <div
                  className="resize-handle"
                  onMouseDown={(e) => handleResize(e, 'se')}
                />
              </div>
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <div className="crop-actions">
              <button 
                className="btn-upload"
                onClick={handleUpload}
                disabled={isUploading}
              >
                {isUploading ? '⏳ Uploading...' : '✓ Upload'}
              </button>
              <button 
                className="btn-cancel"
                onClick={() => {
                  setSelectedFile(null)
                  setPreview(null)
                }}
                disabled={isUploading}
              >
                ✗ Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AvatarUpload
