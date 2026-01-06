# Testing Checklist for Journal PWA

Use this checklist to verify all functionality works correctly after deployment.

## Pre-Deployment Testing (Local)

### Basic Functionality
- [ ] App loads without errors
- [ ] Welcome screen displays correctly
- [ ] Streak counter shows 0 initially
- [ ] "Today's Prompt" button works
- [ ] Prompt screen displays with loading state
- [ ] Prompt text appears after loading
- [ ] Date displays correctly
- [ ] Back button returns to welcome screen
- [ ] Milestones screen displays all 6 milestones
- [ ] Milestone progress bars show 0% initially

### Photo Upload
- [ ] Photo upload button triggers file picker
- [ ] Camera opens on mobile devices
- [ ] Photo preview displays after selection
- [ ] Duplicate photo detection works (try uploading same photo twice)
- [ ] Complete Entry button enables after photo upload
- [ ] Photo preview shows correct image

### Entry Completion
- [ ] Complete Entry button works
- [ ] Success modal appears
- [ ] Streak increments correctly
- [ ] Entry date is saved
- [ ] Cannot complete entry twice in same day
- [ ] Photo is cleared after completion
- [ ] Form resets after completion

### Milestones
- [ ] Milestones show correct progress
- [ ] Progress bars update correctly
- [ ] Milestone achievement triggers (test by manually setting streak in localStorage)
- [ ] Achievement message displays correctly
- [ ] Milestone cards show checkmark when achieved

### Offline Functionality
- [ ] App works offline (after first load)
- [ ] Service worker registers correctly
- [ ] Prompts work offline
- [ ] Streak tracking works offline
- [ ] Photos can be taken offline (stored locally)

## Post-Deployment Testing (Production)

### API Integration
- [ ] AI feedback checkbox appears after photo upload
- [ ] AI feedback checkbox can be toggled
- [ ] AI feedback processes successfully
- [ ] Reflection text appears in feedback section
- [ ] Loading state shows "Processing your entry..."
- [ ] Error handling works (test with invalid image)
- [ ] Rate limiting works (make 11 requests quickly)
- [ ] Timeout handling works (test with very large image)

### Error Scenarios
- [ ] Invalid image format shows error message
- [ ] Image too large shows error message
- [ ] API timeout shows helpful error
- [ ] Rate limit shows helpful error
- [ ] Network error shows helpful error
- [ ] Error messages are user-friendly (not technical)

### Security
- [ ] API key never appears in browser console
- [ ] API key never appears in network requests
- [ ] API key never appears in localStorage
- [ ] CORS headers are correct
- [ ] No sensitive data in error logs

### Mobile Testing (iOS Safari - Priority)
- [ ] App installs to home screen
- [ ] App icon displays correctly
- [ ] App opens in standalone mode (no browser UI)
- [ ] Camera access works
- [ ] Photo upload works
- [ ] AI feedback works
- [ ] Touch interactions work smoothly
- [ ] No horizontal scrolling
- [ ] Keyboard doesn't cover inputs
- [ ] Status bar styling is correct

### Mobile Testing (Android Chrome)
- [ ] App installs to home screen
- [ ] App icon displays correctly
- [ ] Camera access works
- [ ] Photo upload works
- [ ] AI feedback works
- [ ] Touch interactions work smoothly

### Performance
- [ ] App loads quickly (< 2 seconds)
- [ ] Prompts load quickly
- [ ] Photo upload is responsive
- [ ] AI feedback completes in reasonable time (< 30 seconds)
- [ ] No memory leaks (test by completing multiple entries)
- [ ] Smooth animations

### PWA Features
- [ ] Manifest.json is accessible
- [ ] Service worker registers
- [ ] App works offline
- [ ] App updates when new version is deployed
- [ ] Install prompt appears (if supported)
- [ ] App icon is correct
- [ ] Theme color is correct

## Production Verification

### Environment Variables
- [ ] `OPEN_AI_API` is set in Vercel dashboard
- [ ] Environment variable is available to all environments
- [ ] API key is not in Git repository
- [ ] `.env` file is in `.gitignore`

### Deployment
- [ ] Code is pushed to GitHub: https://github.com/ParkerCase/journal-for-lex.git
- [ ] Vercel is connected to GitHub repo
- [ ] Auto-deployment works (push to main triggers deploy)
- [ ] Deployment URL is accessible
- [ ] HTTPS is enabled (required for PWA)

### Function Logs
- [ ] Check Vercel function logs for errors
- [ ] Verify API calls are successful
- [ ] Check for any timeout errors
- [ ] Monitor rate limiting

### Cost Monitoring
- [ ] Check OpenAI usage dashboard
- [ ] Verify costs are within expected range ($1-2/month)
- [ ] Set up billing alerts if needed

## Edge Cases to Test

### Photo Quality
- [ ] Very small image (< 100KB)
- [ ] Very large image (close to 10MB limit)
- [ ] Blurry image
- [ ] Dark image
- [ ] Image with text
- [ ] Image without text
- [ ] Handwritten text
- [ ] Printed text
- [ ] Mixed handwriting and print

### Network Conditions
- [ ] Slow network (throttle to 3G)
- [ ] Intermittent connection
- [ ] Complete network failure during AI processing
- [ ] Network timeout

### Browser Compatibility
- [ ] iOS Safari (primary)
- [ ] Android Chrome
- [ ] Desktop Chrome
- [ ] Desktop Safari
- [ ] Desktop Firefox

### Data Persistence
- [ ] Streak persists after browser close
- [ ] Milestones persist after browser close
- [ ] Used prompts persist after browser close
- [ ] Photo hashes persist (duplicate detection)
- [ ] Data survives browser update

## Regression Testing

After any changes, verify:
- [ ] All core features still work
- [ ] No new errors in console
- [ ] Performance hasn't degraded
- [ ] Mobile experience is still good
- [ ] AI feedback still works

## Sign-Off Checklist

Before considering deployment complete:

- [ ] All critical tests pass
- [ ] Mobile testing (iOS) is successful
- [ ] AI feedback works end-to-end
- [ ] No security issues
- [ ] Cost monitoring is set up
- [ ] Documentation is complete
- [ ] Error handling is user-friendly
- [ ] App is ready for Alexa to use!

---

**Testing Priority:**
1. **Critical**: Photo upload → AI feedback flow
2. **Critical**: Mobile iOS Safari experience
3. **High**: Offline functionality
4. **High**: Streak tracking
5. **Medium**: Milestone achievements
6. **Medium**: Error handling

