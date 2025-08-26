import React from 'react';
import { NavLink } from 'react-router-dom';
import { ReactComponent as SofaIcon } from '../assets/icons/sofa.svg';
import { ReactComponent as PassportIcon } from '../assets/icons/passport.svg';
import { ReactComponent as SmilingHouseIcon } from '../assets/icons/smiling-house.svg';
import { playNotificationSound } from '../notifications/notifications';
import { useTheme } from '../theme';

const Footer = ({ unreadMessageCount, hasNewMatch }) => {
    console.log('🔔 Footer render - unreadMessageCount:', unreadMessageCount, 'hasNewMatch:', hasNewMatch);
    const theme = useTheme();

    const testNotification = () => {
        console.log('🧪 Testing notification system...');
        playNotificationSound();
        console.log('Current state - unreadMessageCount:', unreadMessageCount, 'hasNewMatch:', hasNewMatch);
    };

    const navItems = [
        {
            name: 'match',
            to: '/matches',
            icon: SmilingHouseIcon,
            showNotification: hasNewMatch,
            ariaLabel: 'matches'
        },
        {
            name: 'chats',
            to: '/chats',
            icon: SofaIcon,
            showNotification: unreadMessageCount > 0,
            notificationCount: unreadMessageCount,
            ariaLabel: 'chats'
        },
        {
            name: 'profile',
            to: '/profile',
            icon: PassportIcon,
            showNotification: false,
            ariaLabel: 'profile'
        },
    ];

    return (
        <footer
            className="flex justify-around p-2 border-t"
            style={{ backgroundColor: theme.colors.surface }}
        >
            {navItems.map(item => (
                <NavLink key={item.name} to={item.to} className="relative p-2 rounded-full">
                    {({ isActive }) => (
                        <>
                            <item.icon
                                aria-label={item.ariaLabel}
                                role="img"
                                className="w-7 h-7"
                                style={{ color: isActive ? theme.colors.primary : theme.colors.textSecondary }}
                            />
                            {/* New Match Indicator */}
                            {item.showNotification && item.name === 'match' && (
                                <span
                                    className="absolute -top-1 -right-1 block h-3 w-3 rounded-full notification-pulse notification-bubble"
                                    style={{
                                        backgroundColor: theme.colors.secondary,
                                        boxShadow: `0 0 0 2px ${theme.colors.surface}`,
                                    }}
                                ></span>
                            )}
                            {/* Unread Message Indicator */}
                            {item.showNotification && item.name === 'chats' && (
                                <span
                                    className="absolute -top-1 -right-1 block h-5 w-5 rounded-full text-xs font-bold flex items-center justify-center notification-bounce notification-bubble"
                                    style={{
                                        backgroundColor: theme.colors.accent,
                                        color: theme.colors.surface,
                                        boxShadow: `0 0 0 2px ${theme.colors.surface}`,
                                    }}
                                >
                                    {item.notificationCount > 99 ? '99+' : item.notificationCount}
                                </span>
                            )}
                        </>
                    )}
                </NavLink>
            ))}
            {/* Debug button */}
            <button
                onClick={testNotification}
                className="p-2 rounded-full text-xs"
                style={{ backgroundColor: theme.colors.background }}
                title="Test notifications"
            >
                🧪
            </button>
        </footer>
    );
};

export default Footer;
