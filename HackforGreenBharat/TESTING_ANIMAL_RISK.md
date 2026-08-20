# 🐾 How to Test Animal Risk Feature

## ✅ Servers Running

- **Backend**: http://localhost:3000
- **Frontend**: http://localhost:5173

---

## Method 1: Test via Postman/Thunder Client (API Testing)

### 1. Test Animal Risk for a Location

**Endpoint**: `GET http://localhost:3000/api/v12/animal-risk`

**Query Parameters**:
```
latitude=20.87
longitude=77.92
hour=19
```

**Expected Response**:
```json
{
  "success": true,
  "animalRisk": 88,
  "riskLevel": "Very High",
  "breakdown": {
    "roadkillFactor": 100,
    "observationFactor": 0,
    "userReportFactor": 0,
    "forestFactor": 30,
    "waterFactor": 20,
    "baseRisk": 44,
    "timeMultiplier": "2.0"
  },
  "factors": {
    "roadkillCount": 10,
    "observationCount": 0,
    "userReportCount": 0,
    "forestDistanceKm": null,
    "waterDistanceKm": null
  }
}
```

### 2. Get Animals Nearby

**Endpoint**: `GET http://localhost:3000/api/v12/animals/nearby`

**Query Parameters**:
```
latitude=20.87
longitude=77.92
radius=5
```

**Expected Response**:
```json
{
  "success": true,
  "animals": [
    {
      "name": "Greater Coucal",
      "count": 3,
      "category": "bird"
    },
    {
      "name": "Indian Nightjar",
      "count": 3,
      "category": "bird"
    },
    {
      "name": "Wild Boar",
      "count": 2,
      "category": "mammal"
    }
  ]
}
```

### 3. Get Animal Risk for Route

**Endpoint**: `POST http://localhost:3000/api/v12/animal-risk/route`

**Body (JSON)**:
```json
{
  "routePoints": [
    {"latitude": 20.87, "longitude": 77.92},
    {"latitude": 20.88, "longitude": 77.93},
    {"latitude": 20.89, "longitude": 77.94}
  ],
  "currentHour": 19
}
```

**Expected Response**:
```json
{
  "success": true,
  "averageRisk": 65,
  "maxRisk": 88,
  "riskLevel": "Very High",
  "segments": [
    {
      "lat": 20.87,
      "lon": 77.92,
      "animalRisk": 88,
      "riskLevel": "Very High"
    },
    // ... more segments
  ]
}
```

### 4. Test Route with Animal Risk Avoidance

**Endpoint**: `POST http://localhost:3000/api/routes/calculate?avoidAnimalRisk=true`

**Body (JSON)**:
```json
{
  "startLat": 20.85,
  "startLng": 77.90,
  "endLat": 20.90,
  "endLng": 77.95,
  "vehicleType": "car"
}
```

**What to Check**:
- Route avoids high-risk animal areas
- Response includes `animalRiskInfo` with risk scores
- Alternative routes have lower animal risk

---

## Method 2: Test via Browser Console (Quick Test)

### Open Browser Console

1. Open Frontend: http://localhost:5173
2. Press `F12` to open Developer Tools
3. Go to **Console** tab

### Test 1: Get Animal Risk

```javascript
fetch('http://localhost:3000/api/v12/animal-risk?latitude=20.87&longitude=77.92&hour=19')
  .then(r => r.json())
  .then(data => {
    console.log('Animal Risk:', data.animalRisk);
    console.log('Risk Level:', data.riskLevel);
    console.log('Roadkill Count:', data.factors.roadkillCount);
    console.table(data.breakdown);
  });
```

### Test 2: Get Nearby Animals

```javascript
fetch('http://localhost:3000/api/v12/animals/nearby?latitude=20.87&longitude=77.92&radius=5')
  .then(r => r.json())
  .then(data => {
    console.log('Animals found:', data.animals.length);
    console.table(data.animals);
  });
```

### Test 3: Different Times of Day

