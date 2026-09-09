const path = require('path');
const fs = require('fs');
const svgtofont = require('svgtofont').default;

const distDir = path.resolve(__dirname, 'static/iconfont');

svgtofont({
  src: path.resolve(__dirname, 'static/icons'),
  dist: distDir,
  fontName: 'appicons',
  css: true,
  outSVGReact: false,
  outSVGPath: false,
}).then(() => {
  // 清理 svgtofont 自动附带生成的 CSS 预处理器与框架文件
  const unwantedFiles = [
    'appicons.less',
    'appicons.module.less',
    'appicons.scss',
    'appicons.styl',
  ];
  const unwantedDirs = ['react', 'vue'];

  unwantedFiles.forEach((file) => {
    const filePath = path.join(distDir, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });

  unwantedDirs.forEach((dir) => {
    const dirPath = path.join(distDir, dir);
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  });

  // 1. 生成可供前端组件快速校验的图标名称列表
  const iconFiles = fs.readdirSync(path.resolve(__dirname, 'static/icons')).filter(f => f.endsWith('.svg'));
  const iconNames = iconFiles.map(f => f.replace(/\.svg$/, ''));
  fs.writeFileSync(
    path.join(distDir, 'appicons-list.js'),
    `// 自动生成的所有字体图标名称列表\nexport default ${JSON.stringify(iconNames)};\n`
  );

  // 2. 优化 appicons.css 中的 @font-face 声明，使其完美兼容 uni-app App-Plus (iOS / Android) 与多端
  const cssPath = path.join(distDir, 'appicons.css');
  if (fs.existsSync(cssPath)) {
    let cssContent = fs.readFileSync(cssPath, 'utf8');
    const fontFaceBlock = `@font-face {
  font-family: "appicons";
  src: url('~@/static/iconfont/appicons.ttf') format('truetype'),
       url('appicons.ttf') format('truetype'),
       url('appicons.woff2') format('woff2'),
       url('appicons.woff') format('woff');
}`;
    cssContent = cssContent.replace(/@font-face\s*\{[\s\S]*?\}/, fontFaceBlock);
    fs.writeFileSync(cssPath, cssContent);
  }

  console.log('精简字体图标库打包完成！只保留了核心 CSS 与字体文件，并已生成 appicons-list.js。');
});

