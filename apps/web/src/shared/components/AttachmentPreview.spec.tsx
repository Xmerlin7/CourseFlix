import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AttachmentPreview, AttachmentPreviewList } from './AttachmentPreview'
import { ImageLightbox } from './ImageLightbox'

describe('ImageLightbox', () => {
  it('renders nothing when isOpen is false', () => {
    render(<ImageLightbox isOpen={false} src="http://example.com/img.png" onClose={() => {}} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders modal with image and title when isOpen is true', () => {
    render(
      <ImageLightbox
        isOpen={true}
        src="http://example.com/screenshot.png"
        fileName="screenshot.png"
        onClose={() => {}}
      />,
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('screenshot.png')).toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveAttribute('src', 'http://example.com/screenshot.png')
  })

  it('calls onClose when close button is clicked or Escape key pressed', async () => {
    const handleClose = vi.fn()
    render(
      <ImageLightbox
        isOpen={true}
        src="http://example.com/screenshot.png"
        fileName="screenshot.png"
        onClose={handleClose}
      />,
    )

    const closeBtn = screen.getByRole('button', { name: 'إغلاق' })
    await userEvent.click(closeBtn)
    expect(handleClose).toHaveBeenCalledTimes(1)

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(handleClose).toHaveBeenCalledTimes(2)
  })
})

describe('AttachmentPreview', () => {
  it('renders image thumbnail and opens lightbox on click', async () => {
    const attachment = {
      id: 'att-1',
      fileName: 'diagram.png',
      mimeType: 'image/png',
    }

    render(<AttachmentPreview attachment={attachment} />)

    const img = screen.getByAltText('diagram.png')
    expect(img).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    const wrapper = screen.getByRole('button', { name: 'عرض diagram.png بالحجم الكامل' })
    await userEvent.click(wrapper)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('falls back to file card when image fails to load', () => {
    const attachment = {
      id: 'att-1',
      fileName: 'broken.jpg',
      mimeType: 'image/jpeg',
    }

    render(<AttachmentPreview attachment={attachment} />)

    const img = screen.getByAltText('broken.jpg')
    fireEvent.error(img)

    expect(screen.getByText('broken.jpg')).toBeInTheDocument()
    expect(screen.getByText('فتح / تحميل')).toBeInTheDocument()
  })

  it('renders file card for PDF attachments with proper download link and icon', () => {
    const attachment = {
      id: 'att-pdf',
      fileName: 'homework.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 2500000,
    }

    render(<AttachmentPreview attachment={attachment} />)

    expect(screen.getByText('homework.pdf')).toBeInTheDocument()
    expect(screen.getByText(/مستند PDF • 2.4 MB/)).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /homework.pdf/ })
    expect(link).toHaveAttribute('href', expect.stringContaining('/attachments/att-pdf'))
  })

  it('renders list of attachments with AttachmentPreviewList', () => {
    const attachments = [
      { id: '1', fileName: 'doc.pdf', mimeType: 'application/pdf' },
      { id: '2', fileName: 'photo.jpg', mimeType: 'image/jpeg' },
    ]

    render(<AttachmentPreviewList attachments={attachments} />)

    expect(screen.getByText('doc.pdf')).toBeInTheDocument()
    expect(screen.getByAltText('photo.jpg')).toBeInTheDocument()
  })
})
