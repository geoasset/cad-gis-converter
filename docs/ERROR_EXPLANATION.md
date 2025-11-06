# Build Error Explanation

## Issue
TypeScript compilation error preventing the frontend from running properly.

## Root Cause
**Missing Function Definition**: `pollJobStatus` is called on line 46 of `src/App.tsx` but is never defined.

```typescript
// Line 46 - calling undefined function
pollJobStatus(jobId);
```

## Related Issues
- `useRef` and `useEffect` are imported but unused (suggests incomplete implementation)
- `fetchConversionResult` is defined but never called (likely meant to be used in polling)

## Solution
You need to implement the `pollJobStatus` function that:
1. Periodically checks the job status via API calls
2. Uses `fetchConversionResult` to get the conversion results
3. Updates the UI state when the job completes
4. Handles errors appropriately

The function should likely use `useEffect` and possibly `useRef` for managing the polling interval, which explains why those hooks were imported.
