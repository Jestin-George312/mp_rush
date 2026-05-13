# Marked Document Download - Integration Verification

## System Configuration ✅

### Backend File Serving
- **Upload Directory**: `backend/uploads/`
- **URL Prefix**: `/uploads`
- **Express Middleware**: ✅ Configured in `server.ts` lines 48-50
- **CORS**: ✅ Enabled for uploaded files
- **Access**: Files accessible at `http://localhost:5000/uploads/{filename}`

### Environment Setup
- **Backend Port**: 5000 (or `process.env.PORT`)
- **Frontend API URL**: Uses `VITE_API_URL` environment variable
- **CORS Origin**: `http://localhost:5173` (or `process.env.CLIENT_URL`)

## Feature Implementation Checklist

### ✅ Fully Implemented Components

#### Backend
- [x] Database column `marked_file_path` exists
- [x] Guide review endpoint accepts file uploads
- [x] File upload to Google Drive with local fallback
- [x] File path stored in database
- [x] Student feedback API returns marked_file_path
- [x] Student submission API returns marked_file_path
- [x] Static file serving configured

#### Frontend - Guide Side
- [x] PDF annotation viewer with highlighting
- [x] File attachment logic
- [x] API call with multipart form data
- [x] Success/error notifications

#### Frontend - Student Side
- [x] Download button in FeedbackReview page
- [x] Download button in SubmissionPortal
- [x] Environment variable URL construction
- [x] Download attribute for direct download
- [x] Visual feedback when marked file available

## URL Construction Pattern

### Local Files
```
Stored: `/uploads/highlighted_review.pdf`
Frontend URL: `http://localhost:5000/uploads/highlighted_review.pdf`
Backend serves from: `backend/uploads/highlighted_review.pdf`
```

### Google Drive Files
```
Stored: `https://drive.google.com/file/d/{fileId}/view`
Frontend URL: Same as stored (direct link)
```

## API Response Examples

### Feedback API Response
```json
{
  "data": [
    {
      "id": "doc-123",
      "artifact": "Project Report",
      "deadline": "Milestone 2",
      "guide": "Dr. Smith",
      "date": "2024-05-13",
      "status": "Action Required",
      "file_path": "/uploads/report.pdf",
      "marked_file_path": "/uploads/highlighted_review_2024_05_13.pdf",
      "comments": [
        {
          "text": "Please revise the methodology section.",
          "time": "Latest Review"
        }
      ]
    }
  ]
}
```

### Submissions API Response
```json
{
  "data": [
    {
      "id": 456,
      "name": "Final Report",
      "type": "PDF",
      "status": "Needs Revision",
      "feedback": "Good work but needs corrections",
      "marked_file_path": "/uploads/marked_final_report.pdf",
      "file_path": "/uploads/final_report.pdf",
      "created_at": "2024-05-10T10:30:00Z",
      "deadline_title": "Final Submission"
    }
  ]
}
```

## Step-by-Step Verification Process

### 1. Backend Verification
```bash
# Check if uploads directory exists
ls -la backend/uploads/

# Check if marked_file_path column exists
psql -U postgres -d mca_db -c "SELECT column_name FROM information_schema.columns WHERE table_name='documents' AND column_name='marked_file_path';"

# Check sample marked file paths in database
psql -U postgres -d mca_db -c "SELECT id, name, marked_file_path FROM documents WHERE marked_file_path IS NOT NULL LIMIT 5;"
```

### 2. API Verification
```bash
# Get feedback with marked files
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/student/feedback

# Get submissions with marked files
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/student/submissions

# Test file serving
curl http://localhost:5000/uploads/highlighted_review.pdf -o test.pdf
```

### 3. Frontend Verification
```
1. Open browser DevTools (F12)
2. Go to FeedbackReview page
3. Check if marked file button appears
   - Inspect element with button visible
   - Check href attribute contains correct URL
   - Network tab should show file request
4. Click download button
   - File should download or open in new tab
   - Check network response headers for Content-Type
```

### 4. End-to-End Test
1. **As Guide**:
   - Go to DocumentReview page
   - Click on a pending document
   - Draw highlights on PDF
   - Click "Save & Attach"
   - Enter feedback text
   - Click "Request Resubmission"
   - Check backend logs for success

2. **As Student**:
   - Go to FeedbackReview page
   - Verify marked file button appears
   - Click to download
   - Verify file downloads correctly

3. **As Student (Alternative)**:
   - Go to Submissions portal
   - Expand a reviewed submission
   - Verify marked file button appears
   - Click to download
   - Verify file downloads correctly

## Troubleshooting Guide

### Marked File Button Not Appearing

**Issue**: Button shows even when no marked file
- [ ] Check if `marked_file_path` is null/empty in database
- [ ] Verify frontend checking `item.marked_file_path` correctly
- [ ] Check browser console for JavaScript errors

**Issue**: Button never shows
- [ ] Guide didn't draw highlights or save marked file
- [ ] Check `backend/uploads/` directory for files
- [ ] Check database for `marked_file_path` values
- [ ] Verify API response includes `marked_file_path` field

### Download Link Returns 404

**Issue**: File not found
- [ ] Check file exists at `backend/uploads/{filename}`
- [ ] Verify URL path construction in frontend
- [ ] Check for path normalization issues (leading/trailing slashes)
- [ ] Verify backend CORS middleware is working

**Issue**: CORS error in console
- [ ] Backend CORS configuration missing
- [ ] Check line 48-50 in `server.ts`
- [ ] Verify `Access-Control-Allow-Origin` header is set

### Large Files Not Uploading

**Issue**: Timeout or file size error
- [ ] Check backend file upload size limits
- [ ] Check nginx/reverse proxy limits
- [ ] Consider chunked upload for large files
- [ ] Check network timeout settings

## Database Migration Verification

### Ensure Column Exists
```sql
-- Run this to add column if missing
ALTER TABLE documents ADD COLUMN IF NOT EXISTS marked_file_path TEXT;

-- Verify it was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'documents' 
AND column_name IN ('id', 'name', 'marked_file_path', 'file_path');
```

## Performance Considerations

1. **File Upload Size**: Currently unlimited, consider adding limit
2. **Storage**: Marked files accumulate in `backend/uploads/`
3. **Network**: Large PDFs may take time to download
4. **Concurrent Operations**: Google Drive upload may be bottleneck

## Security Notes

1. **File Access**: Currently anyone with correct URL can download marked files
   - Recommendation: Implement file access control based on user role
2. **File Storage**: Local files in `backend/uploads/` directory
   - Recommendation: Use S3/Cloud Storage for production
3. **Google Drive**: Credentials should be in secure config
   - Recommendation: Use environment variables, not hardcoded

## Next Steps

1. Deploy to staging environment
2. Run full integration tests with sample documents
3. Monitor file upload/download performance
4. Collect user feedback on UI/UX
5. Consider implementing:
   - File access logging
   - Automatic cleanup of old marked files
   - S3/Cloud storage integration
   - Rate limiting on downloads

## Support Contact

For issues or questions about this implementation, refer to:
- Implementation details: `MARKED_DOCUMENT_IMPLEMENTATION.md`
- Guide review code: `frontend/src/pages/guide/FeedbackUI.tsx`
- Student view code: `frontend/src/pages/student/FeedbackReview.tsx`
- Backend storage: `backend/src/config/storage.ts`
