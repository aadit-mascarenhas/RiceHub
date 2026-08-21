export const FILTER_GROUPS = [
  {
    title: 'Distro',
    field: 'distro',
    options: [
      { label: 'Arch Linux', value: 'Arch', count: 124 },
      { label: 'NixOS', value: 'NixOS', count: 89 },
      { label: 'Fedora', value: 'Fedora', count: 42 },
    ],
  },
  {
    title: 'WM / Compositor',
    field: 'wm',
    options: [
      { label: 'Hyprland', value: 'Hyprland', count: 210 },
      { label: 'Sway', value: 'Sway', count: 56 },
      { label: 'i3', value: 'i3', count: 102 },
    ],
  },
  {
    title: 'Theme',
    field: 'colorScheme',
    options: [
      { label: 'Catppuccin', value: 'Catppuccin', count: 96 },
      { label: 'Nord', value: 'Nord', count: 71 },
      { label: 'Gruvbox', value: 'Gruvbox', count: 58 },
    ],
  },
]

export const EMPTY_FILTERS = { distro: [], wm: [], colorScheme: [] }