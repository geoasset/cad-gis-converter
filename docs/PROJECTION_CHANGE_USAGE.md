# How to Change Projection After Upload

## Step-by-Step Guide

### 1. Initial Upload
- Output format is GeoJSON
- Choose an initial coordinate system
- Upload your DXF file
- Wait for the conversion to complete

### 2. View Results
After conversion completes, you'll see:
- A progress indicator showing "Completed"
- A **Projection Changer** component (new!)
- A map preview of your converted data
- Download button

### 3. Change Projection
The Projection Changer component displays:
```
┌─────────────────────────────────────────────────┐
│ 🌐 Current Projection                           │
│    WGS84 (EPSG:4326)                            │
│                          [Change Projection]    │
└─────────────────────────────────────────────────┘
```

Click the **"Change Projection"** button to expand options:

```
┌─────────────────────────────────────────────────┐
│ 🌐 Current Projection                           │
│    WGS84 (EPSG:4326)                            │
│                          [Change Projection]    │
├─────────────────────────────────────────────────┤
│ [Common CRS]  [US State Plane]                  │
│                                                 │
│ Select Coordinate System:                       │
│ ┌─────────────────────────────────────────┐    │
│ │ WGS84 (EPSG:4326)                    ▼ │    │
│ └─────────────────────────────────────────┘    │
│                                                 │
│                    [Cancel] [Apply Projection]  │
└─────────────────────────────────────────────────┘
```

### 4. Select New Projection
- Choose between **Common CRS** or **US State Plane** tabs
- Select your desired coordinate system from the dropdown
- Click **"Apply Projection"**

### 5. Wait for Reprojection
- The system will reprocess your file with the new projection
- Progress indicator shows "Reprojecting..."
- Map preview updates automatically when complete

### 6. Download
- Download button provides the file in the new projection
- Original file is preserved on the server
- You can change projection multiple times

## Example Use Cases

### Use Case 1: Wrong Initial Projection
You uploaded a file thinking it was in WGS84, but after seeing the preview, you realize it should be in a State Plane coordinate system.

**Solution**: Use the Projection Changer to switch to the correct State Plane zone without re-uploading.

### Use Case 2: Multiple Output Projections
You need the same DXF file in multiple coordinate systems for different stakeholders.

**Solution**: Convert once, then use Projection Changer to generate versions in different CRS, downloading each one.

### Use Case 3: Projection Testing
You're not sure which State Plane zone is correct for your project area.

**Solution**: Try different State Plane zones using the Projection Changer and compare the results on the map.

## Tips
- The original DXF file is kept on the server, so reprojection is fast
- You can change projection as many times as needed
- Each reprojection creates a new job with its own download
- The map preview updates automatically to show the new projection
- The CRS indicator on the map shows the current coordinate system

## Keyboard Shortcuts
- **Esc**: Close the projection selector (when open)
- **Enter**: Apply selected projection (when selector is open)

## Troubleshooting

**Q: The "Change Projection" button is disabled**
A: This happens when a reprojection is in progress. Wait for it to complete.

**Q: I don't see my desired projection in the list**
A: The dropdown includes the most common projections. For custom EPSG codes, you can add them to the ConversionOptions component.

**Q: The reprojection failed**
A: Check that the original DXF file is still on the server. If you see an error, try uploading the file again.

**Q: Can I change the output format when reprojecting?**
A: Currently, the output format remains the same as the initial conversion. To change format, start a new conversion.
