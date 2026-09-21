# 🏥 CuraLink - Complete Architecture & System Design

A **full-stack medical research assistant platform** that combines public research databases with AI-powered search and analysis. This document provides an exhaustive walkthrough of every component, from user login to AI response generation.

---

## � **QUICK NAVIGATION TABLE OF CONTENTS**
Line Range	Section	,Topic	,File Location
1-79	Header & Navigation	,Document title, quick links	,N/A
79-306	Index & Quick Links	,Folder structure, topic index	,All files
307-334	1. System Overview	,Technology stack, architecture diagram	,N/A
335-590	2. Frontend Architecture	,Vite proxy, Axios client, Zustand store	,frontend
591-969	3. Authentication Flow	,JWT + Bcrypt, login/register diagram	,auth.js
970-1137	4. Backend Server Setup	,Express, middleware, route mounting	,server.js
1138-1181	5. Database Models	,ChatSession, Bookmark, User schemas	,models
1182-1203	6. API Routes Mapping	,Complete route table,	All routes
1204-1512	7. AI Integration	,Groq vs Ollama, callOllama function	,ai.js
1513-1732	8. Unified Search Pipeline	,Multi-source search, AI ranking	,unified.js
1733-1911	9. Complete Request-Response	,Full flow: login → search → AI chat	,All files
1912-1953	10. Key Design Patterns	,Best practices, security, architecture,	N/A
1954-1983	11. Environment Configuration	,.env setup, all variables	,.env
1984-2015	12. Summary: How Everything Connects	,System flow diagram	,N/A
2016-2239	13. File Structure Reference	,Complete folder hierarchy	,All folders
 
---

## 🔍 **LINE-BY-LINE NAVIGATION GUIDE**

**FRONTEND SECTIONS:**
- **Lines 601-800**: Vite proxy config → `frontend/vite.config.js`
- **Lines 801-1050**: Axios setup → `frontend/src/utils/api.js`
- **Lines 1051-1350**: Auth store → `frontend/src/store/authStore.js`

**AUTHENTICATION SECTIONS:**
- **Lines 1351-1700**: Login/Register flow diagrams
- **Lines 1701-2100**: Auth routes → `backend/routes/auth.js`
- **Lines 2101-2500**: User model & bcrypt → `backend/models/User.js`
- **Lines 2501-2700**: Auth middleware → `backend/middleware/auth.js`

**BACKEND SECTIONS:**
- **Lines 2701-3050**: Express server setup → `backend/server.js`
- **Lines 3051-3550**: Database models (ChatSession, Bookmark)

**AI SECTIONS:**
- **Lines 3801-5200**: Why Groq + Ollama
- **Lines 5201-5650**: callOllama implementation
- **Lines 5651-6150**: Chat endpoint logic
- **Lines 6151-6500**: Summarize endpoint
- **Lines 6501-6900**: Analyze results endpoint
- **Lines 6901-7200**: Environment variables

**SEARCH SECTIONS:**
- **Lines 7201-8000**: Unified search pipeline
- **Lines 8001-8500**: Complete request-response example

**REFERENCE SECTIONS:**
- **Lines 8501-9000**: Design patterns & best practices
- **Lines 9001-9300**: Performance comparison table
- **Lines 9301-END**: Full file structure

---

## �📋 Complete Index with Folder Names & Line Numbers

### 1. System Overview
- **File**: [ARCHITECTURE.md](ARCHITECTURE.md) (This document)

### 2. Frontend Architecture & Vite Proxy
- **2.1** Vite Configuration
  - 📁 Folder: `frontend/`
  - 📄 File: [vite.config.js](frontend/vite.config.js) - **Lines 5-12**
  - Proxy setup for `/api` → `http://localhost:5000`

- **2.2** Axios API Client
  - 📁 Folder: `frontend/src/utils/`
  - 📄 File: [api.js](frontend/src/utils/api.js) - **Lines 1-42**
  - Instance creation (Lines 3-14)
  - Request interceptor (Lines 16-20)
  - Response interceptor (Lines 22-28)
  - Interceptor application (Lines 30-32)

- **2.3** Zustand Auth Store
  - 📁 Folder: `frontend/src/store/`
  - 📄 File: [authStore.js](frontend/src/store/authStore.js) - **Lines 1-60**
  - Login function (Lines 16-25)
  - Register function (Lines 26-35)
  - Logout function (Lines 36-40)

### 3. Authentication Flow (JWT + Bcrypt)
- **3.1** Backend Auth Routes
  - 📁 Folder: `backend/routes/`
  - 📄 File: [auth.js](backend/routes/auth.js) - **Lines 1-82**
  - Token generation helper (Lines 6-9)
  - POST /api/auth/register (Lines 11-35)
  - POST /api/auth/login (Lines 37-65)
  - GET /api/auth/me (Lines 67-69)
  - PUT /api/auth/profile (Lines 71-82)

- **3.2** User Model with Bcrypt
  - 📁 Folder: `backend/models/`
  - 📄 File: [User.js](backend/models/User.js) - **Lines 1-100+**
  - Schema definition (Lines 3-45)
  - Pre-save bcrypt hook (Lines 52-65)
  - Password comparison method (Lines 67-72)
  - toJSON override (Lines 74-85)

- **3.3** Auth Middleware
  - 📁 Folder: `backend/middleware/`
  - 📄 File: [auth.js](backend/middleware/auth.js) - **Lines 1-40**
  - `protect` middleware (Lines 1-15)
  - `optionalAuth` middleware (Lines 17-30)

### 4. Backend Server Setup
- **4.1** Express Server Entry Point
  - 📁 Folder: `backend/`
  - 📄 File: [server.js](backend/server.js) - **Lines 1-83**
  - Imports (Lines 1-8)
  - Security middleware (Lines 10-12)
  - Rate limiting (Lines 14-21)
  - CORS config (Lines 23-30)
  - Body parsing (Lines 32-33)
  - MongoDB connection (Lines 35-39)
  - Route mounting (Lines 41-50)
  - Health check (Lines 52-62)
  - Error handlers (Lines 64-76)
  - Server startup (Lines 78-83)

### 5. Database Models
- **5.1** User Model
  - 📁 Folder: `backend/models/`
  - 📄 File: [User.js](backend/models/User.js) - **Full file**

- **5.2** ChatSession Model
  - 📁 Folder: `backend/models/`
  - 📄 File: [ChatSession.js](backend/models/ChatSession.js)

- **5.3** Bookmark Model
  - 📁 Folder: `backend/models/`
  - 📄 File: [Bookmark.js](backend/models/Bookmark.js)

### 6. API Routes & Data Flow
- **6.1** Auth Routes
  - 📁 Folder: `backend/routes/`
  - 📄 File: [auth.js](backend/routes/auth.js)

- **6.2** AI Routes (Main)
  - 📁 Folder: `backend/routes/`
  - 📄 File: [ai.js](backend/routes/ai.js)
  - POST /api/ai/chat (Lines 63-110)
  - POST /api/ai/summarize (Lines 112-125)
  - POST /api/ai/analyze-results (Lines 126-175)

- **6.3** Research Routes
  - 📁 Folder: `backend/routes/`
  - 📄 File: [research.js](backend/routes/research.js) - PubMed search

- **6.4** Unified Search Routes
  - 📁 Folder: `backend/routes/`
  - 📄 File: [unified.js](backend/routes/unified.js) - Multi-source search

- **6.5** Other Routes
  - Trial routes: `backend/routes/trials.js`
  - OpenAlex routes: `backend/routes/openalex.js`
  - Bookmarks: `backend/routes/bookmarks.js`
  - User management: `backend/routes/users.js`
  - Search history: `backend/routes/history.js`

### 7. AI Integration (Ollama + Groq)
- **7.1** AI Routes Main File
  - 📁 Folder: `backend/routes/`
  - 📄 File: [ai.js](backend/routes/ai.js) - **Lines 1-200+**
  - Constants & system prompt (Lines 1-30)
  - callOllama function (Lines 40-85)
  - Groq integration (Lines 44-65)
  - Ollama fallback (Lines 68-81)
  - ollamaFallback helper (Lines 83-90)
  - POST /api/ai/chat endpoint (Lines 93-160)
  - POST /api/ai/summarize endpoint (Lines 162-180)
  - POST /api/ai/analyze-results endpoint (Lines 182-220)

- **7.2** Environment Configuration
  - 📁 Folder: `backend/`
  - 📄 File: `.env` (example)
  - GROQ_API_KEY
  - GROQ_MODEL
  - OLLAMA_URL
  - OLLAMA_MODEL

### 8. Unified Search Pipeline
- **8.1** Unified Search Route
  - 📁 Folder: `backend/routes/`
  - 📄 File: [unified.js](backend/routes/unified.js) - **Lines 1-50+**
  - Route definition (Lines 30-60)
  - fetchPubMed function (Lines 40-100)
  - fetchOpenAlex function (Lines 100-150)
  - fetchTrials function (Lines 150-200)
  - rankWithAI function (Lines 200-250)

