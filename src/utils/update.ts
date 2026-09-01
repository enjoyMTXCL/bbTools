
// 语义化版本比较：'v0.3.10' vs '0.3.9' → 大于
const parseVersion = (v: string): number[] =>
  String(v)
    .replace(/^v/i, '')
    .split('.')
    .map((n) => Number(n) || 0)

const compareVersion = (a: string, b: string): number => {
  const pa = parseVersion(a)
  const pb = parseVersion(b)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] || 0
    const y = pb[i] || 0
    if (x > y) return 1
    if (x < y) return -1
  }
  return 0
}

// 获取所有 releases（默认按发布时间倒序，最新在前），最多 30 条
const fetchReleases = async () => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch('https://api.github.com/repos/Icedb/bbTools/releases', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) return null;
    const releases = await response.json();
    return Array.isArray(releases) ? releases : null;
  } catch (error) {
    return null;
  }
}

const tagOf = (r: any): string => (r?.tag_name || r?.name || '').replace(/^v/i, '')

export async function updateToGithub() {
  const releases = await fetchReleases();
  if (!releases || !releases.length) {
    return false;
  }
  const currentVersion = __APP_VERSION__

  // 过滤出版本高于当前版本、且非草稿/预发布的 releases，按版本从旧到新排序
  const newer = releases
    .filter((r) => !r.draft && !r.prerelease && compareVersion(tagOf(r), currentVersion) > 0)
    .sort((a, b) => compareVersion(tagOf(a), tagOf(b)))

  if (!newer.length) {
    return {
      version: currentVersion,
      downloadUrl: '',
      body: '',
      code: 1
    };
  }

  // 罗列从当前版本之后到最新版本的所有 release 描述
  const latest = newer[newer.length - 1]
  const body = newer
    .map((r) => `【版本 ${tagOf(r)}】\n${(r.body || '暂无更新说明').trim()}`)
    .join('\n\n')

  return {
    version: tagOf(latest),
    downloadUrl: latest.assets?.[0]?.browser_download_url || '',
    body,
    code: 0
  };
}
