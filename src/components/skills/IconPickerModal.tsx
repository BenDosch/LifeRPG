import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { Theme, resolveIconColor } from '../../theme';

export interface IconEntry {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  category: string;
}

export const ICON_CATEGORIES = [
  'All',
  'Tech',
  'Learning',
  'Creative',
  'Fitness',
  'Health',
  'Social',
  'Business',
  'Craft',
  'Life',
  'Weather',
  'Transportation',
  'Animals',
  'Elements',
  'Equipment',
  'Magic',
  'Food',
  'Games',
  'Sports',
  'Music',
  'Security',
] as const;

export const SKILL_ICONS: IconEntry[] = [
  // Tech
  { icon: 'code-slash-outline',      label: 'Code',         category: 'Tech' },
  { icon: 'code-outline',            label: 'Code Block',   category: 'Tech' },
  { icon: 'code-working-outline',    label: 'Dev',          category: 'Tech' },
  { icon: 'terminal-outline',        label: 'Terminal',     category: 'Tech' },
  { icon: 'server-outline',          label: 'Server',       category: 'Tech' },
  { icon: 'cloud-outline',           label: 'Cloud',        category: 'Tech' },
  { icon: 'cloud-download-outline',  label: 'Download',     category: 'Tech' },
  { icon: 'cloud-upload-outline',    label: 'Upload',       category: 'Tech' },
  { icon: 'git-branch-outline',      label: 'Git',          category: 'Tech' },
  { icon: 'git-network-outline',     label: 'Network',      category: 'Tech' },
  { icon: 'git-merge-outline',       label: 'Merge',        category: 'Tech' },
  { icon: 'phone-portrait-outline',  label: 'Mobile',       category: 'Tech' },
  { icon: 'tablet-portrait-outline', label: 'Tablet',       category: 'Tech' },
  { icon: 'laptop-outline',          label: 'Laptop',       category: 'Tech' },
  { icon: 'desktop-outline',         label: 'Desktop',      category: 'Tech' },
  { icon: 'wifi-outline',            label: 'Wi-Fi',        category: 'Tech' },
  { icon: 'bluetooth-outline',       label: 'Bluetooth',    category: 'Tech' },
  { icon: 'cellular-outline',        label: 'Signal',       category: 'Tech' },
  { icon: 'hardware-chip-outline',   label: 'Chip',         category: 'Tech' },
  { icon: 'bug-outline',             label: 'Debug',        category: 'Tech' },
  { icon: 'layers-outline',          label: 'Layers',       category: 'Tech' },
  { icon: 'cube-outline',            label: '3D',           category: 'Tech' },
  { icon: 'analytics-outline',       label: 'Analytics',    category: 'Tech' },
  { icon: 'qr-code-outline',         label: 'QR Code',      category: 'Tech' },
  { icon: 'scan-outline',            label: 'Scanner',      category: 'Tech' },
  { icon: 'barcode-outline',         label: 'Barcode',      category: 'Tech' },
  { icon: 'toggle-outline',          label: 'Toggle',       category: 'Tech' },
  { icon: 'power-outline',           label: 'Power',        category: 'Tech' },
  { icon: 'watch-outline',           label: 'Smartwatch',   category: 'Tech' },
  { icon: 'keypad-outline',          label: 'Keypad',       category: 'Tech' },
  { icon: 'apps-outline',            label: 'Apps',         category: 'Tech' },
  { icon: 'browsers-outline',        label: 'Browser',      category: 'Tech' },
  { icon: 'battery-full-outline',    label: 'Battery',      category: 'Tech' },
  { icon: 'battery-charging-outline',label: 'Charging',     category: 'Tech' },
  { icon: 'sync-outline',            label: 'Sync',         category: 'Tech' },
  { icon: 'swap-horizontal-outline', label: 'Transfer',     category: 'Tech' },

  // Learning
  { icon: 'book-outline',            label: 'Book',         category: 'Learning' },
  { icon: 'bookmark-outline',        label: 'Bookmark',     category: 'Learning' },
  { icon: 'bookmarks-outline',       label: 'Collection',   category: 'Learning' },
  { icon: 'school-outline',          label: 'School',       category: 'Learning' },
  { icon: 'library-outline',         label: 'Library',      category: 'Learning' },
  { icon: 'journal-outline',         label: 'Journal',      category: 'Learning' },
  { icon: 'newspaper-outline',       label: 'News',         category: 'Learning' },
  { icon: 'document-text-outline',   label: 'Docs',         category: 'Learning' },
  { icon: 'documents-outline',       label: 'Documents',    category: 'Learning' },
  { icon: 'flask-outline',           label: 'Science',      category: 'Learning' },
  { icon: 'beaker-outline',          label: 'Lab',          category: 'Learning' },
  { icon: 'telescope-outline',       label: 'Astronomy',    category: 'Learning' },
  { icon: 'language-outline',        label: 'Language',     category: 'Learning' },
  { icon: 'calculator-outline',      label: 'Math',         category: 'Learning' },
  { icon: 'reader-outline',          label: 'Reading',      category: 'Learning' },
  { icon: 'ribbon-outline',          label: 'Certificate',  category: 'Learning' },
  { icon: 'glasses-outline',         label: 'Study',        category: 'Learning' },
  { icon: 'scale-outline',           label: 'Logic',        category: 'Learning' },

  // Creative
  { icon: 'pencil-outline',          label: 'Writing',      category: 'Creative' },
  { icon: 'brush-outline',           label: 'Painting',     category: 'Creative' },
  { icon: 'color-palette-outline',   label: 'Design',       category: 'Creative' },
  { icon: 'color-fill-outline',      label: 'Fill',         category: 'Creative' },
  { icon: 'color-filter-outline',    label: 'Filter',       category: 'Creative' },
  { icon: 'camera-outline',          label: 'Photo',        category: 'Creative' },
  { icon: 'camera-reverse-outline',  label: 'Selfie',       category: 'Creative' },
  { icon: 'film-outline',            label: 'Film',         category: 'Creative' },
  { icon: 'videocam-outline',        label: 'Video',        category: 'Creative' },
  { icon: 'image-outline',           label: 'Image',        category: 'Creative' },
  { icon: 'images-outline',          label: 'Gallery',      category: 'Creative' },
  { icon: 'crop-outline',            label: 'Crop',         category: 'Creative' },
  { icon: 'aperture-outline',        label: 'Aperture',     category: 'Creative' },
  { icon: 'musical-notes-outline',   label: 'Music',        category: 'Creative' },
  { icon: 'mic-outline',             label: 'Podcast',      category: 'Creative' },
  { icon: 'mic-circle-outline',      label: 'Mic',          category: 'Creative' },
  { icon: 'headset-outline',         label: 'Audio',        category: 'Creative' },
  { icon: 'easel-outline',           label: 'Art',          category: 'Creative' },
  { icon: 'create-outline',          label: 'Create',       category: 'Creative' },
  { icon: 'shapes-outline',          label: 'Shapes',       category: 'Creative' },
  { icon: 'text-outline',            label: 'Text',         category: 'Creative' },
  { icon: 'recording-outline',       label: 'Record',       category: 'Creative' },
  { icon: 'disc-outline',            label: 'Disc',         category: 'Creative' },
  { icon: 'prism-outline',           label: 'Prism',        category: 'Creative' },
  { icon: 'contrast-outline',        label: 'Contrast',     category: 'Creative' },
  { icon: 'tv-outline',              label: 'TV',           category: 'Creative' },

  // Fitness
  { icon: 'fitness-outline',         label: 'Workout',      category: 'Fitness' },
  { icon: 'barbell-outline',         label: 'Weights',      category: 'Fitness' },
  { icon: 'bicycle-outline',         label: 'Cycling',      category: 'Fitness' },
  { icon: 'walk-outline',            label: 'Walking',      category: 'Fitness' },
  { icon: 'body-outline',            label: 'Body',         category: 'Fitness' },
  { icon: 'boat-outline',            label: 'Rowing',       category: 'Fitness' },
  { icon: 'stopwatch-outline',       label: 'Stopwatch',    category: 'Fitness' },
  { icon: 'timer-outline',           label: 'Timer',        category: 'Fitness' },
  { icon: 'pulse-outline',           label: 'Cardio',       category: 'Fitness' },
  { icon: 'flame-outline',           label: 'Intense',      category: 'Fitness' },
  { icon: 'trophy-outline',          label: 'Trophy',       category: 'Fitness' },
  { icon: 'trail-sign-outline',      label: 'Trail',        category: 'Fitness' },
  { icon: 'repeat-outline',          label: 'Interval',     category: 'Fitness' },
  { icon: 'footsteps-outline',       label: 'Steps',        category: 'Fitness' },
  { icon: 'hand-left-outline',       label: 'Dexterity',    category: 'Fitness' },
  { icon: 'accessibility-outline',   label: 'Mobility',     category: 'Fitness' },
  { icon: 'man-outline',             label: 'Strength',     category: 'Fitness' },

  // Health
  { icon: 'heart-outline',           label: 'Health',       category: 'Health' },
  { icon: 'heart-half-outline',      label: 'Vitality',     category: 'Health' },
  { icon: 'medkit-outline',          label: 'Medical',      category: 'Health' },
  { icon: 'medical-outline',         label: 'Clinic',       category: 'Health' },
  { icon: 'leaf-outline',            label: 'Nature',       category: 'Health' },
  { icon: 'restaurant-outline',      label: 'Cooking',      category: 'Health' },
  { icon: 'nutrition-outline',       label: 'Nutrition',    category: 'Health' },
  { icon: 'bed-outline',             label: 'Sleep',        category: 'Health' },
  { icon: 'water-outline',           label: 'Hydration',    category: 'Health' },
  { icon: 'sunny-outline',           label: 'Outdoors',     category: 'Health' },
  { icon: 'moon-outline',            label: 'Rest',         category: 'Health' },
  { icon: 'happy-outline',           label: 'Wellbeing',    category: 'Health' },
  { icon: 'sad-outline',             label: 'Mood',         category: 'Health' },
  { icon: 'bandage-outline',         label: 'Recovery',     category: 'Health' },
  { icon: 'rose-outline',            label: 'Mindful',      category: 'Health' },
  { icon: 'ear-outline',             label: 'Hearing',      category: 'Health' },
  { icon: 'eye-outline',             label: 'Vision',       category: 'Health' },
  { icon: 'thermometer-outline',     label: 'Temperature',  category: 'Health' },
  { icon: 'scale-outline',           label: 'Balance',      category: 'Health' },

  // Social
  { icon: 'people-outline',          label: 'People',       category: 'Social' },
  { icon: 'people-circle-outline',   label: 'Group',        category: 'Social' },
  { icon: 'person-outline',          label: 'Profile',      category: 'Social' },
  { icon: 'person-add-outline',      label: 'Connect',      category: 'Social' },
  { icon: 'chatbubble-outline',      label: 'Chat',         category: 'Social' },
  { icon: 'chatbubbles-outline',     label: 'Messages',     category: 'Social' },
  { icon: 'globe-outline',           label: 'Global',       category: 'Social' },
  { icon: 'megaphone-outline',       label: 'Speak',        category: 'Social' },
  { icon: 'help-circle-outline',     label: 'Question',     category: 'Social' },
  { icon: 'mail-outline',            label: 'Email',        category: 'Social' },
  { icon: 'mail-open-outline',       label: 'Read',         category: 'Social' },
  { icon: 'send-outline',            label: 'Send',         category: 'Social' },
  { icon: 'paper-plane-outline',     label: 'Message',      category: 'Social' },
  { icon: 'share-social-outline',    label: 'Share',        category: 'Social' },
  { icon: 'share-outline',           label: 'Post',         category: 'Social' },
  { icon: 'heart-circle-outline',    label: 'Love',         category: 'Social' },
  { icon: 'thumbs-up-outline',       label: 'Like',         category: 'Social' },
  { icon: 'thumbs-down-outline',     label: 'Feedback',     category: 'Social' },
  { icon: 'star-outline',            label: 'Star',         category: 'Social' },
  { icon: 'gift-outline',            label: 'Giving',       category: 'Social' },
  { icon: 'at-outline',              label: 'Mention',      category: 'Social' },
  { icon: 'call-outline',            label: 'Call',         category: 'Social' },
  { icon: 'notifications-outline',   label: 'Alerts',       category: 'Social' },
  { icon: 'man-outline',             label: 'Man',          category: 'Social' },
  { icon: 'woman-outline',           label: 'Woman',        category: 'Social' },
  { icon: 'transgender-outline',     label: 'Identity',     category: 'Social' },

  // Business
  { icon: 'business-outline',        label: 'Business',     category: 'Business' },
  { icon: 'stats-chart-outline',     label: 'Stats',        category: 'Business' },
  { icon: 'bar-chart-outline',       label: 'Bar Chart',    category: 'Business' },
  { icon: 'briefcase-outline',       label: 'Work',         category: 'Business' },
  { icon: 'cash-outline',            label: 'Finance',      category: 'Business' },
  { icon: 'card-outline',            label: 'Payments',     category: 'Business' },
  { icon: 'wallet-outline',          label: 'Wallet',       category: 'Business' },
  { icon: 'receipt-outline',         label: 'Receipt',      category: 'Business' },
  { icon: 'pricetag-outline',        label: 'Pricing',      category: 'Business' },
  { icon: 'trending-up-outline',     label: 'Growth',       category: 'Business' },
  { icon: 'trending-down-outline',   label: 'Decline',      category: 'Business' },
  { icon: 'pie-chart-outline',       label: 'Chart',        category: 'Business' },
  { icon: 'clipboard-outline',       label: 'Tasks',        category: 'Business' },
  { icon: 'calendar-outline',        label: 'Schedule',     category: 'Business' },
  { icon: 'today-outline',           label: 'Today',        category: 'Business' },
  { icon: 'time-outline',            label: 'Time',         category: 'Business' },
  { icon: 'timer-outline',           label: 'Deadline',     category: 'Business' },
  { icon: 'alarm-outline',           label: 'Alarm',        category: 'Business' },
  { icon: 'hourglass-outline',       label: 'Countdown',    category: 'Business' },
  { icon: 'bulb-outline',            label: 'Ideas',        category: 'Business' },
  { icon: 'rocket-outline',          label: 'Launch',       category: 'Business' },
  { icon: 'list-outline',            label: 'List',         category: 'Business' },
  { icon: 'folder-outline',          label: 'Files',        category: 'Business' },
  { icon: 'archive-outline',         label: 'Archive',      category: 'Business' },
  { icon: 'funnel-outline',          label: 'Filter',       category: 'Business' },
  { icon: 'filter-outline',          label: 'Sort',         category: 'Business' },
  { icon: 'flag-outline',            label: 'Goals',        category: 'Business' },
  { icon: 'id-card-outline',         label: 'ID',           category: 'Business' },
  { icon: 'save-outline',            label: 'Save',         category: 'Business' },
  { icon: 'print-outline',           label: 'Print',        category: 'Business' },
  { icon: 'attach-outline',          label: 'Attach',       category: 'Business' },
  { icon: 'copy-outline',            label: 'Copy',         category: 'Business' },
  { icon: 'storefront-outline',      label: 'Store',        category: 'Business' },
  { icon: 'scale-outline',           label: 'Justice',      category: 'Business' },
  { icon: 'checkmark-circle-outline',label: 'Complete',     category: 'Business' },

  // Craft
  { icon: 'hammer-outline',          label: 'Build',        category: 'Craft' },
  { icon: 'construct-outline',       label: 'DIY',          category: 'Craft' },
  { icon: 'car-outline',             label: 'Driving',      category: 'Craft' },
  { icon: 'home-outline',            label: 'Home',         category: 'Craft' },
  { icon: 'cut-outline',             label: 'Tailoring',    category: 'Craft' },
  { icon: 'settings-outline',        label: 'Mechanics',    category: 'Craft' },
  { icon: 'color-wand-outline',      label: 'Repair',       category: 'Craft' },
  { icon: 'build-outline',           label: 'Tools',        category: 'Craft' },
  { icon: 'flower-outline',          label: 'Garden',       category: 'Craft' },
  { icon: 'shirt-outline',           label: 'Fashion',      category: 'Craft' },
  { icon: 'wine-outline',            label: 'Brewing',      category: 'Craft' },
  { icon: 'pizza-outline',           label: 'Baking',       category: 'Craft' },
  { icon: 'color-fill-outline',      label: 'Painting',     category: 'Craft' },
  { icon: 'pint-outline',            label: 'Brewing',      category: 'Craft' },
  { icon: 'bag-handle-outline',      label: 'Shopping',     category: 'Craft' },

  // Life
  { icon: 'airplane-outline',        label: 'Travel',       category: 'Life' },
  { icon: 'game-controller-outline', label: 'Gaming',       category: 'Life' },
  { icon: 'map-outline',             label: 'Explore',      category: 'Life' },
  { icon: 'compass-outline',         label: 'Direction',    category: 'Life' },
  { icon: 'location-outline',        label: 'Location',     category: 'Life' },
  { icon: 'pin-outline',             label: 'Pin',          category: 'Life' },
  { icon: 'navigate-circle-outline', label: 'Navigate',     category: 'Life' },
  { icon: 'paw-outline',             label: 'Pets',         category: 'Life' },
  { icon: 'earth-outline',           label: 'World',        category: 'Life' },
  { icon: 'snow-outline',            label: 'Winter',       category: 'Life' },
  { icon: 'umbrella-outline',        label: 'Weather',      category: 'Life' },
  { icon: 'sparkles-outline',        label: 'Inspire',      category: 'Life' },
  { icon: 'infinite-outline',        label: 'Habit',        category: 'Life' },
  { icon: 'planet-outline',          label: 'Space',        category: 'Life' },
  { icon: 'telescope-outline',       label: 'Stargazing',   category: 'Life' },
  { icon: 'balloon-outline',         label: 'Celebrate',    category: 'Life' },
  { icon: 'ticket-outline',          label: 'Events',       category: 'Life' },
  { icon: 'home-outline',            label: 'Home',         category: 'Life' },
  { icon: 'trail-sign-outline',      label: 'Hiking',       category: 'Life' },
  { icon: 'tv-outline',              label: 'Watch TV',     category: 'Life' },
  { icon: 'help-buoy-outline',       label: 'Safety',       category: 'Life' },
  { icon: 'flag-outline',            label: 'Milestone',    category: 'Life' },
  { icon: 'gift-outline',            label: 'Gift',         category: 'Life' },
  { icon: 'alarm-outline',           label: 'Alarm',        category: 'Life' },

  // Weather
  { icon: 'cloudy-outline',          label: 'Cloudy',       category: 'Weather' },
  { icon: 'rainy-outline',           label: 'Rain',         category: 'Weather' },
  { icon: 'thunderstorm-outline',    label: 'Storm',        category: 'Weather' },
  { icon: 'partly-sunny-outline',    label: 'Partly Sunny', category: 'Weather' },
  { icon: 'sunny-outline',           label: 'Sunny',        category: 'Weather' },
  { icon: 'snow-outline',            label: 'Snow',         category: 'Weather' },
  { icon: 'thermometer-outline',     label: 'Temperature',  category: 'Weather' },
  { icon: 'flash-outline',           label: 'Lightning',    category: 'Weather' },
  { icon: 'cloudy-night-outline',    label: 'Night',        category: 'Weather' },
  { icon: 'umbrella-outline',        label: 'Rain',         category: 'Weather' },
  { icon: 'moon-outline',            label: 'Moon',         category: 'Weather' },
  { icon: 'water-outline',           label: 'Flood',        category: 'Weather' },

  // Transportation
  { icon: 'bus-outline',             label: 'Bus',          category: 'Transportation' },
  { icon: 'train-outline',           label: 'Train',        category: 'Transportation' },
  { icon: 'subway-outline',          label: 'Subway',       category: 'Transportation' },
  { icon: 'car-outline',             label: 'Car',          category: 'Transportation' },
  { icon: 'bicycle-outline',         label: 'Cycle',        category: 'Transportation' },
  { icon: 'airplane-outline',        label: 'Fly',          category: 'Transportation' },
  { icon: 'boat-outline',            label: 'Boat',         category: 'Transportation' },
  { icon: 'walk-outline',            label: 'Walk',         category: 'Transportation' },
  { icon: 'speedometer-outline',     label: 'Speed',        category: 'Transportation' },
  { icon: 'navigate-outline',        label: 'Navigate',     category: 'Transportation' },
  { icon: 'locate-outline',          label: 'Locate',       category: 'Transportation' },
  { icon: 'location-outline',        label: 'Location',     category: 'Transportation' },
  { icon: 'pin-outline',             label: 'Pin',          category: 'Transportation' },

  // Animals
  { icon: 'paw-outline',             label: 'Paw',          category: 'Animals' },
  { icon: 'bug-outline',             label: 'Insect',       category: 'Animals' },
  { icon: 'fish-outline',            label: 'Fish',         category: 'Animals' },
  { icon: 'footsteps-outline',       label: 'Tracks',       category: 'Animals' },
  { icon: 'egg-outline',             label: 'Egg',          category: 'Animals' },
  { icon: 'leaf-outline',            label: 'Plant',        category: 'Animals' },
  { icon: 'flower-outline',          label: 'Flower',       category: 'Animals' },
  { icon: 'water-outline',           label: 'Aquatic',      category: 'Animals' },
  { icon: 'earth-outline',           label: 'Habitat',      category: 'Animals' },
  { icon: 'rose-outline',            label: 'Flora',        category: 'Animals' },
  { icon: 'bonfire-outline',         label: 'Nature',       category: 'Animals' },

  // Elements
  { icon: 'flame-outline',           label: 'Fire',         category: 'Elements' },
  { icon: 'water-outline',           label: 'Water',        category: 'Elements' },
  { icon: 'earth-outline',           label: 'Earth',        category: 'Elements' },
  { icon: 'cloud-outline',           label: 'Air',          category: 'Elements' },
  { icon: 'planet-outline',          label: 'Space',        category: 'Elements' },
  { icon: 'nuclear-outline',         label: 'Energy',       category: 'Elements' },
  { icon: 'infinite-outline',        label: 'Void',         category: 'Elements' },
  { icon: 'flash-outline',           label: 'Plasma',       category: 'Elements' },
  { icon: 'thunderstorm-outline',    label: 'Thunder',      category: 'Elements' },
  { icon: 'bonfire-outline',         label: 'Bonfire',      category: 'Elements' },
  { icon: 'magnet-outline',          label: 'Magnetism',    category: 'Elements' },
  { icon: 'prism-outline',           label: 'Prism',        category: 'Elements' },
  { icon: 'snow-outline',            label: 'Ice',          category: 'Elements' },
  { icon: 'beaker-outline',          label: 'Alchemy',      category: 'Elements' },
  { icon: 'flash-off-outline',       label: 'Nullify',      category: 'Elements' },
  { icon: 'leaf-outline',            label: 'Nature',       category: 'Elements' },

  // Equipment
  { icon: 'hammer-outline',          label: 'Hammer',       category: 'Equipment' },
  { icon: 'settings-outline',        label: 'Config',       category: 'Equipment' },
  { icon: 'construct-outline',       label: 'Wrench',       category: 'Equipment' },
  { icon: 'barbell-outline',         label: 'Weights',      category: 'Equipment' },
  { icon: 'briefcase-outline',       label: 'Briefcase',    category: 'Equipment' },
  { icon: 'flask-outline',           label: 'Flask',        category: 'Equipment' },
  { icon: 'telescope-outline',       label: 'Scope',        category: 'Equipment' },
  { icon: 'mic-outline',             label: 'Mic',          category: 'Equipment' },
  { icon: 'camera-outline',          label: 'Camera',       category: 'Equipment' },
  { icon: 'laptop-outline',          label: 'Laptop',       category: 'Equipment' },
  { icon: 'color-wand-outline',      label: 'Wand',         category: 'Equipment' },
  { icon: 'shirt-outline',           label: 'Armor',        category: 'Equipment' },
  { icon: 'hand-right-outline',      label: 'Gauntlet',     category: 'Equipment' },
  { icon: 'hand-left-outline',       label: 'Glove',        category: 'Equipment' },
  { icon: 'link-outline',            label: 'Amulet',       category: 'Equipment' },
  { icon: 'key-outline',             label: 'Key',          category: 'Equipment' },
  { icon: 'bag-outline',             label: 'Pack',         category: 'Equipment' },
  { icon: 'diamond-outline',         label: 'Gem',          category: 'Equipment' },
  { icon: 'watch-outline',           label: 'Timepiece',    category: 'Equipment' },
  { icon: 'flashlight-outline',      label: 'Torch',        category: 'Equipment' },
  { icon: 'radio-outline',           label: 'Radio',        category: 'Equipment' },
  { icon: 'glasses-outline',         label: 'Goggles',      category: 'Equipment' },
  { icon: 'wallet-outline',          label: 'Pouch',        category: 'Equipment' },
  { icon: 'shield-half-outline',     label: 'Ward',         category: 'Equipment' },
  { icon: 'battery-full-outline',    label: 'Power Cell',   category: 'Equipment' },
  { icon: 'power-outline',           label: 'Power',        category: 'Equipment' },

  // Magic — general
  { icon: 'eye-outline',             label: 'Divination',   category: 'Magic' },
  { icon: 'eye-off-outline',         label: 'Illusion',     category: 'Magic' },
  { icon: 'star-outline',            label: 'Star',         category: 'Magic' },
  { icon: 'moon-outline',            label: 'Moon',         category: 'Magic' },
  { icon: 'sparkles-outline',        label: 'Sparkle',      category: 'Magic' },
  { icon: 'color-wand-outline',      label: 'Wand',         category: 'Magic' },
  { icon: 'rose-outline',            label: 'Rose',         category: 'Magic' },
  { icon: 'heart-outline',           label: 'Charm',        category: 'Magic' },
  { icon: 'planet-outline',          label: 'Cosmos',       category: 'Magic' },
  { icon: 'nuclear-outline',         label: 'Arcane',       category: 'Magic' },
  { icon: 'skull-outline',           label: 'Necromancy',   category: 'Magic' },
  { icon: 'diamond-outline',         label: 'Crystal',      category: 'Magic' },
  { icon: 'bonfire-outline',         label: 'Ritual',       category: 'Magic' },
  { icon: 'dice-outline',            label: 'Fate',         category: 'Magic' },
  { icon: 'prism-outline',           label: 'Refraction',   category: 'Magic' },
  { icon: 'shield-half-outline',     label: 'Barrier',      category: 'Magic' },
  // Magic — schools
  { icon: 'flame-outline',           label: 'Pyromancy',    category: 'Magic' },
  { icon: 'flask-outline',           label: 'Transmutation',category: 'Magic' },
  { icon: 'flash-outline',           label: 'Evocation',    category: 'Magic' },
  { icon: 'shield-outline',          label: 'Abjuration',   category: 'Magic' },
  { icon: 'happy-outline',           label: 'Enchantment',  category: 'Magic' },
  { icon: 'medkit-outline',          label: 'Restoration',  category: 'Magic' },
  { icon: 'hourglass-outline',       label: 'Chronomancy',  category: 'Magic' },
  { icon: 'sunny-outline',           label: 'Lumomancy',    category: 'Magic' },
  { icon: 'body-outline',            label: 'Runic',        category: 'Magic' },
  { icon: 'infinite-outline',        label: 'Spellcraft',   category: 'Magic' },
  { icon: 'water-outline',           label: 'Hydromancy',   category: 'Magic' },
  { icon: 'leaf-outline',            label: 'Druidism',     category: 'Magic' },
  { icon: 'cloud-outline',           label: 'Aeromancy',    category: 'Magic' },
  { icon: 'earth-outline',           label: 'Geomancy',     category: 'Magic' },

  // Food
  { icon: 'fast-food-outline',       label: 'Fast Food',    category: 'Food' },
  { icon: 'cafe-outline',            label: 'Cafe',         category: 'Food' },
  { icon: 'beer-outline',            label: 'Beer',         category: 'Food' },
  { icon: 'ice-cream-outline',       label: 'Ice Cream',    category: 'Food' },
  { icon: 'restaurant-outline',      label: 'Dining',       category: 'Food' },
  { icon: 'pizza-outline',           label: 'Pizza',        category: 'Food' },
  { icon: 'wine-outline',            label: 'Wine',         category: 'Food' },
  { icon: 'nutrition-outline',       label: 'Nutrition',    category: 'Food' },
  { icon: 'egg-outline',             label: 'Egg',          category: 'Food' },
  { icon: 'fish-outline',            label: 'Seafood',      category: 'Food' },
  { icon: 'pint-outline',            label: 'Pint',         category: 'Food' },
  { icon: 'basket-outline',          label: 'Groceries',    category: 'Food' },
  { icon: 'leaf-outline',            label: 'Vegan',        category: 'Food' },
  { icon: 'water-outline',           label: 'Drink',        category: 'Food' },

  // Games
  { icon: 'game-controller-outline', label: 'Controller',   category: 'Games' },
  { icon: 'trophy-outline',          label: 'Trophy',       category: 'Games' },
  { icon: 'medal-outline',           label: 'Medal',        category: 'Games' },
  { icon: 'headset-outline',         label: 'Headset',      category: 'Games' },
  { icon: 'grid-outline',            label: 'Board',        category: 'Games' },
  { icon: 'layers-outline',          label: 'Levels',       category: 'Games' },
  { icon: 'shield-outline',          label: 'Shield',       category: 'Games' },
  { icon: 'stats-chart-outline',     label: 'Stats',        category: 'Games' },
  { icon: 'podium-outline',          label: 'Leaderboard',  category: 'Games' },
  { icon: 'skull-outline',           label: 'Defeat',       category: 'Games' },
  { icon: 'diamond-outline',         label: 'Gem',          category: 'Games' },
  { icon: 'dice-outline',            label: 'Dice',         category: 'Games' },
  { icon: 'bowling-ball-outline',    label: 'Bowling',      category: 'Games' },
  { icon: 'shuffle-outline',         label: 'Random',       category: 'Games' },
  { icon: 'play-circle-outline',     label: 'Play',         category: 'Games' },
  { icon: 'play-outline',            label: 'Start',        category: 'Games' },
  { icon: 'extension-puzzle-outline',label: 'Puzzle',       category: 'Games' },
  { icon: 'checkmark-circle-outline',label: 'Complete',     category: 'Games' },
  { icon: 'star-outline',            label: 'Rating',       category: 'Games' },
  { icon: 'shield-checkmark-outline',label: 'Achievement',  category: 'Games' },

  // Sports
  { icon: 'golf-outline',            label: 'Golf',         category: 'Sports' },
  { icon: 'tennisball-outline',       label: 'Soccer',       category: 'Sports' },
  { icon: 'football-outline',        label: 'Football',     category: 'Sports' },
  { icon: 'american-football-outline',label: 'Am. Football',category: 'Sports' },
  { icon: 'basketball-outline',      label: 'Basketball',   category: 'Sports' },
  { icon: 'baseball-outline',        label: 'Baseball',     category: 'Sports' },
  { icon: 'tennisball-outline',      label: 'Tennis',       category: 'Sports' },
  { icon: 'bowling-ball-outline',    label: 'Bowling',      category: 'Sports' },
  { icon: 'bicycle-outline',         label: 'Cycling',      category: 'Sports' },
  { icon: 'boat-outline',            label: 'Rowing',       category: 'Sports' },
  { icon: 'walk-outline',            label: 'Walking',      category: 'Sports' },
  { icon: 'trail-sign-outline',      label: 'Hiking',       category: 'Sports' },
  { icon: 'trophy-outline',          label: 'Trophy',       category: 'Sports' },
  { icon: 'medal-outline',           label: 'Medal',        category: 'Sports' },
  { icon: 'flag-outline',            label: 'Race Flag',    category: 'Sports' },
  { icon: 'stopwatch-outline',       label: 'Race Timer',   category: 'Sports' },
  { icon: 'timer-outline',           label: 'Interval',     category: 'Sports' },
  { icon: 'body-outline',            label: 'Athletics',    category: 'Sports' },
  { icon: 'fitness-outline',         label: 'Training',     category: 'Sports' },
  { icon: 'podium-outline',          label: 'Podium',       category: 'Sports' },
  { icon: 'flame-outline',           label: 'Intensity',    category: 'Sports' },
  { icon: 'pulse-outline',           label: 'Heart Rate',   category: 'Sports' },
  { icon: 'barbell-outline',         label: 'Weightlifting',category: 'Sports' },

  // Music
  { icon: 'musical-notes-outline',   label: 'Music',        category: 'Music' },
  { icon: 'musical-note-outline',    label: 'Note',         category: 'Music' },
  { icon: 'disc-outline',            label: 'Vinyl',        category: 'Music' },
  { icon: 'albums-outline',          label: 'Albums',       category: 'Music' },
  { icon: 'recording-outline',       label: 'Record',       category: 'Music' },
  { icon: 'shuffle-outline',         label: 'Shuffle',      category: 'Music' },
  { icon: 'repeat-outline',          label: 'Loop',         category: 'Music' },
  { icon: 'volume-high-outline',     label: 'Volume',       category: 'Music' },
  { icon: 'volume-low-outline',      label: 'Low Vol',      category: 'Music' },
  { icon: 'volume-mute-outline',     label: 'Mute',         category: 'Music' },
  { icon: 'mic-outline',             label: 'Microphone',   category: 'Music' },
  { icon: 'mic-circle-outline',      label: 'Mic Circle',   category: 'Music' },
  { icon: 'headset-outline',         label: 'Headphones',   category: 'Music' },
  { icon: 'radio-outline',           label: 'Radio',        category: 'Music' },
  { icon: 'play-circle-outline',     label: 'Play',         category: 'Music' },
  { icon: 'play-back-circle-outline',label: 'Rewind',       category: 'Music' },
  { icon: 'pause-circle-outline',    label: 'Pause',        category: 'Music' },
  { icon: 'stop-circle-outline',     label: 'Stop',         category: 'Music' },
  { icon: 'play-outline',            label: 'Play',         category: 'Music' },
  { icon: 'pause-outline',           label: 'Pause',        category: 'Music' },

  // Security
  { icon: 'lock-closed-outline',     label: 'Lock',         category: 'Security' },
  { icon: 'lock-open-outline',       label: 'Unlocked',     category: 'Security' },
  { icon: 'finger-print-outline',    label: 'Fingerprint',  category: 'Security' },
  { icon: 'shield-outline',          label: 'Shield',       category: 'Security' },
  { icon: 'shield-checkmark-outline',label: 'Verified',     category: 'Security' },
  { icon: 'shield-half-outline',     label: 'Guard',        category: 'Security' },
  { icon: 'eye-outline',             label: 'Watch',        category: 'Security' },
  { icon: 'eye-off-outline',         label: 'Hidden',       category: 'Security' },
  { icon: 'key-outline',             label: 'Key',          category: 'Security' },
  { icon: 'scan-outline',            label: 'Scan',         category: 'Security' },
  { icon: 'qr-code-outline',         label: 'QR Code',      category: 'Security' },
  { icon: 'barcode-outline',         label: 'Barcode',      category: 'Security' },
  { icon: 'id-card-outline',         label: 'Identity',     category: 'Security' },
  { icon: 'document-lock-outline',   label: 'Encrypted',    category: 'Security' },
  { icon: 'ban-outline',             label: 'Banned',       category: 'Security' },
];