```javascript
// Test risk at different times
const times = [
  {hour: 6, label: 'Dawn'},
  {hour: 12, label: 'Noon'},
  {hour: 19, label: 'Dusk'},
  {hour: 23, label: 'Night'}
];

times.forEach(async ({hour, label}) => {
  const res = await fetch(`http://localhost:3000/api/v12/animal-risk?latitude=20.87&longitude=77.92&hour=${hour}`);
  const data = await res.json();
  console.log(`${label} (${hour}:00): Risk = ${data.animalRisk}/100 (${data.riskLevel})`);
});
```

---

## Method 3: Check Database (Verify Data)

### Option A: MongoDB Compass (GUI)

1. Open MongoDB Compass
2. Connect to: `mongodb://sunny7482:ubYMyfEASjFjW0Qn@ac-a1e9afd-shard-00-00.eziunrp.mongodb.net:27017/ecosense`
3. Check Collections:
   - `roadkillobservations` - Should have 492 documents
   - `animalrisksegments` - Should have 302 documents

### Option B: Run Verification Script

```bash
cd backend
node scripts/verifyImport.js
```

**Expected Output**:
```
📊 Roadkill Observations: 492
🗺️  Animal Risk Segments: 302
🐾 Species Category Distribution:
  other: 233
  mammal: 143
  bird: 103
```

---

## Method 4: Visual Testing (Frontend Integration)

### If Your Frontend Has Route Planning:

1. Open frontend: http://localhost:5173
2. Login to your account
3. Go to Route Planning / Navigation page
4. Enter route:
   - **Start**: Latitude 20.85, Longitude 77.90
   - **End**: Latitude 20.90, Longitude 77.95
5. Enable "Avoid Animal Risk" option
6. Calculate route
7. **Check for**:
   - Animal risk warnings displayed
   - Risk level indicators (Low/Moderate/High/Very High)
   - Common animals in the area shown
   - Route avoids high-risk segments

---

## Quick Verification Checklist

Run these commands to verify everything is working:

### ✅ 1. Backend Running
```
curl http://localhost:3000/api/v12/animal-risk?latitude=20.87&longitude=77.92
```

### ✅ 2. Data Imported
```bash
cd backend
node scripts/verifyImport.js
```

### ✅ 3. Risk Calculation Working
```bash
cd backend
node scripts/testAnimalRiskAPI.js
```

---

## Expected Behavior

### ✅ Working Correctly If:

1. **API Returns Risk Scores**:
   - `/api/v12/animal-risk` returns risk 0-100
   - Higher risk at dusk (6-10 PM) - 2x multiplier
   - Lower risk at noon - 0.7x multiplier

2. **Database Has Data**:
   - 492 roadkill observations
   - 302 animal risk segments
   - Species distribution shows mammals, birds, reptiles

3. **Animals Detected**:
   - `/api/v12/animals/nearby` returns species list
   - Shows animals like Wild Boar, Indian Grey Mongoose, etc.

4. **Route Integration**:
   - Routes avoid high-risk areas when `avoidAnimalRisk=true`
   - Animal risk info included in route response

---

## Sample Test Locations (High Risk Areas)

Test with these coordinates that have actual roadkill data:

1. **Location 1**: `lat=20.87, lng=77.92` (10 roadkills, Very High risk)
2. **Location 2**: `lat=19.99, lng=76.52` (Indian Grey Mongoose area)
3. **Location 3**: `lat=22.83, lng=69.33` (Multiple species)

---

## Troubleshooting

### Issue: API returns 0 risk everywhere
**Solution**: Run `node scripts/updateRiskSegments.js` to recalculate

### Issue: No animals found
**Solution**: Check if data imported with `node scripts/verifyImport.js`

### Issue: Database connection error
**Solution**: Verify MongoDB URL in `.env` file

### Issue: Frontend can't connect to backend
**Solution**: Check CORS settings and ensure backend is on port 3000

---

## What to Look For

### ✅ Success Indicators:

1. **API responds without errors**
2. **Risk scores change based on time of day**:
   - Dusk (7 PM): ~88/100 risk
   - Noon (12 PM): ~31/100 risk
3. **Animals list shows actual species names**
4. **High-risk areas (>50) identified correctly**
5. **Route planning considers animal risk**

---

## Next Steps After Testing

If everything works:
1. ✅ Document the feature in user guide
2. ✅ Add UI components for risk visualization
3. ✅ Create alerts for high-risk zones
4. ✅ Add animal crossing signs on map
5. ✅ Implement user reporting feature

---

**Need Help?**
- Check `backend-error.log` for backend errors
- Check browser console for frontend errors
- Run `node scripts/testAnimalRiskAPI.js` for diagnostic info
