// Inline questions.json vào index.html. Chạy lại sau mỗi lần sửa câu hỏi: node build.js
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'index.html');
const data = JSON.stringify(JSON.parse(fs.readFileSync(path.join(__dirname, 'questions.json'), 'utf8')));
const safe = data.replace(/</g, '\\u003c'); // tránh câu hỏi nào đó chứa "</script>"
const html = fs.readFileSync(htmlPath, 'utf8');
const re = /(<script id="questions-data" type="application\/json">)[\s\S]*?(<\/script>)/;
if (!re.test(html)) throw new Error('Không tìm thấy thẻ questions-data trong index.html');
fs.writeFileSync(htmlPath, html.replace(re, (_, open, close) => open + safe + close));
console.log('Đã inline questions.json vào index.html');
