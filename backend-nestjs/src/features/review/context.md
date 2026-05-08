# Review Feature

## Purpose
Product reviews with purchase verification (3-way link: user × product × order).

## Owned Entities
- `reviews` — rating + comment, FK to users, products, orders

## Dependencies
- AuthModule — user identity
- OrderModule — verify order ownership and delivered status
- ProductModule — verify product exists in order
