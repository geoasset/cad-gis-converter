# Download Troubleshooting Guide

## Changes Made

1. **Separated Preview and Download Endpoints**
   - `/api/preview/{job_id}` - Returns JSON for map preview
   - `/api/download/{job_id}` - Returns file for download

2. **Created Axios Instance** (`src/api/axios.ts`)
   - Centralized API configuration
   - Better error handling
   - Configurable base URL

3. **Enhanced Download Function**
   - Added detailed console logging
   - Proper blob handling
   - Better filename extraction from headers

4. **Backend Improvements**
   - Added explicit Content-Disposition header
   - Better logging for debugging
   - Proper media types

## Testing Steps

1. **Start the Backend**
   ```bash
   cd backend
   python main.py
   ```
   Backend should run on http://localhost:8000

2. **Start the Frontend**
   ```bash
   npm start
   ```
   Frontend should run on http://localhost:3000

3. **Test the Download**
   - Upload a DXF file
   - Wait for conversion to complete
   - Click the Download button
   - Check browser console for logs:
     - "Starting download for job: ..."
     - "Download response received: ..."
     - "Blob size: ... bytes"
     - "Downloading as: ..."
     - "Download initiated successfully"

## Common Issues

### Issue: Download button does nothing
**Check:**
- Open browser DevTools (F12) → Console tab
- Look for error messages
- Check Network tab for failed requests

### Issue: 404 Not Found
**Possible causes:**
- Backend not running
- Wrong API URL in `.env.local`
- Job ID mismatch

**Solution:**
- Verify backend is running: `curl http://localhost:8000/`
- Check `.env.local` has `REACT_APP_API_URL=http://localhost:8000`
- Restart frontend after changing `.env.local`

### Issue: CORS errors
**Solution:**
- Ensure backend CORS middleware includes your frontend URL
- Check `backend/main.py` has `allow_origins=["http://localhost:3000"]`

### Issue: File downloads but is empty/corrupted
**Check:**
- Backend logs for file creation errors
- Verify output file exists: `ls outputs/`
- Check file size: `ls -lh outputs/`

### Issue: Blob size is 0 bytes
**Possible causes:**
- File not created properly on backend
- File path incorrect

**Solution:**
- Check backend logs
- Verify `output_path` in job status
- Test download endpoint directly: `curl http://localhost:8000/api/download/{job_id} -o test.geojson`

## Debug Commands

### Test Backend Directly
```bash
# Check if backend is running
curl http://localhost:8000/

# Check job status
curl http://localhost:8000/api/job/{job_id}

# Download file directly
curl http://localhost:8000/api/download/{job_id} -o test.geojson
```

### Check Output Files
```bash
# List output files
ls -lh outputs/

# View GeoJSON content
cat outputs/{job_id}_converted.geojson
```

## Environment Variables

Create `.env.local` in the frontend root:
```
REACT_APP_API_URL=http://localhost:8000
```

**Note:** Restart the frontend after creating/modifying `.env.local`