export const SKILL_COLORS = [
  '#a855f7', // purple (default)
  '#6366f1', // indigo
  '#3b82f6', // blue
  '#06b6d4', // cyan
  '#14b8a6', // teal
  '#22c55e', // green
  '#84cc16', // lime
  '#eab308', // yellow
  '#f97316', // orange
  '#ef4444', // red
  '#f43f5e', // rose
  '#ec4899', // pink
  '#ffffff', // white
];

export const DEFAULT_SKILL_COLOR = SKILL_COLORS[0];

type IconVariant = 'outline' | 'filled' | 'sharp';

const ALL_OUTLINE_ICONS = (Object.keys(Ionicons.glyphMap) as (keyof typeof Ionicons.glyphMap)[])
  .filter((name) => (name as string).endsWith('-outline'));

const ALL_FILLED_ICONS = (Object.keys(Ionicons.glyphMap) as (keyof typeof Ionicons.glyphMap)[])
  .filter((name) => !(name as string).endsWith('-outline') && !(name as string).endsWith('-sharp'));

const ALL_SHARP_ICONS = (Object.keys(Ionicons.glyphMap) as (keyof typeof Ionicons.glyphMap)[])
  .filter((name) => (name as string).endsWith('-sharp'));

function toVariant(icon: string, variant: IconVariant): keyof typeof Ionicons.glyphMap | null {
  const base = icon.replace(/-(outline|sharp)$/, '');
  const target = variant === 'outline' ? `${base}-outline` : variant === 'sharp' ? `${base}-sharp` : base;
  return (target in Ionicons.glyphMap) ? (target as keyof typeof Ionicons.glyphMap) : null;
}

