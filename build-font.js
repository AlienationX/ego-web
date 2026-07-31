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

  console.log('精简字体图标库打包完成！只保留了核心 CSS 与字体文件。');
});
