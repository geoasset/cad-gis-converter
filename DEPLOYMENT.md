# Deployment Guide - Render (Separate Services)

This guide covers deploying the CAD to GIS Converter with separate backend and frontend services on Render.

## Option 1: Using render.yaml (Recommended)

1. **Push your code to GitHub**

2. **Connect to Render:**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect `render.yaml` and create both services

3. **Configure Environment Variables:**
   
   **Backend Service:**
   - `ALLOWED_ORIGINS`: Set to your frontend URL (e.g., `https://cad-gis-converter.onrender.com`)
   
   **Frontend Service:**
   - `REACT_APP_API_URL`: Set to your backend URL (e.g., `https://cad-gis-converter-backend.onrender.com`)

4. **Deploy:**
   - Render will automatically deploy both services
   - Wait for builds to complete

## Option 2: Manual Setup

### Backend Service

1. **Create Web Service:**
   - Go to Render Dashboard → "New" → "Web Service"
   - Connect your repository
   - Configure:
     - **Name:** `cad-gis-converter-backend`
     - **Runtime:** Python 3
     - **Build Command:** `pip install -r backend/requirements.txt`
     - **Start Command:** `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
     - **Health Check Path:** `/`

2. **Environment Variables:**
   - `PYTHON_VERSION`: `3.11.0`
   - `ALLOWED_ORIGINS`: (leave empty for now, will update after frontend is deployed)

3. **Deploy and note the URL** (e.g., `https://cad-gis-converter-backend.onrender.com`)

### Frontend Service

1. **Create Static Site:**
   - Go to Render Dashboard → "New" → "Static Site"
   - Connect your repository
   - Configure:
     - **Name:** `cad-gis-converter-frontend`
     - **Build Command:** `npm install && npm run build`
     - **Publish Directory:** `build`

2. **Environment Variables:**
   - `REACT_APP_API_URL`: Your backend URL from step above

3. **Deploy and note the URL** (e.g., `https://cad-gis-converter.onrender.com`)

### Update Backend CORS

1. Go back to your backend service settings
2. Update `ALLOWED_ORIGINS` environment variable with your frontend URL
3. Redeploy the backend service

## Verification

1. Visit your frontend URL
2. Try uploading a DXF file
3. Check that conversion works end-to-end

## Troubleshooting

### Frontend shows API error
- Check that `REACT_APP_API_URL` is set correctly in frontend environment variables
- Verify backend is running and accessible

### CORS errors
- Ensure `ALLOWED_ORIGINS` in backend includes your frontend URL
- Check browser console for specific CORS error messages

### Backend fails to start
- Check Render logs for Python/dependency errors
- Verify all dependencies in `backend/requirements.txt` are compatible

## Cost Optimization

- Both services can use Render's free tier
- Backend will spin down after 15 minutes of inactivity (free tier)
- Consider upgrading to paid tier for production use to avoid cold starts

## Updating

Push changes to your GitHub repository and Render will automatically redeploy:
- Backend: Redeploys on any change
- Frontend: Rebuilds on any change

## Environment Variables Reference

### Backend
- `ALLOWED_ORIGINS`: Comma-separated list of allowed frontend URLs
- `PYTHON_VERSION`: Python version (3.11.0)

### Frontend
- `REACT_APP_API_URL`: Backend API base URL