// "add-circle-outline" → "Add Circle"
function formatIconLabel(name: string): string {
  return name
    .replace(/-(outline|sharp)$/, '')
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}


interface IconPickerModalProps {
  visible: boolean;
  skillName: string;
  title?: string;
  currentIcon: string | null;
  currentColor: string | null;
  onConfirm: (icon: string | null, color: string | null) => void;
  onClose: () => void;
  onRename?: (newName: string) => void;
  onDelete?: () => void;
}

export function IconPickerModal({
  visible,
  skillName,
  title = 'Customise skill',
  currentIcon,
  currentColor,
  onConfirm,
  onClose,
  onRename,
  onDelete,
}: IconPickerModalProps) {
  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const { width } = useWindowDimensions();
  const numColumns = Math.max(4, Math.floor(width / 72));

  const [draftIcon, setDraftIcon] = useState<string | null>(currentIcon);
  const [draftColor, setDraftColor] = useState<string>(currentColor ?? DEFAULT_SKILL_COLOR);
  const [search, setSearch] = useState('');
  const [variant, setVariant] = useState<IconVariant>('outline');
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(skillName);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (visible) {
      setDraftIcon(currentIcon);
      setDraftColor(currentColor ?? DEFAULT_SKILL_COLOR);
      setSearch('');
      setEditingName(false);
      setShowDeleteConfirm(false);
      const v: IconVariant = currentIcon?.endsWith('-outline')
        ? 'outline'
        : currentIcon?.endsWith('-sharp')
        ? 'sharp'
        : currentIcon ? 'filled' : 'outline';
      setVariant(v);
    }
  }, [visible, currentIcon, currentColor]);

  // Sync draftName when skillName prop changes (e.g. after a successful rename)
  useEffect(() => {
    setDraftName(skillName);
    setEditingName(false);
  }, [skillName]);

  const handleVariantChange = (newVariant: IconVariant) => {
    setVariant(newVariant);
    if (draftIcon) {
      const converted = toVariant(draftIcon, newVariant);
      if (converted) setDraftIcon(converted);
    }
  };

  const filteredIcons = useMemo((): { icon: keyof typeof Ionicons.glyphMap; label: string }[] => {
    const icons = variant === 'outline' ? ALL_OUTLINE_ICONS
      : variant === 'sharp' ? ALL_SHARP_ICONS
      : ALL_FILLED_ICONS;
    const q = search.trim().toLowerCase();
    if (q) {
      return icons
        .filter((name) => (name as string).includes(q))
        .map((icon) => ({ icon, label: formatIconLabel(icon as string) }));
    }
    return icons.map((icon) => ({ icon, label: formatIconLabel(icon as string) }));
  }, [search, variant]);

  const handleDone = () => {
    onConfirm(draftIcon, draftIcon ? draftColor : null);
    onClose();
  };

  const handleClear = () => {
    onConfirm(null, null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>

        {/* Header with live preview */}
        <View style={styles.header}>
          <View style={[styles.preview, { borderColor: draftIcon ? draftColor + '66' : theme.borderDefault, backgroundColor: draftIcon ? draftColor + '22' : theme.bgDeep }]}>
            {draftIcon ? (
              <Ionicons name={draftIcon as keyof typeof Ionicons.glyphMap} size={28} color={resolveIconColor(draftColor, theme.colorScheme)} />
            ) : (
              <Ionicons name="help-outline" size={24} color={theme.textTertiary} />
            )}
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerLabel}>{title}</Text>
            {editingName ? (
              <View style={styles.nameEditRow}>
                <TextInput
                  style={styles.nameInput}
                  value={draftName}
                  onChangeText={setDraftName}
                  autoFocus
                  returnKeyType="done"
                  selectTextOnFocus
                  onSubmitEditing={() => {
                    if (draftName.trim() && draftName.trim() !== skillName) onRename?.(draftName.trim());
                    setEditingName(false);
                  }}
                />
                <TouchableOpacity
                  onPress={() => {
                    if (draftName.trim() && draftName.trim() !== skillName) onRename?.(draftName.trim());
                    setEditingName(false);
                  }}
                >
                  <Ionicons name="checkmark" size={18} color="#a855f7" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setDraftName(skillName); setEditingName(false); }}>
                  <Ionicons name="close" size={18} color={theme.textDisabled} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.nameRow}
                onPress={() => onRename && setEditingName(true)}
                disabled={!onRename}
              >
                <Text style={styles.skillName}>{skillName}</Text>
                {onRename && <Ionicons name="pencil-outline" size={13} color={theme.textDisabled} style={{ marginLeft: 5 }} />}
              </TouchableOpacity>
            )}
          </View>
          {onDelete && (
            <TouchableOpacity onPress={() => setShowDeleteConfirm(true)} style={styles.trashBtn}>
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={theme.textDisabled} />
          </TouchableOpacity>
        </View>

        {/* Fixed top: colour + search */}
        <View style={styles.fixedTop}>
          <Text style={styles.sectionLabel}>Colour</Text>
          <View style={styles.swatches}>
            {SKILL_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[styles.swatch, { backgroundColor: resolveIconColor(color, theme.colorScheme) }, draftColor === color && styles.swatchSelected]}
                onPress={() => setDraftColor(color)}
              >
                {draftColor === color && <Ionicons name="checkmark" size={14} color={resolveIconColor(color, theme.colorScheme) === '#ffffff' ? '#000000' : '#ffffff'} />}
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Icon</Text>

          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={15} color={theme.textDisabled} />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search all icons..."
              placeholderTextColor={theme.textTertiary}
              returnKeyType="search"
            />
            {search ? (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={15} color={theme.textDisabled} />
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.variantRow}>
            {(['outline', 'filled', 'sharp'] as IconVariant[]).map((v) => (
              <TouchableOpacity
                key={v}
                style={[styles.variantBtn, variant === v && styles.variantBtnActive]}
                onPress={() => handleVariantChange(v)}
              >
                <Text style={[styles.variantText, variant === v && styles.variantTextActive]}>
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Scrollable icon grid — FlatList handles its own virtualisation */}
        {filteredIcons.length === 0 ? (
          <Text style={styles.noResults}>No icons found</Text>
        ) : (
          <FlatList
            data={filteredIcons}
            keyExtractor={(item) => item.icon}
            numColumns={numColumns}
            key={`${numColumns}-${variant}`}
            contentContainerStyle={styles.grid}
            initialNumToRender={40}
            maxToRenderPerBatch={40}
            windowSize={5}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isSelected = draftIcon === item.icon;
              const resolvedDraftColor = resolveIconColor(draftColor, theme.colorScheme);
              return (
                <TouchableOpacity
                  style={[styles.iconCell, isSelected && { borderColor: resolvedDraftColor, backgroundColor: resolvedDraftColor + '22' }]}
                  onPress={() => setDraftIcon(isSelected ? null : item.icon)}
                >
                  <Ionicons
                    name={item.icon}
                    size={24}
                    color={isSelected ? resolvedDraftColor : theme.textDisabled}
                  />
                  <Text style={[styles.iconLabel, isSelected && { color: resolvedDraftColor }]} numberOfLines={1}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        )}

        {/* Actions */}
        <View style={[styles.actions, showDeleteConfirm && { flexDirection: 'column' }]}>
          {showDeleteConfirm ? (
            <>
              <Text style={styles.deleteConfirmText}>Delete "{skillName}"? This cannot be undone.</Text>
              <View style={styles.deleteConfirmBtns}>
                <TouchableOpacity style={styles.clearBtn} onPress={() => setShowDeleteConfirm(false)}>
                  <Text style={styles.clearText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => { onDelete?.(); onClose(); }}>
                  <Text style={styles.deleteBtnText}>Delete Skill</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              {(currentIcon || currentColor) && (
                <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
                  <Text style={styles.clearText}>Remove</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.doneBtn, { backgroundColor: draftColor }]} onPress={handleDone}>
                <Text style={styles.doneText}>Done</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

      </View>
    </Modal>
  );
}

function getStyles(theme: Theme) {
  return StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: '#000000aa',
    },
    sheet: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.bgCard,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      borderTopWidth: 1,
      borderColor: theme.borderDefault,
      maxHeight: '85%',
      flexDirection: 'column',
    },
    fixedTop: {
      flexShrink: 0,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderDefault,
    },
    preview: {
      width: 52,
      height: 52,
      borderRadius: 12,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerText: { flex: 1 },
    headerLabel: { color: theme.textDisabled, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    skillName: { color: theme.textPrimary, fontSize: 17, fontWeight: '700', marginTop: 1 },
    closeBtn: { padding: 4 },
    trashBtn: { padding: 4, marginRight: 4 },
    nameRow: { flexDirection: 'row', alignItems: 'center' },
    nameEditRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    nameInput: {
      flex: 1,
      color: theme.textPrimary,
      fontSize: 17,
      fontWeight: '700',
      borderBottomWidth: 1,
      borderBottomColor: '#7c3aed',
      paddingVertical: 2,
      minWidth: 80,
    },
    deleteConfirmText: { color: '#ef444499', fontSize: 13, marginBottom: 2 },
    deleteConfirmBtns: { flexDirection: 'row', gap: 10 },
    deleteBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      backgroundColor: '#ef444418',
      borderWidth: 1,
      borderColor: '#ef444440',
      alignItems: 'center',
    },
    deleteBtnText: { color: '#ef4444', fontSize: 14, fontWeight: '700' },
    sectionLabel: {
      color: theme.textDisabled,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 8,
    },
    swatches: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      paddingHorizontal: 16,
    },
    swatch: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.borderMuted,
    },
    swatchSelected: {
      borderWidth: 2.5,
      borderColor: theme.textPrimary,
    },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.bgDeep,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.borderDefault,
      paddingHorizontal: 10,
      paddingVertical: 7,
      marginHorizontal: 16,
      gap: 6,
    },
    searchInput: {
      flex: 1,
      color: theme.textPrimary,
      fontSize: 13,
    },
    noResults: {
      color: theme.textTertiary,
      fontSize: 13,
      textAlign: 'center',
      paddingVertical: 24,
    },
    grid: { paddingHorizontal: 8, paddingBottom: 8, paddingTop: 8 },
    iconCell: {
      flex: 1,
      margin: 4,
      paddingVertical: 10,
      alignItems: 'center',
      gap: 4,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: 'transparent',
      backgroundColor: theme.bgDeep,
    },
    iconLabel: { color: theme.textDisabled, fontSize: 9, fontWeight: '600' },
    variantRow: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginTop: 10,
      marginBottom: 4,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.borderDefault,
      overflow: 'hidden',
    },
    variantBtn: {
      flex: 1,
      paddingVertical: 7,
      alignItems: 'center',
      backgroundColor: theme.bgDeep,
    },
    variantBtnActive: {
      backgroundColor: theme.borderDefault,
    },
    variantText: {
      color: theme.textDisabled,
      fontSize: 12,
      fontWeight: '600',
    },
    variantTextActive: {
      color: theme.textPrimary,
    },
    actions: {
      flexDirection: 'row',
      gap: 10,
      padding: 16,
      paddingBottom: 32,
      borderTopWidth: 1,
      borderTopColor: theme.borderDefault,
    },
    clearBtn: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.borderDefault,
      alignItems: 'center',
    },
    clearText: { color: theme.textMuted, fontSize: 14 },
    doneBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
    },
    doneText: { color: '#000', fontSize: 15, fontWeight: '700' },
  });
}
