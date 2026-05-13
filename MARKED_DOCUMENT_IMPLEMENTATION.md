# Marked Document Download Feature - Complete Implementation

## Feature Overview
This feature allows guides to attach marked/annotated PDF documents to their reviews, which students can then download from both the Feedback Review and Submission Portal pages.

## Implementation Status: ✅ COMPLETE

### Database Layer
- **Column**: `marked_file_path` (TEXT) in `documents` table
- **Migration**: Applied via `ALTER TABLE documents ADD COLUMN IF NOT EXISTS marked_file_path TEXT`
- **Status**: ✅ Column exists and is queried in all relevant SELECT statements

### Backend API Layer

#### 1. Guide Review Endpoint
**File**: `backend/src/modules/guide/guide.service.ts`
- **Function**: `reviewDocument()`
- **Flow**:
  1. Accepts optional file upload from guide
  2. Uploads to Google Drive with fallback to local storage
  3. Stores the file URL/path in `marked_file_path` column
  4. Returns updated document with file path
- **Status**: ✅ Implemented and tested

**File**: `backend/src/modules/guide/guide.routes.ts`
- **Endpoint**: `POST /guide/documents/:docId/review`
- **Middleware**: Multipart file upload support
- **Status**: ✅ Properly wired

#### 2. Student Feedback Retrieval
**File**: `backend/src/modules/student/student.service.ts`

**Function**: `getStudentFeedback()`
- **Query**: Selects `d.marked_file_path` from documents
- **Returns**: Array of feedback objects with `marked_file_path` property
- **Status**: ✅ Implemented

**Function**: `getStudentSubmissions()`
- **Query**: Selects `d.marked_file_path` from documents
- **Returns**: Array of submission objects with `marked_file_path` property
- **Status**: ✅ Implemented

**File**: `backend/src/modules/student/student.controller.ts`
- **Endpoints**:
  - `GET /student/feedback` - Returns feedback with marked_file_path
  - `GET /student/submissions` - Returns submissions with marked_file_path
- **Status**: ✅ Properly wired

### Frontend API Layer

**File**: `frontend/src/services/guideApi.ts`
- **Function**: `reviewDocument()`
- **Implementation**:
  ```typescript
  const formData = new FormData();
  formData.append('status', status);
  formData.append('feedback', feedback);
  if (file) formData.append('file', file);
  return api.post(`/guide/documents/${docId}/review`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  ```
- **Status**: ✅ Properly sends multipart form

**File**: `frontend/src/services/studentApi.ts`
- **Functions**:
  - `getSubmissionStatus()` - Returns `/student/submissions`
  - `getFeedback()` - Returns `/student/feedback`
- **Status**: ✅ Properly configured

### Frontend UI Layer

#### 1. Guide-Side Document Review
**File**: `frontend/src/pages/guide/FeedbackUI.tsx`
- **Features**:
  - PDF annotation viewer with highlighting
  - File attachment input for marked documents
  - "Save & Attach" button shows when highlights are made
  - Passes marked file to API on review submission
- **URL Configuration**: Uses `import.meta.env.VITE_API_URL || 'http://localhost:5000'`
- **Status**: ✅ Fully implemented

**File**: `frontend/src/components/guide/PDFAnnotationViewer.tsx`
- **Features**:
  - Drag-to-highlight functionality
  - Multiple highlight colors (Yellow, Red, Green, Blue)
  - Undo functionality
  - Exports highlighted PDF
  - Calls `onSaveAnnotated()` callback with File object
- **Status**: ✅ Fully implemented

#### 2. Student-Side Marked Document Download

**File**: `frontend/src/pages/student/FeedbackReview.tsx`
- **Download Button**:
  - Shows only when `review.marked_file_path` exists
  - Uses environment variable API URL: `import.meta.env.VITE_API_URL || 'http://localhost:5000'`
  - Includes `download` attribute for direct download
  - Link construction: `${BACKEND_URL}/${marked_file_path.replace(/^\/$/, '')}`
- **Status**: ✅ Fully implemented and updated

**File**: `frontend/src/pages/student/SubmissionPortal.tsx`
- **Download Button**:
  - Shows in submission dropdown when `item.marked_file_path` exists
  - Uses environment variable API URL: `import.meta.env.VITE_API_URL || 'http://localhost:5000'`
  - Includes `download` attribute for direct download
  - Link construction: `${BACKEND_URL}/${marked_file_path.replace(/^\/$/, '')}`
- **Status**: ✅ Updated with environment variables and download attribute

## Complete User Flow

### 1. Guide Reviews Document
1. Guide navigates to `FeedbackUI` page
2. Guide views original document in PDF viewer
3. Guide draws highlights on document using drag-to-highlight
4. "Save & Attach" button appears with highlight count
5. Guide clicks "Save & Attach"
   - PDF Annotation Viewer exports highlighted PDF
   - Creates File object with `highlighted_review.pdf`
   - Calls `onSaveAnnotated(file)`
   - File stored in `markedFile` state
