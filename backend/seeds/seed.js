import dotenv from 'dotenv'
import mongoose from 'mongoose'
import Rice from '../models/Rice.js'

dotenv.config()

const seedRices = [
  {
    title: 'Neon Matrix Protocol',
    description:
      'A highly optimized Hyprland configuration focusing on keyboard-driven workflow with subtle neon accents. The color palette revolves around deep blacks and bright neon green/cyan to ensure readability during late-night coding sessions. Window management is handled by Hyprland with custom animation curves that feel snappy yet fluid.',
    author: '@void_dweller',
    images: [
      'https://picsum.photos/seed/rice1/800/450',
      'https://picsum.photos/seed/rice1b/800/450',
      'https://picsum.photos/seed/rice1c/800/450',
    ],
    distro: 'Arch',
    wm: 'Hyprland',
    bar: 'Waybar',
    launcher: 'Rofi',
    colorScheme: 'Nord',
    terminal: 'Alacritty',
    dotfilesUrl: 'https://github.com/void_dweller/dotfiles',
    tags: ['ARCH', 'HYPRLAND', 'WAYBAR', 'WAYLAND'],
    likes: ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8'],
    views: 12400,
    status: 'APPROVED',
  },
  {
    title: 'Pastel Dreamscape',
    description:
      'Minimalist bspwm setup utilizing pastel colors and rounded corners for a softer aesthetic. Polybar is configured with custom modules for workspace indicators and system stats. The overall feel is calm and productive, perfect for长时间 coding sessions.',
    author: '@echo_chamber',
    images: [
      'https://picsum.photos/seed/rice2/800/450',
      'https://picsum.photos/seed/rice2b/800/450',
    ],
    distro: 'NixOS',
    wm: 'Bspwm',
    bar: 'Polybar',
    launcher: 'Dmenu',
    colorScheme: 'Catppuccin',
    terminal: 'Kitty',
    dotfilesUrl: 'https://github.com/echo_chamber/nix-config',
    tags: ['NIXOS', 'BSPWM', 'POLYBAR', 'X11'],
    likes: ['u1', 'u2', 'u3', 'u4', 'u5'],
    views: 8400,
    status: 'APPROVED',
  },
  {
    title: 'Retro Warmth Gruv',
    description:
      'Gruvbox themed desktop environment with warm earthy tones and a retro terminal aesthetic. Sway provides a tiling Wayland experience with minimal decorations. Waybar is styled to match the Gruvbox palette with custom CSS.',
    author: '@sys_admin_99',
    images: [
      'https://picsum.photos/seed/rice3/800/450',
    ],
    distro: 'Fedora',
    wm: 'Sway',
    bar: 'Waybar',
    launcher: 'Wofi',
    colorScheme: 'Gruvbox',
    terminal: 'WezTerm',
    dotfilesUrl: 'https://github.com/sys_admin_99/dotfiles',
    tags: ['FEDORA', 'SWAY', 'WAYLAND', 'GRUVBOX'],
    likes: ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8', 'u9', 'u10', 'u11'],
    views: 28500,
    status: 'APPROVED',
  },
  {
    title: 'Dracula Midnight',
    description:
      'A dark, moody i3 setup using the Dracula color scheme with purple and pink accents. Rofi is configured as a centered application launcher with custom theming. The bar uses i3blocks with custom scripts for volume, battery, and network status.',
    author: '@night_coder',
    images: [
      'https://picsum.photos/seed/rice4/800/450',
      'https://picsum.photos/seed/rice4b/800/450',
    ],
    distro: 'Debian',
    wm: 'i3',
    bar: 'i3blocks',
    launcher: 'Rofi',
    colorScheme: 'Dracula',
    terminal: 'Terminator',
    dotfilesUrl: 'https://github.com/night_coder/i3-setup',
    tags: ['DEBIAN', 'I3', 'DRACULA', 'X11'],
    likes: ['u1', 'u2'],
    views: 3200,
    status: 'PENDING',
  },
]

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('MONGODB_CONNECTED')

    await Rice.deleteMany({})
    console.log('COLLECTION_CLEARED')

    const inserted = await Rice.insertMany(seedRices)
    console.log(`SEEDED: ${inserted.length} rices`)

    await mongoose.disconnect()
    console.log('MONGODB_DISCONNECTED')
  } catch (err) {
    console.error(`SEED_ERROR: ${err.message}`)
    process.exit(1)
  }
}

seed()
