# Upload Feature

## Purpose
Handle file uploads for the admin panel. Currently supports product image uploads (thumbnail + gallery). Files are stored on local disk and served as static assets.

## Owned Entities
None — this feature has no database entities. It manages files on disk only.

## Dependencies
None — standalone utility feature. Other features reference the returned URLs in their own entities.

## Design Decisions
- Separate upload endpoint (`POST /upload/image`) keeps existing product CRUD endpoints JSON-based
- Files named with UUID to prevent collisions and directory traversal
- Extension derived from MIME type, not original filename
- Only JPEG, PNG, WebP allowed (SVG rejected for XSS, GIF rejected for size/animation)
- 5MB max file size
