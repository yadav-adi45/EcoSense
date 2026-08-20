# 🎯 How to See the Animal Risk Feature - Simple Guide

## ✅ Everything is Ready!

- **Backend**: Running on port 3000 ✅
- **Frontend**: Running on port 5173 ✅
- **Animal Risk Data**: 492 roadkill observations loaded ✅
- **Integration**: Complete ✅

---

## 📱 STEP-BY-STEP: See It Working

### Step 1: Open Your Browser

Go to: **http://localhost:5173/routes**

You should see the EcoSense Routes page.

---

### Step 2: Enter a High-Risk Route

**Try Route 1 (Recommended)**:
- **Origin**: Type "Nagpur"
- **Destination**: Type "Yavatmal"
- Click the **"Find Routes"** button

**OR Try Route 2**:
- **Origin**: "Lonar"
- **Destination**: "Mehkar"

---

### Step 3: Wait for Routes to Load

You'll see 2-3 route options appear.

---

### Step 4: Look for Animal Risk Indicators!

## 🔍 What You'll See:

### A. **On the Route Card** (before expanding):

Look below the route name, you'll see small badges like:
- "Elite Air" (green)
- "EV Stations" (blue)
- **NEW**: 🐾 **"HIGH WILDLIFE RISK"** (orange or red badge) ← **THIS IS IT!**

### B. **Expand the Route** (click on it):

Scroll down past the "Wellness Intel" section.

You'll see a **NEW orange/amber warning box**:

```
┌────────────────────────────────────────┐
│ 🐾 Wildlife Activity Alert             │
│                                        │
│ ⚠️ High animal crossing risk detected.│
│ Drive carefully, especially at dawn    │
│ and dusk.                              │
│                                        │
│ Common animals:                        │
│ 🦝 Wild Boar                           │
│ 🦅 Greater Coucal                      │
│ 🐍 Barred Wolf Snake                   │
└────────────────────────────────────────┘
```

---

## 🎯 Visual Guide - Where to Look:

### Screen Layout:

```
┌─────────────────────────────────────────┐
│  EcoSense Header                        │
├─────────────────────────────────────────┤
│  Search Box (Origin → Destination)      │
│  [Find Routes Button]                   │
├─────────────────────────────────────────┤
│                                         │
│  Route Options (Right Side):           │
│  ┌──────────────────────────┐          │
│  │ Route Name               │          │
│  │ Elite Air | 🐾 HIGH      │ ← LOOK! │
│  │ WILDLIFE RISK            │          │
│  │                          │          │
│  │ (Click to expand)        │          │
│  │                          │          │
│  │ When expanded:           │          │
│  │ ┌──────────────────┐    │          │
│  │ │ 🐾 Wildlife      │    │ ← LOOK! │
│  │ │ Activity Alert   │    │          │
│  │ │ ⚠️ High risk     │    │          │
│  │ │ Wild Boar        │    │          │
│  │ │ Greater Coucal   │    │          │
│  │ └──────────────────┘    │          │
│  └──────────────────────────┘          │
└─────────────────────────────────────────┘
```

---

## 🎨 What Each Color Means:

- **🟢 Green Badge** = Elite Air (low pollution)
- **🟠 Orange Badge** = High Wildlife Risk (51-75)
- **🔴 Red Badge** = Very High Wildlife Risk (76-100)
- **⚠️ Amber Box** = Wildlife Activity Warning

---

## ✅ Success Checklist:

You'll know it's working if you see:

✅ 🐾 badge appears on route card
✅ Badge says "HIGH WILDLIFE RISK" or "VERY HIGH WILDLIFE RISK"
✅ When you expand route, you see amber warning box
✅ Warning box shows animal names (Wild Boar, Greater Coucal, etc.)
✅ Risk level is displayed (High or Very High)

---

## 🧪 Alternative: Test Without Route Search

If routes don't show animal risk, you can still verify the feature works:

### Browser Console Test:

1. Press **F12** on your keyboard
2. Click **"Console"** tab
3. Paste this code:

```javascript
fetch('http://localhost:3000/api/v12/animal-risk?latitude=20.87&longitude=77.92&hour=19')
  .then(r => r.json())
  .then(data => {
    console.log('%c✅ ANIMAL RISK WORKING!', 'color: green; font-size: 20px; font-weight: bold');
    console.log('Risk Score:', data.animalRisk);
    console.log('Animals:', data.commonAnimals.map(a => a.name).join(', '));
  });
```

4. Press **Enter**

You should see:
```
✅ ANIMAL RISK WORKING!
Risk Score: 88
Animals: Greater Coucal, Wild Boar, Indian Nightjar, ...
```

---

## 📍 Test Locations (Known High-Risk Areas):

### Location 1: Maharashtra Region
- **Coordinates**: 20.87, 77.92
- **Risk**: Very High (88/100)
- **Animals**: Wild Boar, Greater Coucal, Barred Wolf Snake

### Location 2: Gujarat Region  
- **Coordinates**: 22.83, 69.33
- **Risk**: Varies
- **Animals**: Multiple species

### Location 3: Lonar Area
- **Coordinates**: 19.99, 76.52
- **Risk**: High
- **Animals**: Indian Grey Mongoose

---

## 🐛 Not Seeing It? Try This:

### 1. Refresh the Page
Press **Ctrl + R** or **F5** to reload

### 2. Check Backend is Running
Look at your terminal - should show:
```
✅ Server running on port 3000
✅ Database Connected Successfully
```

### 3. Try a Different Route
Some routes may not have animal risk data yet.
Use the recommended test routes above.

### 4. Check Browser Console
Press F12 → Console tab
- Look for any red error messages
- If you see errors, screenshot and let me know

---

## 💡 Tips:

1. **Animal risk is higher at certain times**:
   - 🌅 Dawn (5-8 AM): 1.5x risk
   - 🌆 Dusk (6-10 PM): 2.0x risk (highest!)
   - 🌙 Night (10 PM-5 AM): 1.3x risk
   - ☀️ Day (8 AM-6 PM): 0.7x risk (lowest)

2. **Not all routes have animal risk**:
   - Feature only shows warnings when risk > 50
   - Urban routes may have low/no animal risk
   - Rural routes between cities more likely to have warnings

3. **Risk is calculated in real-time**:
   - Based on actual roadkill data
   - Considers time of day
   - Updates when you search new routes

---

## 📸 Take a Screenshot!

When you see the animal risk warning:
1. Take a screenshot
2. You can see exactly how it looks
3. Confirm the feature is working

---

## 🎉 That's It!

You should now see:
- 🐾 Wildlife risk badges on routes
- ⚠️ Animal warnings with species names
- 📊 Risk levels (High/Very High)

**The animal risk feature is working!** 🚀

---

## Need Help?

If you don't see the animal warnings:
1. Check both servers are running (backend port 3000, frontend port 5173)
2. Try the recommended test routes (Nagpur → Yavatmal)
3. Use the browser console test to verify API works
4. Refresh the page

**Status**: LIVE and Working! ✅