### 9. Complete Request-Response Cycle
- Full example walkthrough
- User login → Search → AI chat flow

---

## 📂 Quick Folder Structure Reference

```
curalink/
├── frontend/
│   ├── vite.config.js              [Lines 5-12: Proxy config]
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── store/
│       │   └── authStore.js        [Lines 1-60: Auth logic]
│       ├── utils/
│       │   └── api.js              [Lines 1-42: Axios setup]
│       ├── pages/
│       │   ├── LoginPage.jsx
│       │   ├── RegisterPage.jsx
│       │   ├── Dashboard.jsx
│       │   ├── AIChatPage.jsx
│       │   ├── ResearchPage.jsx
│       │   ├── UnifiedSearchPage.jsx
│       │   ├── StructuredSearchPage.jsx
│       │   ├── ClinicalTrialsPage.jsx
│       │   ├── BookmarksPage.jsx
│       │   ├── ProfilePage.jsx
│       │   ├── ArticlePage.jsx
│       │   └── TrialDetailPage.jsx
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Layout.jsx
│       │   │   └── Navbar.jsx
│       │   ├── animations/
│       │   │   └── FloatingParticles.jsx
│       │   └── ui/
│       └── assets/
│
├── backend/
│   ├── server.js                   [Lines 1-83: Entry point]
│   ├── package.json
│   ├── setup-envs.js
│   ├── .env                        [Configuration file]
│   ├── middleware/
│   │   └── auth.js                 [Lines 1-40: JWT validation]
│   ├── models/
│   │   ├── User.js                 [Lines 1-100+: User schema]
│   │   ├── ChatSession.js          [Chat history model]
│   │   └── Bookmark.js             [Bookmarks model]
│   └── routes/
│       ├── auth.js                 [Lines 1-82: Auth endpoints]
│       ├── ai.js                   [Lines 1-220+: AI endpoints]
│       ├── unified.js              [Lines 1-300+: Multi-source search]
│       ├── research.js             [PubMed search]
│       ├── openalex.js             [OpenAlex search]
│       ├── structured.js           [Structured search]
│       ├── trials.js               [ClinicalTrials.gov]
│       ├── bookmarks.js            [Bookmark management]
│       ├── users.js                [User management]
│       └── history.js              [Search history]
│
├── ARCHITECTURE.md                 [This file]
├── README.md
├── package.json
└── vercel.json
```

---

## 🔗 Table of Contents (Jump Links)

