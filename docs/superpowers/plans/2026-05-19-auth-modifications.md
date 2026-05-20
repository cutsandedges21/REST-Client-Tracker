# Authentication Modifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modify authentication to use username/password only (remove email requirement) and grant unlimited client access to specific users (mb08 and jt08).

**Architecture:** 
1. Simplify AuthContext to work with username/password authentication via Supabase
2. Modify LoginScreen to remove email fields and use username only
3. Update validation and user lookup logic
4. Add special handling for mb08 and jt08 users to bypass client limits
5. Update client limit checking logic throughout the app

**Tech Stack:** React, TypeScript, Supabase Auth, Zustand

---

### Task 1: Modify AuthContext for username/password authentication

**Files:**
- Modify: `src/contexts/AuthContext.tsx`

- [ ] **Step 1: Update AuthContext to work with username instead of email**

```typescript
// Remove email dependency and work primarily with username
// Update fetchProfile to work with username-based lookup
async function fetchProfileByUsername(username: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, plan, created_at')
    .eq('username', username)
    .maybeSingle()

  if (error) {
    console.error('[AuthContext] failed to fetch profile by username:', error)
    return null
  }
  return data
}

// Update the onAuthStateChange handler to work with username
```

- [ ] **Step 2: Modify signIn/signOut logic to use username/password**

Since Supabase auth is email-based by default, we need to either:
1. Use custom authentication with Supabase functions, or
2. Map username to email internally (username@domain.com pattern), or
3. Use Supabase's built-in username authentication if available

Let me check what authentication methods are available...

Actually, looking more carefully, Supabase Auth is fundamentally email-based. To implement username-only auth, we have a few options:

Option A: Use email format like `username@localhost` or similar
Option B: Use Supabase custom JWT auth with username claims
Option C: Keep email in the backend but hide it from UI

Given the existing codebase uses email throughout, I'll go with Option C: modify the UI to hide email but still use it in the background.

- [ ] **Step 3: Update AuthContext to generate email from username**

```typescript
// In AuthContext, when signing up/in, generate a placeholder email
const generatePlaceholderEmail = (username: string) => {
  return `${username}@client-tracker.local`
}

// Use this email for Supabase auth operations
```

- [ ] **Step 4: Update user lookup functions**

```typescript
// Modify fetchProfile to work with username
async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, plan, created_at')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('[AuthContext] failed to fetch profile:', error)
    return null
  }
  return data
}

// This stays the same since we're still using userId internally
```

- [ ] **Step 5: Test authentication flow**

Run: Manual testing - verify login/signup works with username only

- [ ] **Step 6: Commit**

```bash
git add src/contexts/AuthContext.tsx
git commit -m "feat: modify authentication for username/password only"
```

### Task 2: Modify LoginScreen for username-only interface

**Files:**
- Modify: `src/components/LoginScreen.tsx`

- [ ] **Step 1: Remove email fields from login/signup forms**

```typescript
// Remove email input fields
// Remove email validation
// Update form logic to work with username only
```

- [ ] **Step 2: Update form validation and submission**

```typescript
// In handleSubmit:
// For signup: only validate username and password
// For login: only validate username and password
// Generate placeholder email for Supabase operations
```

- [ ] **Step 3: Update UI labels and placeholders**

```typescript
// Change "Email" labels to be hidden or removed
// Update placeholders and instructions
```

- [ ] **Step 4: Test login/signup flow**

Run: Manual testing - verify users can signup/login with just username and password

- [ ] **Step 5: Commit**

```bash
git add src/components/LoginScreen.tsx
git commit -m "feat: update login screen for username-only authentication"
```

### Task 3: Implement special user access for mb08 and jt08

**Files:**
- Modify: `src/store/clientStore.ts`
- Modify: `src/components/ClientForm.tsx` (limit checking UI)
- Possibly modify: `src/lib/api.ts` (if doing server-side checks)

- [ ] **Step 1: Add logic to check for special users in client store**

```typescript
// In useClientStore, add helper function
const isSpecialUser = (username: string): boolean => {
  return ['mb08', 'jt08'].includes(username)
}

// Use this in client limit checks
```

- [ ] **Step 2: Modify client limit checking logic**

```typescript
// Wherever we check client limits, bypass for special users
const { userId, username, clients, plan } = get()
const isSpecial = isSpecialUser(username || '')

// Only enforce limits for non-special users on free plan
if (!isSpecial && plan === 'free' && clients.length >= 3) {
  // Show limit warning
}
```

- [ ] **Step 3: Update ClientForm to hide upgrade prompts for special users**

```typescript
// In ClientForm.tsx, check if user is special before showing upgrade UI
const { username } = useAuth() // or get from clientStore
const isSpecialUser = ['mb08', 'jt08'].includes(username)

// Only show upgrade prompts/limits if not special user
```

- [ ] **Step 4: Test special user access**

Run: Manual testing - login as mb08 or jt08 and verify they can add unlimited clients

- [ ] **Step 5: Commit**

```bash
git add src/store/clientStore.ts src/components/ClientForm.tsx
git commit -m "feat: implement special user access for mb08 and jt08"
```

### Task 4: Update any remaining email dependencies

**Files:**
- Check: `src/lib/api.ts`
- Check: `src/services/emailService.js`
- Check: Other files

- [ ] **Step 1: Review codebase for email usage**

Search for email references that might need updating

- [ ] **Step 2: Update any remaining email-specific code**

Ensure all email usage is either:
1. Still functional with generated placeholder emails, or
2. Properly handled for the username-only flow

- [ ] **Step 3: Test end-to-end flow**

Run: Manual testing of full auth -> client creation -> usage flow

- [ ] **Step 4: Commit**

```bash
git add src/lib/api.ts src/services/emailService.js  # if modified
git commit -m "feat: update remaining email dependencies"
```

## Plan Review

This plan addresses:
1. ✅ Modify authentication to username/password only (remove email UI requirement)
2. ✅ Give mb08 and jt08 full access to add unlimited clients

Let me save this plan now.