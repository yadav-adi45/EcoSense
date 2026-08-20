# 🎯 How to Test Animal Risk Feature - Quick Guide

## ✅ Servers Are Running!

- **Backend**: http://localhost:3000 ✅
- **Frontend**: http://localhost:5173 ✅

---

## 🚀 EASIEST WAY - Open the Visual Test Page

### Step 1: Open Test Page in Browser

Double-click or open this file in your browser:
```
C:\Users\asus\Desktop\EcoSense\HackforGreenBharat\test-animal-risk.html
```

Or navigate to it in your browser directly.

### Step 2: Test the Features

The test page has 3 interactive tests:

#### Test 1: Get Animal Risk
- Shows risk score (0-100)
- Displays risk level (Low/Moderate/High/Very High)
- Shows breakdown of factors
- Lists common animals in area
- **Try the "Quick Test Locations" buttons!**

#### Test 2: Get Animal Hotspots
- Shows areas with high animal activity
- Adjustable search radius

#### Test 3: Get Animal Statistics
- Shows total observations
- Species distribution
- Average risk in area

### What You Should See:

✅ **Location 1 (20.87, 77.92) at 7 PM**:
- Risk Score: **88/100**
- Risk Level: **Very High**
- Roadkill Count: **10**
- Common Animals: Greater Coucal, Indian Nightjar, Wild Boar, etc.
- Warning message displayed

✅ **Same location at 12 PM (Noon)**:
- Risk Score: **31/100** (much lower!)
- Risk Level: **Moderate**
- This proves time-of-day multiplier is working!

---

## 📱 Method 2: Test via Browser Console

### Step 1: Open Browser
Open http://localhost:5173 (your frontend)

### Step 2: Open Developer Tools
Press **F12** on keyboard

### Step 3: Go to Console Tab

### Step 4: Paste and Run This Code

```javascript
// Test 1: Get Animal Risk
fetch('http://localhost:3000/api/v12/animal-risk?latitude=20.87&longitude=77.92&hour=19')
  .then(r => r.json())
  .then(data => {
    console.log('🎯 ANIMAL RISK TEST');
    console.log('Risk Score:', data.animalRisk);
    console.log('Risk Level:', data.riskLevel);
    console.log('Roadkill Count:', data.factors.roadkillCount);
    console.log('\n📊 Risk Breakdown:');
    console.table(data.breakdown);
    console.log('\n🐾 Common Animals:');
    console.table(data.commonAnimals);
  });
```

**Expected Output in Console**:
```
🎯 ANIMAL RISK TEST
Risk Score: 88
Risk Level: Very High
Roadkill Count: 10

📊 Risk Breakdown:
┌─────────────────────┬────────┐
│ roadkillFactor      │ 100    │
│ observationFactor   │ 0      │
│ userReportFactor    │ 0      │
│ forestFactor        │ 30     │
│ waterFactor         │ 20     │
│ timeMultiplier      │ 2.0    │
└─────────────────────┴────────┘

🐾 Common Animals:
┌─────┬─────────────────────┬───────┬──────────┐
│ idx │ name                │ count │ category │
├─────┼─────────────────────┼───────┼──────────┤
│ 0   │ Greater Coucal      │ 3     │ bird     │
│ 1   │ Indian Nightjar     │ 3     │ bird     │
│ 2   │ Wild Boar           │ 2     │ mammal   │
└─────┴─────────────────────┴───────┴──────────┘
```

---

## 🧪 Method 3: Test via Postman/Thunder Client

### Test 1: Animal Risk API

**Request**:
```
GET http://localhost:3000/api/v12/animal-risk?latitude=20.87&longitude=77.92&hour=19
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
    "userReportCount": 0
  },
  "commonAnimals": [
    {
      "name": "Greater Coucal",
      "count": 3,
      "category": "bird"
    }
  ],
  "warning": "⚠️ Very High Animal Activity Zone - Consider alternative route"
}
```

### Test 2: Animal Hotspots

**Request**:
```
GET http://localhost:3000/api/v12/animal-hotspots?latitude=20.87&longitude=77.92&radius=5
```

### Test 3: Animal Statistics

**Request**:
```
GET http://localhost:3000/api/v12/animal-stats?latitude=20.87&longitude=77.92&radius=10
```

---

## ✅ What to Verify

### 1. Risk Score Changes with Time
- **Dusk (7 PM)**: 88/100 (Very High) ← 2x multiplier
- **Dawn (6 AM)**: 66/100 (High) ← 1.5x multiplier
- **Noon (12 PM)**: 31/100 (Moderate) ← 0.7x multiplier
- **Night (11 PM)**: 57/100 (High) ← 1.3x multiplier

### 2. Animals Are Detected
You should see animals like:
- Greater Coucal (bird)
- Indian Nightjar (bird)
- Wild Boar (mammal)
- Common Palm Squirrel (mammal)
- Barred Wolf Snake (reptile)

### 3. Roadkill Data Is Present
- Location (20.87, 77.92) should show **10 roadkill incidents**
- Other locations may show 0-5 incidents

### 4. Risk Factors Are Calculated
- Roadkill Factor: 0-100
- Observation Factor: 0-100
- User Report Factor: 0-100
- Forest Factor: 30 (default)
- Water Factor: 20 (default)

---

## 🎨 Test Locations to Try

### High Risk Location
```
Latitude: 20.87
Longitude: 77.92
Expected Risk: 88/100 at dusk
Animals: 10+ species
```

### Mongoose Area
```
Latitude: 19.99
Longitude: 76.52
Expected: Indian Grey Mongoose sightings
```

### Multiple Species Area
```
Latitude: 22.83
Longitude: 69.33
Expected: Various species
```

---

## 🐛 Troubleshooting

### Issue: "Failed to fetch" error
**Solution**: Make sure backend is running on port 3000
```bash
cd backend
npm start
```

### Issue: "Cannot read property" error
**Solution**: Check if data is imported
```bash
cd backend
node scripts/verifyImport.js
```

Should show: 492 roadkill observations, 302 risk segments

### Issue: All locations show 0 risk
**Solution**: Recalculate risk segments
```bash
cd backend
node scripts/updateRiskSegments.js
```

### Issue: CORS error in browser
**Solution**: Backend should allow all origins. Check index.js has:
```javascript
app.use(cors({
  origin: true,
  credentials: true
}));
```

---

## 📊 Success Criteria

Your animal risk feature is **WORKING** if:

✅ API returns risk scores between 0-100
✅ Risk changes based on time of day
✅ Animals list shows actual species names
✅ High-risk areas (>50) are identified
✅ Roadkill count is greater than 0 for some locations
✅ Risk factors breakdown is displayed
✅ Warning message appears for very high risk

---

## 🎉 What This Proves

When tests pass, it proves:
1. ✅ 492 roadkill observations imported successfully
2. ✅ 302 risk segments calculated
3. ✅ Risk algorithm working (transparent, no ML)
4. ✅ Time-of-day multipliers functioning
5. ✅ Animal species identification working
6. ✅ API endpoints responding correctly
7. ✅ Database queries optimized

---

## 📝 Next Steps After Testing

Once everything works:
1. Integrate with your frontend UI
2. Add map markers for high-risk zones
3. Show animal warnings on routes
4. Add user reporting feature
5. Display animal crossing signs

---

**Need help?** Check:
- `backend/ANIMAL_RISK_SETUP.md` - Full documentation
- `backend/scripts/testAnimalRiskAPI.js` - Automated test
- `backend-error.log` - Backend errors

---

**STATUS: Ready for Testing! 🚀**

Open `test-animal-risk.html` in your browser to start!
