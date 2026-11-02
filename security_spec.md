# Security Specification - Mining Empire

## Data Invariants
1. A user profile must belong to the authenticated user (`id` matches `request.auth.uid`).
2. Users can only read and write their own data.
3. `updatedAt` must be a server timestamp.

## The Dirty Dozen Payloads (Rejection Targets)
1. Write to another user's profile.
2. Read another user's profile.
3. Create a profile without an `id`.
4. Update a profile with a fake `updatedAt` (not server timestamp).
5. Update `cash` with a negative number.
6. Inject a 2MB string into `ownedItems`.
7. Update `id` field after creation.
8. Delete another user's profile.
9. List all user profiles.
10. Update with fields not in schema.
11. Update `depthFeet` with a string.
12. Create a profile while not signed in.

## Test Runner (Logic Check)
- `get(/users/user1)` while signed in as `user2` -> `PERMISSION_DENIED`
- `update(/users/user1)` while signed in as `user1` with `incoming().updatedAt != request.time` -> `PERMISSION_DENIED`
- `create(/users/user1)` while not signed in -> `PERMISSION_DENIED`
