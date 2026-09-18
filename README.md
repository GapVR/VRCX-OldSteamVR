# VRCX Personal Fork + UI Overhaul

**Notice:** This fork of VRCX maintains compatibility with older versions of SteamVR (tested with SteamVR 2.7.4) that was broken after 2025-08-23, includes the latest upstream features, and restores the older VRCX interface style where possible. It is not the official project and may differ from the main project in appearance and layout. For the official version, please see: [https://github.com/vrcx-team/VRCX](https://github.com/vrcx-team/VRCX)

**Changes (VRCX Release 2026.09.16):**

Dialogs
- User, Avatar, and World dialogs reverted to older compact vertical layout with smaller thumbnail headers instead of full banners.
- World dialog reverted to old Instance and Info tabs layout.
- Instance widget info bar reverted to older single-line format without dot separators and padding.
- User action dropdown simplified — removed nested submenu.
- Reduced padding across all dialogs.

Sidebar & Friends
- Private friend counts shown in every section (Favorites, Online, Active, Offline, etc.).
- Friends tab shows percentage of visible (non-private) friends online.

Feed & Game Log
- Feed filter buttons and game log entries use colored badges matching event type (green=online, red=offline, blue=gps, purple=avatar).

Favorites
- Replaced dropdown menus with individual icon buttons for select and edit actions.
- Private lock icons colored orange instead of gray.

Theme
- Dark theme brightened for better visibility.
- Color-coded feed events with theme-aware colors.

Misc
- Reverted to older OpenVR API version for SteamVR 2.7.4 compatibility (updated API broke the overlay).
- Page size dropdown replaced with log-scale slider (options: 10/100).
- Local avatar favorites no longer require VRC+.
- Removed "·" separator from location labels throughout the program.