1. [System Overview](#1-system-overview)
2. [Frontend Architecture & Vite Proxy](#2-frontend-architecture--vite-proxy)
3. [Authentication Flow (JWT + Bcrypt)](#3-authentication-flow-jwt--bcrypt)
4. [Backend Server Setup](#4-backend-server-setup)
5. [Database Models](#5-database-models)
6. [API Routes & Data Flow](#6-api-routes--data-flow)
7. [AI Integration (Ollama + Groq)](#7-ai-integration-ollama--groq)
8. [Unified Search Pipeline](#8-unified-search-pipeline)
9. [Complete Request-Response Cycle](#9-complete-request-response-cycle)
10. [Key Design Patterns](#key-design-patterns)
11. [Environment Configuration](#environment-configuration--env)
12. [Summary](#summary-how-everything-connects)
13. [File Structure](#file-structure-for-reference)

---

## 1. System Overview

### What CuraLink Does

CuraLink is a **medical research discovery platform** that helps patients and researchers find relevant clinical trials and academic papers through:

- **Authentication System**: Secure JWT-based login/register with bcrypt password hashing
- **Research Databases**: Real-time queries to PubMed, OpenAlex, and ClinicalTrials.gov
- **AI Assistant**: Local Ollama LLM with Groq cloud fallback for faster responses
- **Unified Search**: Parallel queries across all databases, ranked by AI relevance
- **User Profiles**: Role-based access (patient, researcher, admin) with search history tracking

### Technology Stack

| Layer | Technology | Location |
|-------|-----------|----------|
| **Frontend** | React 18 + Vite + Tailwind CSS | `frontend/` |
| **State Management** | Zustand (with localStorage persistence) | `frontend/src/store/authStore.js` |
| **HTTP Client** | Axios with request/response interceptors | `frontend/src/utils/api.js` |
| **Backend** | Express.js + Node.js | `backend/` |
| **Database** | MongoDB (Atlas or local) | MongoDB connection via `.env` |
| **Authentication** | JWT (jsonwebtoken) + bcryptjs | `backend/routes/auth.js`, `backend/models/User.js` |
| **AI - Local** | Ollama (llama3.2 or custom) | `http://localhost:11434` |
| **AI - Cloud** | Groq API (llama-3.3-70b-versatile) | Groq cloud endpoint |
| **External APIs** | PubMed, OpenAlex, ClinicalTrials.gov | `backend/routes/unified.js` |

---

## 2. Frontend Architecture & Vite Proxy

### Vite Development Server Configuration

📁 **Folder**: `frontend/`  
📄 **File**: [vite.config.js](frontend/vite.config.js)  
**Total Lines**: 15

```javascript
// frontend/vite.config.js

// Line 1: Import Vite configuration helper
import { defineConfig } from 'vite'
// Line 2: Import React plugin for Vite
import react from '@vitejs/plugin-react'

// Line 4: Export Vite configuration
export default defineConfig({
  // Line 5: Add React plugin
  plugins: [react()],
  
  // Line 6: Server configuration
  server: {
    // Line 7: Frontend runs on port 3000
    port: 3000,
    
    // Line 8: Proxy configuration object
    proxy: {
      // Line 9: Route pattern - any request to /api*
      '/api': {
        // Line 10: Forward to backend running on port 5000
        target: 'http://localhost:5000',
        
        // Line 11: Allow cross-origin requests (CORS)
        changeOrigin: true,
      }
    }
  }
})
```

**What Each Line Does:**
- **Lines 1-2**: Import required modules
- **Line 4**: Start exporting configuration
- **Line 5**: Add React support
- **Line 7**: Listen on port 3000
- **Line 9**: Intercept `/api` requests
- **Line 10**: Redirect to backend
- **Line 11**: Fix origin header for CORS

---

### Axios API Client with Interceptors

📁 **Folder**: `frontend/src/utils/`  
📄 **File**: [api.js](frontend/src/utils/api.js)
**Total Lines**: 42

```javascript
// frontend/src/utils/api.js

// LINE 1: Import Axios library
import axios from 'axios'

// LINE 3: Create default API instance for regular requests
const api = axios.create({
  // LINE 4: Base URL - uses Vite proxy to /api
  baseURL: '/api',
  // LINE 5: 30 second timeout for normal API calls
  timeout: 30000,
  // LINE 6: Set default content type
  headers: { 'Content-Type': 'application/json' }
})

// LINE 9: Create special API instance for AI calls (slower, need more time)
export const apiAI = axios.create({
  // LINE 10: Same base URL as default
  baseURL: '/api',
  // LINE 11: 5 minute (300000ms) timeout - LLMs are slow!
  timeout: 300000,
  headers: { 'Content-Type': 'application/json' }
})

// LINE 16: Request interceptor function - runs BEFORE every request
function attachToken(config) {
  // LINE 17: Get JWT token from browser's localStorage
  const token = localStorage.getItem('token')
  // LINE 18: If token exists, add to Authorization header
  if (token) config.headers.Authorization = `Bearer ${token}`
  // LINE 20: Return modified config
  return config
}

// LINE 22: Response interceptor function - runs AFTER every response
function handle401(error) {
  // LINE 23: Check if error is 401 (Unauthorized)
  if (error.response?.status === 401) {
    // LINE 24: Remove token from storage if expired
    localStorage.removeItem('token')
    // LINE 25: Force redirect to login page
    window.location.href = '/login'
  }
  // LINE 27: Return the error to calling code
  return Promise.reject(error)
}

// LINE 30: Apply request interceptor to api instance
api.interceptors.request.use(attachToken)
// LINE 31: Apply response interceptor to api instance
api.interceptors.response.use((r) => r, handle401)

// LINE 33: Apply same interceptors to AI instance
apiAI.interceptors.request.use(attachToken)
// LINE 34: Apply response interceptor to AI instance
apiAI.interceptors.response.use((r) => r, handle401)

// LINE 36: Export default api instance
export default api
```

**Detailed Explanation by Line**:
- **Line 1**: Import Axios HTTP client library
- **Line 4**: All requests start with `/api/` (Vite proxy intercepts)
- **Line 5**: Regular requests timeout after 30 seconds
- **Line 9-11**: Separate instance for AI with 5min timeout (LLMs are slow)
- **Line 17**: Retrieve JWT from localStorage (stored during login)
- **Line 18**: Add `Authorization: Bearer <token>` to request header
- **Line 23**: If server returns 401, token is invalid/expired
- **Line 24-25**: Clear token and redirect to login
- **Line 30-34**: Attach interceptors to both instances
- **Line 36**: Export `api` as default for use in components

---

### Zustand Auth Store

📁 **Folder**: `frontend/src/store/`  
📄 **File**: [authStore.js](frontend/src/store/authStore.js)
**Total Lines**: 60+

```javascript
// frontend/src/store/authStore.js

// LINE 1: Import Zustand store creator
import { create } from 'zustand'
// LINE 2: Import localStorage persistence middleware
import { persist } from 'zustand/middleware'
// LINE 3: Import our configured Axios instance
import api from '../utils/api'

// LINE 5: Create Zustand store with persistence middleware
const useAuthStore = create(
  // LINE 6: persist() middleware saves state to localStorage
  persist(
    // LINE 7: Store definition function (set, get are actions)
    (set, get) => ({
      // LINE 8: Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,

      // LINE 12: Login function
      login: async (email, password) => {
        // LINE 13: Set loading to true (show spinner in UI)
        set({ loading: true })
        try {
          // LINE 15: Send POST request to /api/auth/login
          const { data } = await api.post('/auth/login', { email, password })
          // LINE 16: Store token in localStorage (persists across page reloads)
          localStorage.setItem('token', data.token)
          // LINE 17: Update Zustand store with user data
          set({ 
            user: data.user, 
            token: data.token, 
            isAuthenticated: true, 
            loading: false 
          })
          // LINE 22: Return success to calling component
          return { success: true }
        } catch (error) {
          // LINE 24: Set loading to false on error
          set({ loading: false })
          // LINE 25: Return error message to calling component
          return { success: false, error: error.response?.data?.error || 'Login failed' }
        }
      },

      // LINE 29: Register function (similar to login)
      register: async (userData) => {
        set({ loading: true })
        try {
          // LINE 31: Send POST request to /api/auth/register
          const { data } = await api.post('/auth/register', userData)
          // LINE 32: Store token
          localStorage.setItem('token', data.token)
          // LINE 33: Update store
          set({ user: data.user, token: data.token, isAuthenticated: true, loading: false })
          return { success: true }
        } catch (error) {
          set({ loading: false })
          return { success: false, error: error.response?.data?.error || 'Registration failed' }
        }
      },

      // LINE 41: Logout function
      logout: () => {
        // LINE 42: Remove token from localStorage
        localStorage.removeItem('token')
        // LINE 43: Clear all auth state
        set({ user: null, token: null, isAuthenticated: false })
      },

      // LINE 46: Update user data (for profile updates)
      updateUser: (userData) => set({ user: { ...get().user, ...userData } }),

      // LINE 48: Fetch current user on app startup
      fetchMe: async () => {
        // LINE 49: Get token from localStorage
        const token = localStorage.getItem('token')
        // LINE 50: Skip if no token
        if (!token) return
        try {
          // LINE 52: Verify token is still valid
          const { data } = await api.get('/auth/me')
          // LINE 53: Update store with fresh user data
          set({ user: data.user, isAuthenticated: true })
        } catch {
          // LINE 55: Token invalid - clear everything
          localStorage.removeItem('token')
          set({ user: null, token: null, isAuthenticated: false })
        }
      }
    }),
    {
      // LINE 61: localStorage key where state is saved
      name: 'curalink-auth',
      // LINE 62: Only persist these fields (not loading state)
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated })
    }
  )
)
```

**Detailed Line-by-Line**:
- **Lines 1-3**: Import dependencies (Zustand, persistence, Axios)
- **Line 5-6**: Create store with persistence middleware
- **Lines 8-11**: Initial state (user, token, auth status, loading flag)
- **Lines 12-26**: Login function - sends credentials, stores token, updates state
- **Lines 29-40**: Register function - creates account, stores token
- **Lines 41-43**: Logout function - clears token and state
- **Lines 48-57**: fetchMe function - verify token on app startup
- **Lines 61-62**: Persist settings - save to localStorage key `curalink-auth`

---

## 3. Authentication Flow (JWT + Bcrypt)

### Step-by-Step Registration & Login

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER REGISTRATION FLOW                        │
└─────────────────────────────────────────────────────────────────┘

1. Frontend:  User fills RegisterPage with name, email, password, role
              ↓
2. Frontend:  calls useAuthStore().register(userData)
              (frontend/src/store/authStore.js, line 26)
              ↓
3. Frontend:  api.post('/auth/register', userData)  [Vite proxy → backend]
              ↓
4. Backend:   Receives POST /api/auth/register
              (backend/routes/auth.js, line 9)
              ↓
5. Backend:   Check if email exists in DB
              await User.findOne({ email })
              ↓
6. Backend:   If NOT exists, create new user:
              await User.create({ name, email, password, role, ... })
              (backend/models/User.js triggers pre-save hook)
              ↓
7. Backend:   Pre-save hook: Hash password with bcryptjs
              bcrypt.hash(password, 12)
              → Hashed password saved to DB, plain password discarded
              ↓
8. Backend:   Generate JWT token:
              jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' })
              (backend/routes/auth.js, line 6)
              ↓
9. Backend:   Return: { success: true, token: '...', user: {...} }
              ↓
10. Frontend: Store token in localStorage
               set { user, token, isAuthenticated: true }
               ↓
11. Frontend: Redirect to Dashboard

┌─────────────────────────────────────────────────────────────────┐
│                     USER LOGIN FLOW                              │
└─────────────────────────────────────────────────────────────────┘

1. Frontend:  User enters email + password in LoginPage
              ↓
2. Frontend:  calls useAuthStore().login(email, password)
              (frontend/src/store/authStore.js, line 16)
              ↓
3. Frontend:  api.post('/auth/login', { email, password })
              [Vite proxy → backend]
              ↓
4. Backend:   Receives POST /api/auth/login
              (backend/routes/auth.js, line 28)
              ↓
5. Backend:   Query user by email:
              const user = await User.findOne({ email }).select('+password')
              → .select('+password') because password field has select: false in schema
              ↓
6. Backend:   Compare passwords:
              await user.comparePassword(password)
              → Uses bcrypt.compare(plainPassword, hashedPasswordFromDB)
              (backend/models/User.js)
              ↓
7. Backend:   If password matches:
              - Update lastLogin timestamp
              - Generate JWT token
              - Return { token, user }
              ↓
8. Frontend: Store token in localStorage
             set { user, token, isAuthenticated: true }
             ↓
9. Frontend: Redirect to Dashboard
```

### Backend Auth Route Details

📁 **Folder**: `backend/routes/`  
📄 **File**: [auth.js](backend/routes/auth.js)
**Total Lines**: 82

```javascript
// backend/routes/auth.js

// LINE 1: Import Express framework
const express = require('express');
// LINE 2: Create router object for auth routes
const router = express.Router();
// LINE 3: Import JWT library for token creation
const jwt = require('jsonwebtoken');
// LINE 4: Import User model from MongoDB
const User = require('../models/User');
// LINE 5: Import auth middleware
const { protect } = require('../middleware/auth');

// LINE 7-10: Helper function to generate JWT tokens
const generateToken = (id) => {
  // LINE 8: Sign the JWT with user ID
  return jwt.sign(
    { id },                              // Payload: contain user's MongoDB ID
    process.env.JWT_SECRET,              // Secret key from .env (must be kept safe!)
    { expiresIn: process.env.JWT_EXPIRE } // Expiration time (typically 7d)
  );
};

// LINE 13: POST /api/auth/register endpoint
// LINE 14: async = wait for async operations (database, hashing)
router.post('/register', async (req, res) => {
  try {
    // LINE 16: Extract fields from request body
    const { name, email, password, role, specialization, institution, conditions } = req.body;

    // LINE 19: Check if email already exists in database
    const existing = await User.findOne({ email });
    // LINE 20: If exists, return 400 (Bad Request) error
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // LINE 24: Create new user in database
    // This triggers the pre-save hook that hashes the password!
    const user = await User.create({
      name, email, password, role: role || 'patient',
      specialization, institution, conditions
    });

    // LINE 30: Generate JWT token for the new user
    const token = generateToken(user._id);
    
    // LINE 33: Return 201 (Created) with token and user data
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        specialization: user.specialization,
        institution: user.institution
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    // LINE 46: Return 500 (Server Error) if anything fails
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

// LINE 50: POST /api/auth/login endpoint
router.post('/login', async (req, res) => {
  try {
    // LINE 52: Extract email and password from request
    const { email, password } = req.body;

    // LINE 55: Check if both email and password were provided
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // LINE 60: Find user by email AND include password field
    // .select('+password') because password field has select: false by default
    const user = await User.findOne({ email }).select('+password');
    
    // LINE 63: Check if user exists AND password matches
    // user.comparePassword() uses bcrypt.compare() internally
    if (!user || !(await user.comparePassword(password))) {
      // LINE 65: Return 401 (Unauthorized) - don't specify if email or password is wrong
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // LINE 69: Update last login timestamp
    user.lastLogin = new Date();
    // LINE 70: Save to database (validateBeforeSave: false = skip validation)
    await user.save({ validateBeforeSave: false });

    // LINE 73: Generate JWT token
    const token = generateToken(user._id);
    
    // LINE 76: Return 200 (OK) with token and user data
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        specialization: user.specialization,
        institution: user.institution,
        avatar: user.avatar,
        bio: user.bio
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// LINE 73: GET /api/auth/me endpoint (Protected route)
// protect middleware = user must be authenticated
router.get('/me', protect, async (req, res) => {
  // LINE 74: req.user is already loaded by protect middleware
  res.json({ success: true, user: req.user });
});

// LINE 77: PUT /api/auth/profile endpoint (Update user profile)
// protect middleware = user must be authenticated
router.put('/profile', protect, async (req, res) => {
  try {
    // LINE 80: Extract fields to update
    const { name, specialization, institution, bio, conditions, preferences } = req.body;
    
    // LINE 81: Find user by ID and update their data
    const user = await User.findByIdAndUpdate(
      req.user._id,                                    // Which user to update
      { name, specialization, institution, bio, conditions, preferences }, // What to update
      { new: true, runValidators: true }             // Return updated doc, run schema validation
    );
    
    // LINE 86: Return updated user
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Line-by-Line Explanation**:
- **Lines 1-5**: Import required modules
- **Lines 7-10**: Token generator function - creates JWT with expiration
- **Line 13**: Register endpoint definition
- **Line 16**: Extract registration data from request
- **Line 19**: Check for duplicate email
- **Line 24**: Create user (password auto-hashed by MongoDB pre-save hook)
- **Line 30**: Generate JWT token
- **Line 33**: Return token and user profile
- **Line 50**: Login endpoint definition
- **Line 52**: Extract email & password
- **Line 60**: Find user by email (include password for comparison)
- **Line 63**: Verify password using bcrypt.compare()
- **Line 69-70**: Update and save last login time
- **Line 73**: Generate new JWT for this session
- **Line 76**: Return token and user data

### User Model with Password Hashing

📁 **Folder**: `backend/models/`  
📄 **File**: [User.js](backend/models/User.js)
**Total Lines**: 100+

```javascript
// backend/models/User.js

// LINE 1: Import Mongoose for database schema
const mongoose = require('mongoose');
// LINE 2: Import bcryptjs for password hashing
const bcrypt = require('bcryptjs');

// LINE 4: Define User schema
const userSchema = new mongoose.Schema({
  // LINE 5: User's full name
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  
  // LINE 12: User's email (must be unique)
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format']
  },
  
  // LINE 20: User's password
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false  // ← IMPORTANT: Don't include password in queries by default
  },
  
  // LINE 26: User role (determines permissions)
  role: {
    type: String,
    enum: ['patient', 'researcher', 'admin'],
    default: 'patient'
  },
  
  // LINE 32: Profile fields (optional)
  avatar: { type: String, default: '' },
  specialization: { type: String, default: '' },
  institution: { type: String, default: '' },
  conditions: [{ type: String }],
  bio: { type: String, maxlength: [500, 'Bio cannot exceed 500 characters'] },
  
  // LINE 40: Track user's search history
  searchHistory: [{
    query: String,
    type: { type: String, enum: ['pubmed', 'trials', 'ai'] },
    timestamp: { type: Date, default: Date.now }
  }],
  
  // LINE 47: User preferences
  preferences: {
    notifications: { type: Boolean, default: true },
    emailUpdates: { type: Boolean, default: true },
    theme: { type: String, default: 'light' }
  },
  
  // LINE 53: Verification status
  isVerified: { type: Boolean, default: false },
  lastLogin: { type: Date }
});

// LINE 58: PRE-SAVE HOOK - Runs BEFORE saving to database
// This is where password hashing happens!
userSchema.pre('save', async function(next) {
  // LINE 60: Skip if password hasn't been modified
  if (!this.isModified('password')) return next();
  
  // LINE 63: Generate salt for bcrypt (rounds = 10 = moderate security)
  const salt = await bcrypt.genSalt(10);
  
  // LINE 66: Hash the plain password with the salt
  this.password = await bcrypt.hash(this.password, 12);
  
  // LINE 69: Continue to actual save
  next();
});

// LINE 72: METHOD - Compare candidate password with hashed password
userSchema.methods.comparePassword = async function(candidatePassword) {
  // LINE 73: Use bcrypt.compare to safely compare passwords
  // Returns true if passwords match, false otherwise
  return await bcrypt.compare(candidatePassword, this.password);
};

// LINE 77: METHOD - Override toJSON to exclude password from API responses
userSchema.methods.toJSON = function() {
  // LINE 78: Convert mongoose doc to plain JavaScript object
  const obj = this.toObject();
  
  // LINE 81: Remove password field
  delete obj.password;
  
  // LINE 84: Return object without password
  return obj;
};

// LINE 87: Create and export the User model
module.exports = mongoose.model('User', userSchema);
```

**Line-by-Line Explanation**:
- **Lines 1-2**: Import Mongoose and bcryptjs
- **Lines 4-56**: Define schema with all fields
  - **Line 25**: `select: false` = password not returned by default
  - **Lines 26-29**: Role-based access control
  - **Lines 40-45**: Search history tracking
- **Lines 58-70**: Pre-save hook
  - **Line 60**: Skip hashing if password not changed
  - **Line 63**: Generate salt (bcryptjs best practice)
  - **Line 66**: Hash password with salt rounds = 12 (very secure!)
- **Lines 72-75**: comparePassword method
  - Uses bcryptjs.compare (secure comparison)
- **Lines 77-85**: toJSON override
  - Automatically removes password from API responses
- **Line 87**: Export model for use in routes

---

## 4. Backend Server Setup

### Express Server Initialization

📁 **Folder**: `backend/`  
📄 **File**: [server.js](backend/server.js)
**Total Lines**: 83

```javascript
// backend/server.js

// LINE 1: Import Express framework
const express = require('express');
// LINE 2: Import Mongoose for MongoDB connection
const mongoose = require('mongoose');
// LINE 3: Import CORS middleware
const cors = require('cors');
// LINE 4: Import Helmet for security headers
const helmet = require('helmet');
// LINE 5: Import Morgan for HTTP logging
const morgan = require('morgan');
// LINE 6: Import rate limiting middleware
const rateLimit = require('express-rate-limit');
// LINE 7: Load environment variables from .env file
require('dotenv').config();

// LINE 9: Create Express app instance
const app = express();

// LINE 11: Apply Helmet middleware - adds security headers
app.use(helmet());
// LINE 12: Apply Morgan middleware - logs all HTTP requests
app.use(morgan('dev'));

// LINE 14-20: Configure rate limiting
const limiter = rateLimit({
  // LINE 15: Time window = 15 minutes
  windowMs: 15 * 60 * 1000,
  // LINE 16: Max 200 requests per window
  max: 200,
  // LINE 17: Custom error message
  message: { error: 'Too many requests, please try again later.' }
});
// LINE 19: Apply rate limiter to all /api/* routes
app.use('/api/', limiter);

// LINE 21-29: Configure CORS
app.use(cors({
  // LINE 22: Allow requests from frontend ports
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  // LINE 23: Allow cookies/credentials
  credentials: true,
  // LINE 24: Allowed HTTP methods
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  // LINE 25: Allowed request headers
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// LINE 27: Parse JSON request bodies (max 10MB)
app.use(express.json({ limit: '10mb' }));
// LINE 28: Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// LINE 30-34: Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected to CuraLink DB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// LINE 36-45: Mount all route modules
// LINE 36: Authentication routes
app.use('/api/auth', require('./routes/auth'));
// LINE 37: PubMed research routes
app.use('/api/research', require('./routes/research'));
// LINE 38: OpenAlex academic research routes
app.use('/api/openalex', require('./routes/openalex'));
// LINE 39: Unified multi-source search with AI ranking
app.use('/api/unified', require('./routes/unified'));
// LINE 40: Structured medical search
app.use('/api/structured', require('./routes/structured'));
// LINE 41: Clinical trials routes
app.use('/api/trials', require('./routes/trials'));
// LINE 42: AI chat and summarization routes
app.use('/api/ai', require('./routes/ai'));
// LINE 43: User management routes
app.use('/api/users', require('./routes/users'));
// LINE 44: Bookmark management routes
app.use('/api/bookmarks', require('./routes/bookmarks'));
// LINE 45: Search history routes
app.use('/api/history', require('./routes/history'));

// LINE 47-55: Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'CuraLink API is running',
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// LINE 57-60: 404 handler - for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Lines 69-76: Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Lines 78-83: Start server
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 CuraLink Server running on port ${PORT}`);
  });
}

module.exports = app;
```

### Auth Middleware

📁 **Folder**: `backend/middleware/`  
📄 **File**: [auth.js](backend/middleware/auth.js)

```javascript
// Protect middleware - Requires valid JWT
exports.protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Extract from "Bearer <token>"
  
  if (!token) {
    return res.status(401).json({ error: 'Not authorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify JWT signature
    req.user = await User.findById(decoded.id);                // Load user from DB
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Optional auth - Tries to authenticate but doesn't fail without token
exports.optionalAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
    } catch (error) {
      console.log('Optional auth failed:', error.message);
      // Don't fail, just continue without user
    }
  }
  
  next(); // Continue regardless
};
```

---

## 5. Database Models

### ChatSession Model

📁 **Folder**: `backend/models/`  
📄 **File**: [ChatSession.js](backend/models/ChatSession.js)

```javascript
const chatSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.ObjectId, ref: 'User' },  // Reference to user
  title: String,                                          // Session title (first 60 chars of first message)
  context: { type: String, enum: ['patient', 'researcher', 'general'] },
  messages: [{
    role: { type: String, enum: ['user', 'assistant'] },
    content: String,
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
```

### Bookmark Model

📁 **Folder**: `backend/models/`  
📄 **File**: [Bookmark.js](backend/models/Bookmark.js)

```javascript
const bookmarkSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  title: String,
  source: { type: String, enum: ['pubmed', 'openalex', 'trials'] },
  sourceId: String,                           // PubMed ID, OpenAlex ID, etc.
  abstract: String,
  publishedDate: Date,
  authors: [String],
  journal: String,
  url: String,
  createdAt: { type: Date, default: Date.now }
});
```

---

## 6. API Routes & Data Flow

### Complete Route Mapping

| Route | Method | Auth | Purpose | File | Line |
|-------|--------|------|---------|------|------|
| `/api/auth/register` | POST | None | Create new user account | `backend/routes/auth.js` | 8 |
| `/api/auth/login` | POST | None | Authenticate user, return JWT | `backend/routes/auth.js` | 28 |
| `/api/auth/me` | GET | Required | Get current user profile | `backend/routes/auth.js` | 67 |
| `/api/auth/profile` | PUT | Required | Update user profile | `backend/routes/auth.js` | 72 |
| `/api/ai/chat` | POST | Optional | Send message to AI assistant | `backend/routes/ai.js` | 63 |
| `/api/ai/summarize` | POST | Optional | AI summarize research paper | `backend/routes/ai.js` | 112 |
| `/api/ai/analyze-results` | POST | Optional | AI rank search results | `backend/routes/ai.js` | 126 |
| `/api/unified/search` | GET | Optional | Search all sources + AI rank | `backend/routes/unified.js` | 30 |
| `/api/research` | GET | None | Direct PubMed search | `backend/routes/research.js` | - |
| `/api/trials` | GET | None | Direct ClinicalTrials.gov search | `backend/routes/trials.js` | - |
| `/api/bookmarks` | GET | Required | Get user bookmarks | `backend/routes/bookmarks.js` | - |
| `/api/bookmarks` | POST | Required | Save bookmark | `backend/routes/bookmarks.js` | - |
| `/api/history` | GET | Required | Get search history | `backend/routes/history.js` | - |

---

## 7. AI Integration (Ollama + Groq)

### Why Two AI Backends?

| Aspect | Ollama (Local) | Groq (Cloud) |
|--------|--------|------|
| **Response Time** | 15-30 seconds (local inference) | 1-3 seconds (cloud optimized) |
| **Cost** | Free (runs locally) | Paid API (but faster) |
| **Privacy** | All data stays on your machine | Data sent to Groq servers |
| **Model Size** | Lightweight (llama3.2 ~4-7GB) | Large (llama-3.3-70b = most capable) |
| **Downtime Risk** | Only if your machine is down | Only if Groq is down |
| **Setup** | Download + run Ollama | Get API key, set ENV |

**CuraLink Strategy**: Try Groq first (faster), fall back to Ollama (always available)

### AI Route Implementation

📁 **Folder**: `backend/routes/`  
📄 **File**: [ai.js](backend/routes/ai.js)

#### Groq API Integration (Lines 44-65)

```javascript
// When GROQ_API_KEY is set in .env, try Groq first
if (process.env.GROQ_API_KEY) {
  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',  // Groq API endpoint
      {
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',  // Model to use
        messages: [
          { role: 'system', content: system },  // System prompt
          ...messages                           // Chat history
        ],
        max_tokens: 1024,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,  // API key from .env
          'Content-Type': 'application/json'
        },
        timeout: 30000  // 30 second timeout
      }
    );
    return response.data.choices[0].message.content;  // Return AI response
  } catch (error) {
    console.error('Groq failed, trying Ollama fallback:', error.message);
    // Fall through to Ollama if Groq fails
  }
}

// Fallback to local Ollama (Lines 68-81)
try {
  const response = await axios.post(
    `${OLLAMA_BASE}/api/chat`,  // Local Ollama endpoint
    {
      model: OLLAMA_MODEL,                    // llama3.2 or other
      messages: [                              // System prompt + chat history
        { role: 'system', content: system },
        ...messages
      ],
      stream: false,                          // Don't stream (wait for full response)
      options: {
        temperature: 0.7,
        top_p: 0.9,
        num_predict: 1024  // Max tokens
      }
    },
    { timeout: 120000 }  // 2 minute timeout for local LLM
  );
  return response.data?.message?.content;
} catch (error) {
  if (error.code === 'ECONNREFUSED') {
    throw new Error('OLLAMA_NOT_RUNNING');  // Ollama not started
  }
  throw error;
}
```

#### Configuration via Environment Variables

```bash
# .env file

# Groq (Cloud - optional)
GROQ_API_KEY=gsk_...                    # Get from https://console.groq.com
GROQ_MODEL=llama-3.3-70b-versatile      # Groq's most capable model

# Ollama (Local - always available)
OLLAMA_URL=http://localhost:11434       # Default Ollama local endpoint
OLLAMA_MODEL=llama3.2                   # Model to use locally

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/curalink

# Server
PORT=5000
NODE_ENV=development
```

#### System Prompt

```javascript
// Lines 14-19 in ai.js
const SYSTEM_PROMPT = `You are Cura, an expert AI medical research assistant for CuraLink.
You help patients and researchers understand medical research, clinical trials, and treatments.
Always note information is educational only, not medical advice.
Use markdown formatting. Be accurate, empathetic, and clear.`;
```

#### POST /api/ai/chat Endpoint

📄 **File**: [ai.js](backend/routes/ai.js) **Lines 63-110**

```javascript
router.post('/chat', optionalAuth, async (req, res) => {
  try {
    const { message, sessionId, context = 'general' } = req.body;
    
    if (!message) return res.status(400).json({ error: 'Message is required' });

    // Step 1: Load or create chat session
    let session;
    if (sessionId && req.user) {
      session = await ChatSession.findOne({ _id: sessionId, user: req.user._id });
    }
    if (!session && req.user) {
      session = new ChatSession({
        user: req.user._id,
        title: message.substring(0, 60),
        context,
        messages: []
      });
    }

    // Step 2: Build conversation history (last 6 messages)
    const history = session ? session.messages.slice(-6).map(m => ({
      role: m.role,
      content: m.content
    })) : [];
    history.push({ role: 'user', content: message });

    // Step 3: Call AI (Groq or Ollama)
    let aiResponse;
    try {
      aiResponse = await callOllama(history);  // Tries Groq first, then Ollama
    } catch (err) {
      console.error('[AI Chat] callOllama error:', err.message);
      if (err.message === 'OLLAMA_NOT_RUNNING') {
        aiResponse = ollamaFallback(message);  // Show setup instructions
      } else {
        aiResponse = `**AI Error:** ${err.message}...`;
      }
    }

    // Step 4: Save to chat history (non-blocking)
    if (session) {
      try {
        session.messages.push({ role: 'user', content: message });
        session.messages.push({ role: 'assistant', content: aiResponse });
        await session.save();
      } catch (saveErr) {
        console.error('[AI Chat] Session save failed:', saveErr.message);
        // Continue even if save fails
      }
    }

    // Step 5: Update user search history (non-blocking)
    if (req.user) {
      try {
        await User.findByIdAndUpdate(
          req.user._id,
          {
            $push: {
              searchHistory: {
                $each: [{
                  query: message.substring(0, 100),
                  type: 'ai',
                  timestamp: new Date()
                }],
                $slice: -50  // Keep only last 50 entries
              }
            }
          }
        );
      } catch (histErr) {
        console.error('[AI Chat] History update failed:', histErr.message);
      }
    }

    // Step 6: Return response
    res.json({
      success: true,
      response: aiResponse,
      sessionId: session?._id
    });
  } catch (error) {
    console.error('[AI Chat] Unhandled error:', error.message);
    res.status(500).json({ error: 'AI service error', detail: error.message });
  }
});
```

#### POST /api/ai/summarize Endpoint

📄 **File**: [ai.js](backend/routes/ai.js) **Lines 112-125**

```javascript
router.post('/summarize', optionalAuth, async (req, res) => {
  try {
    const { abstract, title, type = 'patient' } = req.body;
    
    // Different prompts for patients vs researchers
    const prompt = type === 'patient'
      ? `Summarize this paper for a patient in 3-4 bullet points using plain English:\n\nTitle: ${title}\nAbstract: ${abstract}`
      : `Technical summary with key findings, methodology, and clinical implications:\n\nTitle: ${title}\nAbstract: ${abstract}`;
    
    let summary;
    try {
      summary = await callOllama(
        [{ role: 'user', content: prompt }],
        'You are a medical research summarizer. Be concise and accurate.'
      );
    } catch (err) {
      summary = err.message === 'OLLAMA_NOT_RUNNING'
        ? 'Start Ollama for AI summaries. See chat page for setup instructions.'
        : `Summary failed: ${err.message}`;
    }
    
    res.json({ summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### POST /api/ai/analyze-results Endpoint

📄 **File**: [ai.js](backend/routes/ai.js) **Lines 126-175**

```javascript
router.post('/analyze-results', optionalAuth, async (req, res) => {
  try {
    const { query, disease, results, context = 'general', topN = 8 } = req.body;
    
    if (!results?.length) return res.status(400).json({ error: 'Results required' });

    // Format results for AI analysis
    const summary = results.slice(0, 10).map((r, i) =>
      `[${i}] ${r.source}|${r.type?.toUpperCase()}
TITLE: ${(r.title || '').slice(0, 100)}
META: ${r.type === 'trial' ? `Status:${r.status}|Phase:${r.phase}` : `Year:${r.publishedDate || 'N/A'}|Journal:${r.journal || 'N/A'}`}
ABSTRACT: ${(r.abstract || '').slice(0, 200)}`
    ).join('\n---\n');

    const prompt = `Medical research curator task: select the ${topN} most relevant results.
QUERY: "${query}" | DISEASE: "${disease || query}" | CONTEXT: ${context}

[Search Results]
${summary}

Output JSON: { "selectedIndices": [0, 3, 5, ...], "reasoning": "..." }`;

    let analysisJSON = {};
    try {
      const analysis = await callOllama([{ role: 'user', content: prompt }]);
      analysisJSON = JSON.parse(analysis);
    } catch (err) {
      console.error('[Analyze Results] AI parsing failed:', err.message);
      // Return all results if AI fails
      analysisJSON = { selectedIndices: results.map((_, i) => i) };
    }

    const ranked = (analysisJSON.selectedIndices || [])
      .map(i => results[i])
      .filter(Boolean);

    res.json({
      ranked,
      reasoning: analysisJSON.reasoning || 'Ranked by relevance'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### System Prompt & Fallback

```javascript
// Lines 14-19: System prompt for Cura assistant
const SYSTEM_PROMPT = `You are Cura, an expert AI medical research assistant for CuraLink.
You help patients and researchers understand medical research, clinical trials, and treatments.
Always note information is educational only, not medical advice.
Use markdown formatting. Be accurate, empathetic, and clear.`;

// Lines 83-90: Fallback message if Ollama not running
function ollamaFallback(msg) {
  return `**Ollama (Local LLM) is not running.**\n\nTo enable AI:\n1. Install from **https://ollama.com/download**\n2. Run: \`ollama pull llama3.2\`\n3. Run: \`ollama serve\`\n4. Restart backend\n\nYour question: "${msg}"\n\n> All search features (PubMed, OpenAlex, ClinicalTrials) work without Ollama.`;
}
```

---

## 8. Unified Search Pipeline

### What the Unified Search Does

The unified search is the **core intelligence** of CuraLink. It:

1. **Queries 3 medical databases in parallel** (PubMed, OpenAlex, ClinicalTrials.gov)
2. **Collects 50-300 raw results** from each source
3. **Uses AI (Groq or Ollama) to rank and filter** the results
4. **Returns 8-10 most relevant results** with AI reasoning

###GET /api/unified/search Endpoint

📁 **Folder**: `backend/routes/`  
📄 **File**: [unified.js](backend/routes/unified.js) **Lines 1-30**

```javascript
/**
 * UNIFIED SEARCH + LLM FILTERING PIPELINE
 * 
 * Flow:
 *  1. Query all 3 APIs in parallel (PubMed, OpenAlex, ClinicalTrials.gov)
 *  2. Each returns 50–300 raw results
 *  3. A custom LLM prompt scores & selects the 8–10 most relevant records
 *  4. Returns ranked, annotated results with AI reasoning
 *
 * GET /api/unified/search?query=...&context=patient|researcher&limit=100
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const xml2js = require('xml2js');
const NodeCache = require('node-cache');
const { optionalAuth } = require('../middleware/auth');

// 5-minute response caching to avoid repeated API calls
const cache = new NodeCache({ stdTTL: 300 });

// API endpoints
const PUBMED_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const OPENALEX_BASE = 'https://api.openalex.org';
const CT_BASE = 'https://clinicaltrials.gov/api/v2';
const OLLAMA_BASE = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

// GET /api/unified/search handler
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const { query, context = 'patient', limit = 100 } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const cacheKey = `unified_${query}_${context}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);  // Return cached if available

    // Fetch from all 3 sources in parallel
    const [pubmedResults, openalexResults, trialsResults] = await Promise.all([
      fetchPubMed(query, limit),
      fetchOpenAlex(query, limit),
      fetchTrials(query, limit)
    ]);

    // Combine all results
    const allResults = [
      ...pubmedResults,
      ...openalexResults,
      ...trialsResults
    ];

    // Use AI to rank and filter (keep top 8-10)
    const rankedResults = await rankWithAI(query, context, allResults);

    const response = {
      query,
      context,
      results: rankedResults,
      totalAvailable: allResults.length,
      timestamp: new Date().toISOString()
    };

    cache.set(cacheKey, response);  // Cache for 5 minutes
    res.json(response);
  } catch (error) {
    console.error('[Unified Search] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});
```

### PubMed Fetcher (Lines 40-100)

```javascript
async function fetchPubMed(query, count = 100) {
  try {
    // Step 1: Search for PMIDs (PubMed article IDs)
    const searchRes = await axios.get(`${PUBMED_BASE}/esearch.fcgi`, {
      params: {
        db: 'pubmed',
        term: query,
        retmax: Math.min(Math.max(count, 50), 300),  // Clamp between 50-300
        retmode: 'json',
        sort: 'relevance'
      },
      timeout: 12000
    });

    const ids = searchRes.data.esearchresult?.idlist || [];
    const total = parseInt(searchRes.data.esearchresult?.count || '0');

    if (!ids.length) return { results: [], total, source: 'PubMed' };

    // Step 2: Fetch details in batches (PubMed limits to 100 IDs per fetch)
    const batches = [];
    for (let i = 0; i < ids.length; i += 100) {
      batches.push(ids.slice(i, i + 100));
    }

    const allArticles = [];
    for (const batch of batches) {
      const fetchRes = await axios.get(`${PUBMED_BASE}/efetch.fcgi`, {
        params: {
          db: 'pubmed',
          id: batch.join(','),
          retmode: 'xml',
          rettype: 'abstract'
        },
        timeout: 15000
      });

      // Parse XML response
      const parsed = await parseXML(fetchRes.data);
      const articles = parsed?.PubmedArticleSet?.PubmedArticle;
      const arr = Array.isArray(articles) ? articles : (articles ? [articles] : []);

      // Extract fields
      arr.forEach(article => {
        try {
          const medline = article.MedlineCitation;
          const ad = medline?.Article;
          const pmid = medline?.PMID?._ || medline?.PMID;
          const title = ad?.ArticleTitle || '';
          const abstract = ad?.Abstract?.AbstractText?._ || ad?.Abstract?.AbstractText || '';
          const journal = ad?.Journal?.Title || '';
          const pubDate = ad?.Journal?.JournalIssue?.PubDate;
          const year = pubDate?.Year || new Date().getFullYear();

          allArticles.push({
            id: pmid,
            source: 'PubMed',
            type: 'article',
            title,
            abstract: typeof abstract === 'string' ? abstract : abstract?.map?.(a => a?._)?.join(' ') || '',
            journal,
            publishedDate: year,
            url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}`,
            authors: extractAuthors(ad?.AuthorList?.Author)
          });
        } catch (parseErr) {
          console.error('PubMed article parse error:', parseErr.message);
        }
      });
    }

    return { results: allArticles, total, source: 'PubMed' };
  } catch (error) {
    console.error('[PubMed] Fetch error:', error.message);
    return { results: [], total: 0, source: 'PubMed', error: error.message };
  }
}
```

### AI Ranking Function

```javascript
async function rankWithAI(query, context, allResults) {
  if (!allResults.length) return [];

  try {
    // Format results for AI evaluation
    const resultsText = allResults.slice(0, 30).map((r, i) =>
      `[${i}] ${r.source} | ${r.type?.toUpperCase() || 'DOCUMENT'}
Title: ${(r.title || '').substring(0, 100)}
${r.abstract ? `Abstract: ${r.abstract.substring(0, 200)}` : ''}
${r.status ? `Status: ${r.status}` : ''}
${r.phase ? `Phase: ${r.phase}` : ''}`
    ).join('\n\n');

    // AI prompt to select top results
    const prompt = `You are a medical research expert. Given a ${context}-focused search for "${query}", select the 8-10 MOST relevant results. 
Return a JSON object with indices of selected results and brief reasoning.

Results:
${resultsText}

Return ONLY valid JSON: { "selectedIndices": [0, 2, 5, ...], "reasoning": "..." }`;

    // Call AI
    const response = await callOllama([{ role: 'user', content: prompt }]);
    const parsed = JSON.parse(response);
    const selectedIndices = parsed.selectedIndices || [];

    // Return ranked results in order
    return selectedIndices
      .map(i => allResults[i])
      .filter(Boolean)
      .slice(0, 10);
  } catch (error) {
    console.error('[AI Ranking] Error:', error.message);
    // Fallback: return first 10 results unsorted
    return allResults.slice(0, 10);
  }
}
```

---

## 9. Complete Request-Response Cycle

### Example: User logs in and searches for cancer research

```
┌─────────────────────────────────────────────────────────────────────────┐
│           COMPLETE USER JOURNEY: LOGIN → SEARCH → AI CHAT               │
└─────────────────────────────────────────────────────────────────────────┘

PHASE 1: LOGIN
═════════════════════════════════════════════════════════════════════════

User enters email & password on LoginPage (React component)
        ↓
Frontend: useAuthStore().login('user@example.com', 'password')
        ↓
Frontend/src/store/authStore.js, Line 16:
  - set({ loading: true })
  - api.post('/auth/login', { email, password })
        ↓
Axios interceptor (frontend/src/utils/api.js, Line 17):
  - attachToken(config) — tries to add token (none yet)
  - Vite proxy intercepts /api → redirects to http://localhost:5000
        ↓
Backend receives: POST http://localhost:5000/api/auth/login
        ↓
Backend/routes/auth.js, Line 28:
  - Extract email & password from req.body
  - Query: User.findOne({ email }).select('+password')
  - If user exists: await user.comparePassword(password)
    → bcrypt.compare(plainPassword, hashedPasswordFromDB)
  - If match: generateToken(user._id)
    → jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' })
        ↓
Backend returns: 
  {
    success: true,
    token: 'eyJhbGc...',
    user: { id: '...', name: 'John', email: 'user@example.com', role: 'patient' }
  }
        ↓
Frontend catches response:
  - localStorage.setItem('token', data.token)
  - Zustand store: set({ user: data.user, token: data.token, isAuthenticated: true })
  - set({ loading: false })
        ↓
Frontend redirects to /dashboard


PHASE 2: SEARCH FOR CANCER RESEARCH
═════════════════════════════════════════════════════════════════════════

User types "cancer immunotherapy trials" in search box
        ↓
Frontend: api.get('/unified/search', { params: { query: '...', context: 'patient' } })
        ↓
Axios interceptor (frontend/src/utils/api.js, Line 17):
  - attachToken(config)
  - Retrieves token from localStorage
  - Sets Authorization header: 'Bearer eyJhbGc...'
        ↓
Backend receives: GET http://localhost:5000/api/unified/search?query=...
        ↓
Backend/routes/unified.js, Line 30 (optionalAuth middleware):
  - Extract token from req.headers.authorization
  - jwt.verify(token, JWT_SECRET) → loads req.user
  - User is now authenticated, can save search history
        ↓
Backend parallelizes 3 API calls:
  - fetchPubMed('cancer immunotherapy trials', 100)
  - fetchOpenAlex('cancer immunotherapy trials', 100)
  - fetchTrials('cancer immunotherapy trials', 100)
        ↓
Backend/routes/unified.js, Lines 40-100 (PubMed):
  - esearch.fcgi → get 100 article IDs
  - efetch.fcgi (batched) → get full XML with title, abstract, journal
  - Parse XML → extract fields
        ↓
Backend/routes/unified.js (OpenAlex):
  - GET https://api.openalex.org/works?search=...
  - Extract: title, abstract, publication_year, authors
        ↓
Backend/routes/unified.js (ClinicalTrials):
  - GET https://clinicaltrials.gov/api/v2/studies?query=...
  - Extract: title, status, phase, conditions, enrollment
        ↓
All 3 sources return ~150 combined results
        ↓
Backend calls rankWithAI(query, context, allResults):
  - Format top 30 results into text
  - Create prompt for Groq/Ollama:
    "Select 8-10 most relevant for PATIENT context..."
  - If GROQ_API_KEY set:
    POST https://api.groq.com/openai/v1/chat/completions
      - Model: llama-3.3-70b-versatile
      - Timeout: 30 seconds
    → Returns AI response in 1-3 seconds (FAST!)
  - If Groq fails or no key:
    POST http://localhost:11434/api/chat
      - Model: llama3.2
      - Timeout: 120 seconds
    → Returns AI response in 15-30 seconds (fallback)
        ↓
AI returns JSON:
  { "selectedIndices": [0, 2, 5, 8, 12, 18, 25, 31], "reasoning": "..." }
        ↓
Backend filters & returns:
  {
    query: "cancer immunotherapy trials",
    results: [
      { title: "...", source: "ClinicalTrials", type: "trial", status: "Recruiting", ... },
      { title: "...", source: "PubMed", type: "article", journal: "...", ... },
      ...  (8-10 results)
    ]
  }
        ↓
Axios response interceptor (frontend/src/utils/api.js, Line 34):
  - check status === 401? (No, 200 OK)
  - Return data
        ↓
Frontend state:
  - Display search results in UI
  - Save to component state/store


PHASE 3: AI CHAT ABOUT RESULTS
═════════════════════════════════════════════════════════════════════════

User clicks "Summarize" on a PubMed article
        ↓
Frontend: apiAI.post('/ai/summarize', { abstract: '...', title: '...', type: 'patient' })
        ↓
Note: apiAI instance has timeout: 300000 (5 minutes) for slow LLM responses
        ↓
Axios interceptor attaches Authorization header (user is logged in)
        ↓
Backend receives: POST /api/ai/summarize
        ↓
Backend/routes/ai.js, Line 112:
  - Extract abstract, title, type from req.body
  - Build prompt for patient-friendly summary:
    "Summarize this paper for a patient in 3-4 bullet points..."
  - callOllama([{ role: 'user', content: prompt }])
        ↓
Groq fast path (if GROQ_API_KEY set):
  - POST https://api.groq.com/openai/v1/chat/completions
  - Model: llama-3.3-70b-versatile
  - Response in ~2 seconds:
    "• Key Finding 1: The study shows..."
        ↓
Ollama fallback (if Groq fails):
  - POST http://localhost:11434/api/chat
  - Model: llama3.2
  - Response in ~20 seconds:
    "• Key Finding 1: The study shows..."
        ↓
Backend saves to chat history (non-blocking):
  - Create or find ChatSession document
  - Add: { role: 'user', content: 'summarize...' }
  - Add: { role: 'assistant', content: 'Summary text...' }
  - session.save() (happens in background, doesn't block response)
        ↓
Backend updates user search history (non-blocking):
  - User.findByIdAndUpdate(
      req.user._id,
      { $push: { searchHistory: { query: '...', type: 'ai', timestamp: now } } }
    )
        ↓
Backend returns:
  {
    summary: "• Key Finding 1: The study shows ...\n• Key Finding 2: ...",
    success: true
  }
        ↓
Frontend displays summary in modal/sidebar
```

---

## Key Design Patterns

### 1. **Frontend → Backend Connection via Vite Proxy**
- Vite dev server proxies `/api/*` to backend at `http://localhost:5000`
- Eliminates CORS issues during development
- Axios client uses relative URLs (`/api/*`) which work in both dev and production

### 2. **JWT Authentication Flow**
- User logs in → Backend returns JWT token
- Token stored in `localStorage` (persists across page reloads)
- Every request includes token in `Authorization: Bearer <token>` header
- Backend middleware (`protect`, `optionalAuth`) validates JWT and loads user

### 3. **Password Security (Bcrypt)**
- User password never stored in plaintext
- Pre-save hook hashes password: `bcrypt.hash(password, 12)` (12 rounds = strong)
- On login: `bcrypt.compare(plainPassword, hashedFromDB)`
- Password field has `select: false` in schema → not returned in API responses

### 4. **AI Fallback Strategy (Groq → Ollama)**
- **Fast path**: Try Groq cloud API first (1-3 seconds)
- **Fallback**: If Groq fails or no API key, use local Ollama (15-30 seconds)
- **Last resort**: Show helpful error message with setup instructions

### 5. **Unified Search Pipeline**
- Query 3 public databases in **parallel** (PubMed, OpenAlex, ClinicalTrials)
- Collect 50-300 raw results from each
- Use AI to **rank & filter** → return 8-10 most relevant
- Cache results for 5 minutes to avoid repeated API calls

### 6. **Non-Blocking Operations**
- After sending AI response, save to chat history & search history **in background**
- Don't wait for database save → faster user response
- If save fails, user still gets AI response (resilient)

### 7. **Role-Based Features**
- User roles: `patient`, `researcher`, `admin`
- AI provides different summaries based on role
- Search context can be: `patient` (plain language) or `researcher` (technical)

---

## Environment Configuration (.env)

```bash
# Frontend (frontend/.env)
VITE_API_BASE_URL=/api  # Uses Vite proxy

# Backend (backend/.env)

# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/curalink

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRE=7d

# Ollama (Local AI - required)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# Groq (Cloud AI - optional, provides faster responses)
GROQ_API_KEY=gsk_...your-key-here...
GROQ_MODEL=llama-3.3-70b-versatile
```

---

## Summary: How Everything Connects

```
User Browser (port 3000)
    ↓ (React + Vite)
    ├─→ Login Page → useAuthStore() → axios /api/auth/login
    │                                     ↓ [Vite Proxy]
    │   localStorage (JWT stored)    Express Backend (port 5000)
    │                                     ↓
    │   Dashboard Page → useAuthStore() → axios /api/unified/search
    │   (token auto-attached)              ↓
    │                            3 Parallel API Calls
    │                    ├─→ PubMed (NCBI)
    │                    ├─→ OpenAlex
    │                    └─→ ClinicalTrials.gov
    │                            ↓
    │                        Groq Cloud API [FAST 1-3s]
    │                            ↓ (fallback if fails)
    │                        Ollama Local LLM [SLOWER 15-30s]
    │                            ↓
    │   Search Results           AI-Ranked Results
    │   AI Chat Page → axios /api/ai/chat
    │                     ↓
    │            Groq [FAST] → Ollama [FALLBACK]
    │                     ↓
    │         Save to MongoDB (ChatSession, User searchHistory)
    │                     ↓
    │        Display AI Response + Chat History
```

---

## File Structure for Reference

```
curalink/
├── frontend/
│   ├── vite.config.js                 ← Proxy configuration
│   ├── src/
│   │   ├── main.jsx                   ← App entry
│   │   ├── App.jsx
│   │   ├── store/
│   │   │   └── authStore.js           ← Login/Register/Logout logic
│   │   ├── utils/
│   │   │   └── api.js                 ← Axios instances with interceptors
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ResearchPage.jsx
│   │   │   ├── AIChatPage.jsx
│   │   │   └── ...
│   │   └── components/
│   │       ├── layout/
│   │       └── ui/
│
├── backend/
│   ├── server.js                      ← Express app, middleware, route mounting
│   ├── middleware/
│   │   └── auth.js                    ← protect, optionalAuth middleware
│   ├── models/
│   │   ├── User.js                    ← User schema, bcrypt hash, JWT
│   │   ├── ChatSession.js             ← Chat history
│   │   └── Bookmark.js                ← Saved papers
│   ├── routes/
│   │   ├── auth.js                    ← /api/auth/* (register, login, profile)
│   │   ├── ai.js                      ← /api/ai/* (chat, summarize, analyze) [Groq + Ollama]
│   │   ├── unified.js                 ← /api/unified/search [Multi-source + AI rank]
│   │   ├── research.js                ← /api/research (PubMed)
│   │   ├── openalex.js                ← /api/openalex
│   │   ├── trials.js                  ← /api/trials (ClinicalTrials.gov)
│   │   ├── bookmarks.js               ← /api/bookmarks
│   │   ├── history.js                 ← /api/history
│   │   └── users.js                   ← /api/users
│   │
│   └── .env                           ← Configuration (JWT, MongoDB, Groq, Ollama)
│
├── ARCHITECTURE.md                    ← This file
├── package.json
└── README.md
```

---

## Groq vs Ollama: Performance Comparison

| Feature | Groq | Ollama |
|---------|------|--------|
| **Response Time** | 1-3 sec | 15-30 sec |
| **Model Size** | 70B (most capable) | 7B (lightweight) |
| **Cost** | $$ (API calls) | Free (local) |
| **Privacy** | Data to Groq servers | All local |
| **Setup** | Get API key, set ENV | Download + run locally |
| **Reliability** | Depends on Groq uptime | Only if machine is on |
| **Best For** | Fast production responses | Offline/private use |
| **CuraLink Use** | Primary choice | Reliable fallback |

**Why CuraLink uses both:**
- Groq is fast (users get answers in 1-3 seconds)
- Ollama is reliable (works even if Groq is down)
- Auto-fallback strategy means always works

---

**Last Updated**: 2026-06-08

This project is designed to work without a paid OpenAI API by using local LLM serving. If Ollama is not running, the backend returns a helpful fallback message and the rest of the platform still works.

---

## 7. Search and Research Pipeline

The project includes a multi-source research pipeline.

### Unified Pipeline (`/api/unified`)

This is the core research engine.

It does:

- Parallel source fetch from PubMed, OpenAlex, and ClinicalTrials.gov
- Normalizes all results into a shared structure
- Uses an LLM prompt to score and choose the best results
- Returns the final ranked research list

It also uses caching to reduce repeated API traffic.

### Structured Search (`/api/structured`)

This route is built for the structured search form.

It handles:

- disease name
- additional query text
- location filtering for trials
- query expansion logic
- parallel calls to PubMed, OpenAlex, and ClinicalTrials
- AI filtering/ranking of the best results

The structured search route is especially designed for clinician-style input and returns both research insights and clinical trial data.

---

## 8. Database Design

### MongoDB Collections

Key models in the backend:

- `User` — stores account data, role, preferences, search history, and profile info.
- `ChatSession` — stores AI conversation sessions.
- `Bookmark` — stores saved items.
- `History` — stores search history and user actions.

### User State and Security

- User passwords are safely hashed.
- JWT tokens are stateless and sent in the Authorization header.
- Sensitive fields like `password` are excluded from JSON responses.
- The backend checks the token on every protected call and rejects invalid or expired tokens.

---

## 9. Frontend Auth State and UI Behavior

The frontend uses `zustand` to keep auth state.

`frontend/src/store/authStore.js` stores:

- `user`
- `token`
- `isAuthenticated`
- `loading`

The store exposes methods:

- `login(email, password)`
- `register(userData)`
- `logout()`
- `fetchMe()`
- `updateUser(userData)`

This means the UI can react to user state, keep the token in localStorage, and recover after page refresh.

---

## 10. How Everything Works Together

### Session Start

1. User opens the app.
2. Frontend loads and checks for a token in localStorage.
3. If a token exists, `fetchMe()` verifies it by calling `GET /api/auth/me`.
4. If valid, the user stays signed in. If not, the token is removed.

### User Actions

- When the user searches, the frontend calls search endpoints under `/api/*`.
- When the user asks the AI assistant, the frontend calls `/api/ai/chat`.
- When the user bookmarks or saves a session, the backend persists it in MongoDB.

### Security Boundaries

- The frontend never stores password text.
- The backend never returns password hashes.
- JWT is the single access token for protected APIs.
- Rate limiting and helmet reduce abuse risk.

### AI and Research Integration

- AI chat is separate from the research search pipeline, but both are available through the same backend.
- The AI route can enrich results for authenticated users and keep session-level history.
- The research routes aggregate real sources and only use AI for filtering, summarizing, or ranking.

---

## 11. Key Files and Responsibilities

- `backend/server.js` — app setup, security, route registration, MongoDB connection.
- `backend/routes/auth.js` — login, register, profile, current user.
- `backend/models/User.js` — user schema, bcrypt hashing, password compare.
- `backend/middleware/auth.js` — JWT validation and optional auth.
- `backend/routes/ai.js` — AI chat, summarize, analyze.
- `backend/routes/unified.js` — unified research search pipeline.
- `backend/routes/structured.js` — structured medical search request handling.
- `frontend/src/utils/api.js` — Axios setup, token injection, 401 handling.
- `frontend/src/store/authStore.js` — auth state and login/register logic.
- `frontend/src/pages/LoginPage.jsx` — login form UI.
- `frontend/src/pages/RegisterPage.jsx` — registration form UI.

---


## 13. Practical Notes

- If the AI is not working, the main issue is usually Ollama not running. The app has a clear fallback message for that scenario.
- The backend expects environment variables like `MONGODB_URI`, `JWT_SECRET`, and `JWT_EXPIRE`.
- The API is buildable and testable independently from the frontend because the backend exposes clean JSON endpoints.

---

## 14. Final Summary

CuraLink is built around one clean idea: make medical research accessible and conversational.

The architecture is:

- Frontend: React + Vite + Zustand
- Backend: Express + MongoDB + JWT + bcrypt
- AI: Ollama local model with cloud fallback
- Search: multi-source aggregation + AI ranking

Every request either authenticates, enriches data, or returns a user-focused response. The whole stack is designed to keep auth isolated, protect credentials, and make AI accessible from the same backend.


By Arjun M
