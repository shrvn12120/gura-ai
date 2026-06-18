# 🌴 Guraidhoo AI

A modern AI-powered island concierge platform that helps visitors and locals discover everything about Guraidhoo Island through natural conversation.

It acts as a smart assistant for finding places, services, activities, and local information instantly using AI-powered intent understanding.

---

## 🚀 Overview

Guraidhoo AI replaces traditional category-based browsing with a **chat-first discovery experience**.

Instead of clicking through menus, users can simply ask:

- “Show me guesthouses near the beach”
- “What can I do today in Guraidhoo?”
- “Find restaurants open now”

The system interprets intent and returns relevant results instantly.

---

## 🎯 Key Features

### 🧠 AI Concierge
- Natural language understanding (intent extraction)
- Smart filtering of listings (restaurants, guesthouses, shops, places)
- Context-aware responses

### 🏝️ Island Directory
- Guesthouses
- Restaurants & cafes
- Local shops
- Activities & excursions
- Transport info

### 💬 Chat-Based Interface
- Chat-first UX for discovery
- Suggested prompts for users
- Optional voice input support

### 🧭 Smart Search Engine
- Category-based + semantic search
- MongoDB-powered listings database
- Future-ready for vector search integration

### 👨‍💼 Admin Panel
- Add / edit / delete listings
- Upload images and metadata
- Manage categories and tags

---

## 🧱 Tech Stack

**Frontend**
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- ShadCN UI

**Backend**
- Next.js API routes
- MongoDB (Mongoose)
- Zod validation

**Auth**
- Clerk Authentication

**AI Layer**
- OpenAI API (intent extraction + response generation)

---

## 🧠 AI Intent System

The system converts natural language into structured intent using an `extractIntent` layer.

### Example

**Input:**

"show me cheap guesthouses near beach"

**Output:**
```json
{
  "category": "guest-houses",
  "filters": {
    "price": "budget",
    "location": "near beach"
  },
  "intent": "search"
}