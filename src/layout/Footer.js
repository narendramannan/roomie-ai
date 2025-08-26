import React from 'react';
import { NavLink } from 'react-router-dom';
import { ReactComponent as SofaIcon } from '../assets/icons/sofa.svg';
import { ReactComponent as PassportIcon } from '../assets/icons/passport.svg';
import { ReactComponent as SmilingHouseIcon } from '../assets/icons/smiling-house.svg';
import { playNotificationSound } from '../notifications/notifications';

const Footer = ({ unreadMessageCount, hasNewMatch }) => {
    console.log('🔔 Footer render - unreadMessageCount:', unreadMessageCount, 'hasNewMatch:', hasNewMatch);

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
        <footer className="flex justify-around p-2 border-t bg-white">
            {navItems.map(item => (
                <NavLink key={item.name} to={item.to} className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
                    {({ isActive }) => (
                        <>
                            <item.icon
                                aria-label={item.ariaLabel}
                                role="img"
                                className={`w-7 h-7 ${isActive ? 'text-rose-500' : 'text-gray-400'}`}
                            />
                            {/* New Match Indicator */}
                            {item.showNotification && item.name === 'match' && (
                                <span className="absolute -top-1 -right-1 block h-3 w-3 rounded-full ring-2 ring-white bg-yellow-500 notification-pulse notification-bubble"></span>
                            )}
                            {/* Unread Message Indicator */}
                            {item.showNotification && item.name === 'chats' && (
                                <span className="absolute -top-1 -right-1 block h-5 w-5 rounded-full ring-2 ring-white bg-red-500 text-white text-xs font-bold flex items-center justify-center notification-bounce notification-bubble">
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
                className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors text-xs"
                title="Test notifications"
            >
                🧪
            </button>
        </footer>
    );
};

export default Footer;
