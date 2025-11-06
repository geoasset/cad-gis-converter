# CAD-GIS Converter

A web-based application for converting CAD files (DXF) to GIS formats (GeoJSON) with coordinate system transformation and scale factor adjustment capabilities.

## Features

- **DXF to GeoJSON Conversion**: Convert AutoCAD DXF files to GeoJSON format
- **Coordinate System Support**: Transform between different coordinate reference systems (CRS)
- **Scale Factor Adjustment**: Apply scale factors for accurate geospatial positioning
- **Interactive Map Viewer**: Preview converted data using Leaflet maps
- **Real-time Progress Tracking**: Monitor conversion progress with WebSocket updates
- **Professional UI**: Clean, responsive interface built with React and TypeScript

## Architecture

- **Frontend**: React 18 + TypeScript + Leaflet + Tailwind CSS
- **Backend**: Python FastAPI + GDAL 3.7.3 + Redis
- **Containerization**: Docker + Docker Compose
- **Storage**: File uploads/outputs + Redis caching

## Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/your-username/cad-gis-converter.git
cd cad-gis-converter

# Build and run with Docker Compose
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
```

### Manual Setup

#### Prerequisites
- Python 3.11+
- Node.js 18+
- GDAL 3.7.3
- Redis Server

#### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup
```bash
npm install
npm start
```

## API Documentation

### Endpoints

- `POST /api/upload` - Upload DXF file for conversion
- `GET /api/download/{filename}` - Download converted GeoJSON
- `GET /api/health` - Health check endpoint
- `WebSocket /ws` - Real-time progress updates

### Usage Example

```bash
# Upload and convert DXF file
curl -X POST "http://localhost:8000/api/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@example.dxf" \
  -F "target_crs=EPSG:4326" \
  -F "scale_factor=1.0"
```

## Configuration

### Environment Variables

```bash
# Backend (.env)
REDIS_URL=redis://localhost:6379
GDAL_CACHEMAX=512
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:3000
```

## Supported Formats

### Input
- DXF (Drawing Exchange Format)

### Output
- GeoJSON (RFC 7946 compliant)

### Coordinate Systems
- EPSG:4326 (WGS84)
- EPSG:3857 (Web Mercator)
- State Plane Coordinate Systems
- UTM Zones
- Custom CRS definitions

## Performance

- **File Size Limit**: 100MB per upload
- **Processing Time**: Typically 5-30 seconds depending on file complexity
- **Memory Usage**: ~400MB for backend container
- **Concurrent Users**: Supports multiple simultaneous conversions

## Deployment

### Render (Recommended)

1. Fork this repository
2. Connect to Render
3. Create backend service (Web Service)
4. Create frontend service (Static Site)
5. Add Redis instance
6. Configure environment variables

See [HOSTING_RECOMMENDATIONS.md](docs/HOSTING_RECOMMENDATIONS.md) for detailed deployment guides.

## Documentation

- [Installation Guide](docs/INSTALL_DEPENDENCIES.md)
- [Scale Factor Usage](docs/SCALE_FACTOR_GUIDE.md)
- [Projection Change Feature](docs/PROJECTION_CHANGE_FEATURE.md)
- [State Plane Guide](docs/STATE_PLANE_GUIDE.md)
- [Hosting Recommendations](docs/HOSTING_RECOMMENDATIONS.md)

## Development

### Project Structure
```
cad-gis-converter/
├── backend/                 # Python FastAPI backend
│   ├── main.py             # Main application file
│   ├── dxf_processor.py    # DXF conversion logic
│   └── requirements.txt    # Python dependencies
├── src/                    # React frontend source
│   ├── components/         # React components
│   ├── contexts/          # Context providers
│   └── utils/             # Utility functions
├── public/                # Static assets
├── docs/                  # Documentation
├── docker-compose.yml     # Docker Compose configuration
├── Dockerfile             # Backend Dockerfile
└── Dockerfile.frontend    # Frontend Dockerfile
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues and questions:
- Create an issue on GitHub
- Check the [documentation](docs/)
- Review [troubleshooting guide](docs/ERROR_EXPLANATION.md)

## Built With

- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [GDAL](https://gdal.org/) - Geospatial data processing
- [React](https://reactjs.org/) - Frontend UI library
- [Leaflet](https://leafletjs.com/) - Interactive maps
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Docker](https://www.docker.com/) - Containerization platform