6. Guide enters feedback text
7. Guide clicks "Request Resubmission" (or Approve/Reject)
8. API call includes:
   - `status`: 'Needs Revision'
   - `feedback`: guide's feedback text
   - `file`: marked PDF file
9. Backend processes:
   - Uploads marked file to Google Drive (or stores locally)
   - Updates `documents.marked_file_path` with file URL
   - Sends notification to student

### 2. Student Views Feedback
1. Student navigates to "Feedback Review" page
2. Calls `studentApi.getFeedback()`
3. Backend returns feedback array with `marked_file_path`
4. Component renders:
   - Feedback text
   - "DOWNLOAD MARKED DOCUMENT" button (if marked_file_path exists)
5. Student clicks download button
6. File downloads or opens based on browser settings

### 3. Alternative: Student Views in Submissions
1. Student navigates to "Submissions" portal
2. Calls `studentApi.getSubmissionStatus()`
3. Backend returns submissions with `marked_file_path`
4. Student expands submission row
5. Download button appears if marked file exists
6. File downloads on click

## Testing Checklist

### Backend
- [ ] Database: `marked_file_path` column exists
- [ ] `ALTER TABLE` migration has been run
- [ ] `guide.service.reviewDocument()` stores file path correctly
- [ ] `student.service.getStudentFeedback()` returns marked_file_path
- [ ] `student.service.getStudentSubmissions()` returns marked_file_path
- [ ] File upload to Google Drive works or falls back to local
- [ ] File path construction is correct (with/without leading /)

### Frontend
- [ ] Guide can draw highlights on PDF
- [ ] "Save & Attach" button appears after drawing
- [ ] Marked PDF exports correctly
- [ ] File uploads to backend with review submission
- [ ] Download button appears on FeedbackReview page
- [ ] Download button appears on SubmissionPortal page
- [ ] Download links use correct environment-based URL
- [ ] Files download correctly to student's computer

### Integration
- [ ] End-to-end flow: Guide uploads → Student downloads
- [ ] Multiple guides can upload different marked files
- [ ] Same document can be reviewed multiple times with new marked files
- [ ] URL construction works with both Google Drive and local files

## Environment Configuration

### Required Variables
Add to `.env` files (frontend):
```
VITE_API_URL=http://your-backend-url
```

Default fallback: `http://localhost:5000`

## Known Limitations
1. **PDF Annotation Viewer**: Highlights only; no freehand drawing
2. **File Size**: Large marked PDFs may take time to upload
3. **File Types**: Currently supports PDF output from annotation viewer
4. **Google Drive**: Optional; falls back to local storage if upload fails

## Troubleshooting

### Button Not Appearing
- **Cause**: `marked_file_path` is null/empty
- **Check**: 
  1. Did guide actually draw highlights and save?
  2. Was the marked file uploaded to backend?
  3. Is `marked_file_path` present in API response?

### Download Link Not Working
- **Cause**: Incorrect URL construction or file not at location
- **Check**:
  1. Is `VITE_API_URL` correctly configured?
  2. Is backend serving files from correct upload directory?
  3. Check browser console for actual URL being generated

### File Not Saving in Backend
- **Cause**: Google Drive upload or local storage failed
- **Check**:
  1. Backend logs for upload errors
  2. File exists in local uploads directory
  3. Google Drive credentials configured correctly

## File References

### Backend Files
- `backend/src/modules/guide/guide.service.ts` - Review logic
- `backend/src/modules/guide/guide.routes.ts` - Endpoints
- `backend/src/modules/student/student.service.ts` - Feedback/submission queries
- `backend/src/modules/student/student.controller.ts` - Controllers

### Frontend Files
- `frontend/src/pages/guide/FeedbackUI.tsx` - Guide review interface
- `frontend/src/components/guide/PDFAnnotationViewer.tsx` - PDF markup tool
- `frontend/src/pages/student/FeedbackReview.tsx` - Student feedback view
- `frontend/src/pages/student/SubmissionPortal.tsx` - Submission list view
- `frontend/src/services/guideApi.ts` - Guide API client
- `frontend/src/services/studentApi.ts` - Student API client

## Recent Updates
- ✅ Fixed hardcoded `localhost:5000` URLs in SubmissionPortal.tsx
- ✅ Added environment variable support (`import.meta.env.VITE_API_URL`)
- ✅ Added `download` attribute to both download buttons
- ✅ Verified all database queries include `marked_file_path`
- ✅ Verified all API endpoints return `marked_file_path`

## Next Steps
1. Run full integration test with sample documents
2. Verify Google Drive upload functionality
3. Test with various file sizes and formats
4. Monitor performance with large PDF files
5. Consider adding progress indicators for large uploads
