const fs = require("fs");
const path = require("path");
const root = "D:/codex/family-home/frontend/src";
const fixEncoding = (filePath) => {
  let content = fs.readFileSync(filePath, "utf-8");
  let changed = false;
  // Fix common garbled Chinese patterns
  const fixes = {
    "浠": "以",
    "瀹": "家",
    "垛": "",
    "啋": "→",
    "鎴": "房",
    "块": "间",
    "棿": "",
    "鈫": "",
    "掓": "柜",
    "煖": "子",
    "瀛": "",
    "愨": "",
    "啋鎶藉眽": "→抽屉",
    "灞": "层",
    "傜": "级",
    "骇": "管",
    "绠": "理",
    "悊": "",
    "鎮": "您",
    "ㄧ": "的",
    "殑": "",
    "瀹跺眳": "家居",
    "绌洪棿": "空间",
    "鍚": "功",
    "凡": "记",
    "鏍": "录",
    "椤": "项"
  };
  for (const [from, to] of Object.entries(fixes)) {
    if (content.includes(from)) {
      content = content.replaceAll(from, to);
      changed = true;
    }
  }
  if (changed) {
    console.log("Fixed:", filePath);
    fs.writeFileSync(filePath, content, "utf-8");
  }
};
const walk = (dir) => {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const f of files) {
    const fp = path.join(dir, f.name);
    if (f.isDirectory()) walk(fp);
    else if (f.name.endsWith(".vue") || f.name.endsWith(".js") || f.name.endsWith(".css")) fixEncoding(fp);
  }
};
walk(root);
console.log("Encoding fix complete");
