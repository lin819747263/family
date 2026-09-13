const OSS = require('ali-oss');
const { SystemSetting } = require('../models');

let cachedConfig = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 1000; // 1 minute cache

async function getOSSConfig() {
  const now = Date.now();
  if (cachedConfig && now - cacheTime < CACHE_TTL) {
    return cachedConfig;
  }

  const settings = await SystemSetting.findAll({
    where: {
      key: ['oss_enabled', 'oss_endpoint', 'oss_bucket', 'oss_region',
            'oss_access_key_id', 'oss_access_key_secret', 'oss_custom_domain']
    }
  });

  const config = {};
  settings.forEach(s => { config[s.key] = s.value; });

  cachedConfig = config;
  cacheTime = now;
  return config;
}

function clearCache() {
  cachedConfig = null;
  cacheTime = 0;
}

async function getClient() {
  const config = await getOSSConfig();

  if (config.oss_enabled !== 'true') {
    throw new Error('OSS 未启用');
  }

  if (!config.oss_endpoint || !config.oss_bucket ||
      !config.oss_access_key_id || !config.oss_access_key_secret) {
    throw new Error('OSS 配置不完整');
  }

  return new OSS({
    region: config.oss_region || 'oss-cn-hangzhou',
    accessKeyId: config.oss_access_key_id,
    accessKeySecret: config.oss_access_key_secret,
    bucket: config.oss_bucket,
    endpoint: config.oss_endpoint,
    secure: true
  });
}

async function uploadBuffer(buffer, filename, options = {}) {
  const client = await getClient();
  const config = await getOSSConfig();

  const dir = options.dir || 'uploads';
  const key = `${dir}/${filename}`;

  const result = await client.put(key, buffer, {
    headers: options.headers || {}
  });

  let url = result.url;
  if (config.oss_custom_domain) {
    const customDomain = config.oss_custom_domain.replace(/\/$/, '');
    const pathPart = new URL(result.url).pathname;
    url = `${customDomain}${pathPart}`;
  }

  return { url, key };
}

async function deleteFile(key) {
  const client = await getClient();
  await client.delete(key);
}

module.exports = {
  getOSSConfig,
  getClient,
  uploadBuffer,
  deleteFile,
  clearCache
};
