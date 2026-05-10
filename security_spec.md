# Firestore Security Specification: Social Media Features

## 1. Data Invariants
- **Groups**: A group requires a valid `name` and `creatorId`. Membership is immutable regarding creator status.
- **Posts**: A post requires a valid `groupId` and `authorId`. AuthorId must match `request.auth.uid`. A post can only be edited by the author. Like/Comment subcollections are relational to the post.

## 2. The "Dirty Dozen" Payloads (Examples for Testing)
1.  **Group Create (No Name)**: `{"creatorId": "uid1"}` -> SHOULD FAIL
2.  **Post Create (Invalid Group)**: `{"groupId": "nonexistent", "mediaUrl": "..."}` -> SHOULD FAIL
3.  **Post Edit (Different Author)**: `{"authorId": "uid1"}` (Logged in as `uid2`) -> SHOULD FAIL
4.  **Group Update (Change Creator)**: `{"creatorId": "uid2"}` -> SHOULD FAIL
5.  **Group Join (No Authentication)**: (Anonymous user joining) -> SHOULD FAIL
6.  **Post Like (Invalid Post)**: `{"postId": "nonexistent"}` -> SHOULD FAIL

## 3. Test Runner Structure (firestore.rules.test.ts placeholder)
- Suite 1: Group Creation (Auth required, Name required)
- Suite 2: Post Creation (Auth required, Group existence required)
- Suite 3: Post Interactions (Only group members can read/like/comment)
