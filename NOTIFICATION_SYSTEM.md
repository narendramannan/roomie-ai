# RoomieAI Notification System

This document describes the comprehensive notification system implemented in the RoomieAI React application.

## Overview

The notification system provides real-time visual indicators for:
- **New Matches**: Yellow pulsing dot on the Heart icon
- **Unread Messages**: Red notification bubble with count on the Chat icon
- **Per-Chat Unread Counts**: Individual unread indicators in the ChatsScreen

## Features

### 1. Unread Message Notification System

#### Firestore Schema Update
The chat documents now include an `unreadCounts` map to track unread messages for each participant:

```json
{
  "users": ["userId1", "userId2"],
  "lastMessageTimestamp": "...",
  "unreadCounts": {
    "userId1": 0,
    "userId2": 5
  }
}
```

#### Real-Time Logic
- **Incrementing**: When a message is sent, the recipient's unread count is atomically incremented
- **Resetting**: When a chat is opened, the current user's unread count is reset to 0
- **Global Count**: Real-time listener calculates total unread messages across all chats

#### UI Implementation
- **Global Notification Bubble**: Red bubble on Chat icon in footer showing total unread count
- **Per-Chat Indicators**: Red badges next to each chat showing individual unread counts
- **Real-Time Updates**: All counts update automatically using Firestore onSnapshot listeners

### 2. New Match Notification System

#### Implementation
- **Session Storage**: Uses `sessionStorage` to track new matches during the current session
- **Visual Indicator**: Yellow pulsing dot on Heart icon in footer
- **Auto-Clear**: Indicator disappears when user navigates to Chats tab

#### User Experience
- **Immediate Feedback**: Modal appears when match is made
- **Persistent Reminder**: Subtle indicator reminds users to check new connections
- **Non-Intrusive**: Simple dot that doesn't interfere with normal app usage

### 3. Audio Notifications

#### Sound Effects
- **New Match**: Plays when match modal appears
- **New Messages**: Plays when unread count increases (only on increase, not decrease)
- **Web Audio API**: Uses browser's built-in audio capabilities for cross-platform compatibility

#### Technical Details
- **Audio Context Management**: Properly handles suspended audio contexts
- **Error Handling**: Gracefully degrades when audio is not supported
- **Resource Cleanup**: Automatically closes audio contexts to prevent memory leaks

## Technical Implementation

### Key Components

1. **App.js Main Component**
   - Real-time unread message listener
   - Session storage management for new matches
   - Notification state management

2. **Footer Component**
   - Notification bubble rendering
   - Visual indicators for both notification types
   - Proper positioning and styling

3. **ChatWindow Component**
   - Unread count incrementing logic
   - Automatic count reset when chat is opened
   - Firestore transaction handling

4. **ChatsScreen Component**
   - Real-time unread count display
   - Individual chat notification badges
   - Efficient listener management

### Firestore Operations

#### Message Sending
```javascript
// Increment unread count for recipient
await updateDoc(chatDocRef, {
  [`unreadCounts.${recipientId}`]: increment(1)
});
```

#### Unread Count Reset
```javascript
// Reset unread count when chat is opened
await updateDoc(chatDocRef, {
  [`unreadCounts.${currentUserId}`]: 0
});
```

#### Real-Time Listeners
```javascript
// Listen for chat document changes
const unsubscribe = onSnapshot(chatDoc, (doc) => {
  // Update unread counts in real-time
});
```

## CSS Animations

### Custom Keyframes
- **notification-pulse**: Gentle pulsing effect for new matches
- **notification-bounce**: Bouncy animation for unread messages
- **notification-bubble**: Hover effects and smooth transitions

### Classes
- `.notification-pulse`: Applied to new match indicators
- `.notification-bounce`: Applied to unread message indicators
- `.notification-bubble`: Enhanced styling with shadows and hover effects

## User Experience Features

### Visual Design
- **Color Coding**: Red for messages, yellow for matches
- **Size Variations**: Different sizes for different notification types
- **Positioning**: Strategic placement that doesn't interfere with navigation

### Animation Strategy
- **Subtle Movements**: Gentle animations that draw attention without being distracting
- **Performance Optimized**: CSS-based animations for smooth performance
- **Accessibility**: Respects user's motion preferences

### Responsive Behavior
- **Mobile First**: Designed for mobile devices with touch interfaces
- **Touch Friendly**: Proper sizing for mobile interaction
- **Cross-Platform**: Works consistently across different devices and browsers

## Future Enhancements

### Potential Improvements
1. **Push Notifications**: Browser push notifications for offline users
2. **Custom Sounds**: User-selectable notification sounds
3. **Vibration**: Haptic feedback for mobile devices
4. **Notification Center**: Centralized notification management
5. **Preferences**: User-configurable notification settings

### Scalability Considerations
- **Efficient Listeners**: Minimal Firestore reads and writes
- **Memory Management**: Proper cleanup of event listeners
- **Performance**: Optimized for real-time updates
- **Error Handling**: Graceful degradation when services are unavailable

## Testing

### Manual Testing
1. **New Match Flow**: Like a profile, verify yellow dot appears
2. **Message Flow**: Send message, verify red bubble appears
3. **Count Reset**: Open chat, verify count resets to 0
4. **Real-Time Updates**: Send message from another device, verify immediate update

### Automated Testing
- Unit tests for notification logic
- Integration tests for Firestore operations
- E2E tests for complete user flows

## Troubleshooting

### Common Issues
1. **Audio Not Working**: Check browser audio permissions
2. **Counts Not Updating**: Verify Firestore security rules
3. **Performance Issues**: Check for memory leaks in listeners
4. **Visual Glitches**: Ensure CSS animations are properly loaded

### Debug Mode
Enable console logging for notification events:
```javascript
console.log('Unread count updated:', totalUnread);
console.log('New match detected:', hasNewMatch);
```

## Conclusion

The notification system significantly enhances user engagement by providing immediate feedback for new activity. The real-time nature ensures users are always aware of new matches and messages, while the subtle visual design maintains a polished user experience.

The implementation is robust, scalable, and follows React best practices for state management and side effects.
