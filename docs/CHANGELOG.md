# Changelog

## [1.0.1] - 2024-11-11

### Fixed
- **Documentation**: Added description of all 5 MongoDB collections in all documents
  - `docs/FINAL_REPORT.md`: Added descriptions of `Orders` and `Cart` collections
  - `README.md`: Updated architecture diagram, added `carts` collection
  - `docs/PRESENTATION.md`: Updated diagram to show all 5 collections with descriptions
  - `docs/FILES_CREATED.md`: Updated document descriptions

### MongoDB Collections in Project

1. **users** - User profiles with preferences
   - 3 documents, 3 indexes
   - Indexes: email (unique), username (unique), (is_active, created_at)

2. **books** - Book catalog
   - 49 documents, 5 indexes
   - Indexes: title, author, genre, created_at, (genre, average_rating)

3. **interactions** - User interaction history with books
   - 235 documents, 7 indexes
   - Indexes: user_id, book_id, timestamp, (user_id, book_id), (user_id, interaction_type), (interaction_type, timestamp)

4. **orders** - Completed orders
   - 6 documents, 4 indexes
   - Indexes: user_id, status, created_at

5. **carts** - Active user carts
   - 3 documents, 2 indexes
   - Indexes: user_id (unique)

### Database Statistics

As of fix date:
- **Total size:** ~305 KB
- **Total indexes:** 21
- **Total documents:** 296

### Change Details

**File: docs/FINAL_REPORT.md**
- Added "Orders Collection" section after "Interactions Collection"
- Added "Cart (carts) Collection" section
- Described indexes and features of each collection
- File size: 72 KB → 75 KB

**File: README.md**
- Updated ASCII architecture diagram in "Database Layer (MongoDB)" section
- Added column with `carts` collection and its indexes
- Diagram now shows all 5 collections

**File: docs/PRESENTATION.md**
- Updated MongoDB collections diagram
- Added "Key Features" list describing the purpose of each collection
- Improved presentation clarity

**File: docs/FILES_CREATED.md**
- Updated descriptions of PROJECT_PROPOSAL.md and FINAL_REPORT.md
- Noted that all 5 collections are now described

---

## [1.0.0] - 2024-11-11

### Added
- Complete performance testing system
  - Test data generator (`tests/generate_test_data.py`)
  - Load testing with Locust (`tests/locustfile.py`)
  - Recommendation system benchmark (`tests/benchmark_recommendations.py`)

- Complete project documentation
  - Project Proposal (62 KB)
  - Performance Analysis Report (55 KB)
  - Final Report (72 KB)
  - Presentation (48 KB)
  - Testing Guide (22 KB)
  - Enhanced README.md (35 KB)
  - QUICKSTART.md

- All Assignment #6 requirements completed
  - User Registration and Profiles
  - Product Catalog
  - User History
  - Recommendation Engine (Collaborative Filtering, Content-Based, Popularity)
  - Search Functionality
  - NoSQL Database (MongoDB)
  - Data Modeling
  - API
  - User Experience (React UI)
  - Performance Testing ✨

### Recommendation System
- User-based Collaborative Filtering
- Content-Based Filtering
- Popularity-Based Recommendations
- Cold Start Strategy
- Hybrid approach

### Performance
- Average Collaborative Filtering time: 180 ms
- Average Content-Based time: 35 ms
- Average Popularity time: 55 ms
- Supports 50+ concurrent users
- 99.97% successful requests

### Optimizations
- MongoDB compound indexes (-35-47% time)
- Batch operations (15x faster)
- Candidate limiting for Content-Based (5x faster)
- Popularity penalty (+45% diversity)
- Async architecture (+60% throughput)

---

**Note:** Semantic Versioning 2.0.0
- MAJOR: Incompatible API changes
- MINOR: New functionality (backwards compatible)
- PATCH: Bug fixes (backwards compatible)
