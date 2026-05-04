export const colorThemes = {
  purple: {
    primary: 'violet',
    primaryLight: 'violet-50',
    primaryDark: 'violet-700',
    gradient: 'from-violet-50 via-white to-white',
    rgb: { primary: '139, 92, 246', primaryLight: '245, 243, 255', primaryDark: '124, 58, 237' }
  },
  green: {
    primary: 'emerald',
    primaryLight: 'emerald-50',
    primaryDark: 'emerald-700',
    gradient: 'from-emerald-50 via-white to-white',
    rgb: { primary: '16, 185, 129', primaryLight: '236, 253, 245', primaryDark: '4, 120, 87' }
  },
  red: {
    primary: 'rose',
    primaryLight: 'rose-50',
    primaryDark: 'rose-700',
    gradient: 'from-rose-50 via-white to-white',
    rgb: { primary: '244, 63, 94', primaryLight: '255, 241, 242', primaryDark: '190, 18, 60' }
  },
  blue: {
    primary: 'blue',
    primaryLight: 'blue-50',
    primaryDark: 'blue-700',
    gradient: 'from-blue-50 via-white to-white',
    rgb: { primary: '59, 130, 246', primaryLight: '239, 246, 255', primaryDark: '29, 78, 216' }
  },
  orange: {
    primary: 'orange',
    primaryLight: 'orange-50',
    primaryDark: 'orange-700',
    gradient: 'from-orange-50 via-white to-white',
    rgb: { primary: '249, 115, 22', primaryLight: '255, 247, 237', primaryDark: '194, 65, 12' }
  },
  white: {
    primary: 'slate',
    primaryLight: 'slate-50',
    primaryDark: 'slate-700',
    gradient: 'from-slate-50 via-white to-white',
    rgb: { primary: '100, 116, 139', primaryLight: '248, 250, 252', primaryDark: '51, 65, 85' }
  }
}

export type ColorTheme = keyof typeof colorThemes