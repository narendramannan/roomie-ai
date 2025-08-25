# Notification System Testing Guide

This guide helps you test the comprehensive notification system implemented in RoomieAI.

## Prerequisites

1. **Firebase Setup**: Ensure your Firebase project is properly configured
2. **Two User Accounts**: You'll need at least two user accounts to test messaging
3. **Browser Console**: Open developer tools to see console logs
4. **Audio Enabled**: Ensure browser audio is not muted

## Test Scenarios

### 1. New Match Notification Test

#### Steps:
1. **Login with User A**
2. **Like a profile** that User B has already liked
3. **Verify Results**:
   - Match modal appears ✅
   - Yellow pulsing dot appears on Heart icon ✅
   - Console shows: "💛 New match made! Setting notification flag" ✅
   - Console shows: "🔊 Notification sound played successfully" ✅

#### Expected Behavior:
- Yellow dot should pulse continuously
- Dot should disappear when navigating to Chats tab
- Session storage should contain 'newMatch: true'

### 2. Unread Message Notification Test

#### Steps:
1. **Login with User A**
2. **Send a message to User B** (in an existing chat)
3. **Switch to User B account**
4. **Verify Results**:
   - Red notification bubble appears on Chat icon ✅
   - Bubble shows count "1" ✅
   - Console shows: "✅ Message sent and unread count incremented for: [UserB]" ✅

#### Expected Behavior:
- Red bubble should bounce and show correct count
- Count should update in real-time
- Sound should play when count increases

### 3. Per-Chat Unread Count Test

#### Steps:
1. **Login with User B**
2. **Navigate to Chats tab**
3. **Verify Results**:
   - Individual chat shows red badge with count ✅
   - Badge displays correct unread count ✅
   - Console shows: "📱 Unread message count updated: [count]" ✅

#### Expected Behavior:
- Each chat with unread messages shows individual badge
- Badges update in real-time
- Counts are accurate per conversation

### 4. Unread Count Reset Test

#### Steps:
1. **Login with User B**
2. **Click on a chat with unread messages**
3. **Verify Results**:
   - Chat opens normally ✅
   - Unread count resets to 0 ✅
   - Console shows: "✅ Unread count reset to 0 for user: [UserB]" ✅
   - Global count decreases accordingly ✅

#### Expected Behavior:
- Count should immediately reset to 0
- Global notification bubble should update
- No sound should play (count decreased)

### 5. Real-Time Updates Test

#### Steps:
1. **Open two browser windows/tabs**
2. **Login with User A in one, User B in another**
3. **Send message from User A to User B**
4. **Verify Results**:
   - User B's notification updates immediately ✅
   - No page refresh required ✅
   - Console shows real-time updates ✅

#### Expected Behavior:
- Updates should be instant
- No manual refresh needed
- All listeners working properly

## Console Log Verification

### Expected Logs During Testing:

```
💛 New match made! Setting notification flag
🔊 Notification sound played successfully
✅ Message sent and unread count incremented for: [userId]
📱 Unread message count updated: [count]
✅ Unread count reset to 0 for user: [userId]
💛 New match notification detected in session storage
```

### Error Logs to Watch For:

```
⚠️ Negative unread count detected: [count] for chat: [chatId]
Error processing chat document: [error]
Error in unread message listener: [error]
Could not play notification sound: [error]
```

## Visual Verification

### Notification Bubbles:
- **New Match**: Yellow, pulsing, small (3x3)
- **Unread Messages**: Red, bouncing, larger (5x5) with count
- **Positioning**: Top-right corner of respective icons
- **Animations**: Smooth, not jarring

### CSS Classes Applied:
- `.notification-pulse` for match indicators
- `.notification-bounce` for message indicators
- `.notification-bubble` for enhanced styling

## Troubleshooting

### Common Issues:

1. **No Sound Playing**:
   - Check browser audio permissions
   - Verify console for audio context errors
   - Ensure audio not muted

2. **Counts Not Updating**:
   - Check Firestore security rules
   - Verify user authentication
   - Check console for listener errors

3. **Visual Glitches**:
   - Ensure CSS is properly loaded
   - Check for conflicting styles
   - Verify Tailwind classes

4. **Performance Issues**:
   - Check for memory leaks in listeners
   - Verify proper cleanup functions
   - Monitor console for repeated operations

### Debug Commands:

```javascript
// Check session storage
console.log('Session storage:', sessionStorage.getItem('newMatch'));

// Check current notification state
console.log('Unread count:', unreadMessageCount);
console.log('Has new match:', hasNewMatch);

// Test notification sound manually
playNotificationSound();
```

## Performance Metrics

### Expected Performance:
- **Real-time Updates**: < 100ms latency
- **Sound Playback**: < 50ms delay
- **Visual Updates**: < 16ms (60fps)
- **Memory Usage**: Stable, no leaks

### Monitoring:
- Watch console for repeated operations
- Monitor memory usage in dev tools
- Check for excessive Firestore reads
- Verify listener cleanup

## Success Criteria

### All Tests Pass When:
1. ✅ New matches show yellow pulsing dot
2. ✅ Unread messages show red bouncing bubble
3. ✅ Per-chat counts display correctly
4. ✅ Counts reset when chats are opened
5. ✅ Real-time updates work instantly
6. ✅ Notification sounds play properly
7. ✅ No console errors or warnings
8. ✅ Smooth animations and transitions
9. ✅ Proper cleanup and memory management
10. ✅ Cross-browser compatibility

## Next Steps

After successful testing:
1. **User Feedback**: Gather user experience feedback
2. **Performance Monitoring**: Monitor production performance
3. **Feature Enhancements**: Plan future improvements
4. **Documentation**: Update user documentation
5. **Training**: Train support team on troubleshooting
