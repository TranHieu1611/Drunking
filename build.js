// Inline câu hỏi vào game.
//   node build.js        nhúng questions.json vào index.html (bản chính thức, KHÔNG gửi cho người ngoài)
//   node build.js test   nhúng questions.test.json, xuất dist/say-hay-so-choi-thu.html để gửi chơi thử
const fs = require('fs');
const path = require('path');

const at = f => path.join(__dirname, f);
const read = f => fs.readFileSync(at(f), 'utf8');
const re = /(<script id="questions-data" type="application\/json">)[\s\S]*?(<\/script>)/;
const inline = (html, jsonText) => {
  if (!re.test(html)) throw new Error('Không tìm thấy thẻ questions-data trong index.html');
  const safe = JSON.stringify(JSON.parse(jsonText)).replace(/</g, '\\u003c'); // tránh câu hỏi nào đó chứa "</script>"
  return html.replace(re, (_, open, close) => open + safe + close);
};

if (process.argv[2] === 'test') {
  const out = inline(read('index.html'), read('questions.test.json'));
  // Chặn lộ bộ chính thức: không câu nào của questions.json được nằm trong file gửi đi
  const real = JSON.parse(read('questions.json'));
  const decoded = out.replace(/\\u003c/g, '<');
  const leaked = ['truth', 'dare', 'never', 'mostlikely', 'events']
    .flatMap(k => real[k])
    .filter(c => decoded.includes(c.text) || decoded.includes(JSON.stringify(c.text).slice(1, -1)));
  if (leaked.length) throw new Error(`File thử còn chứa ${leaked.length} câu thật: ${leaked.slice(0, 5).map(c => c.id).join(', ')}`);
  fs.mkdirSync(at('dist'), { recursive: true });
  fs.writeFileSync(at('dist/say-hay-so-choi-thu.html'), out);
  console.log('Đã xuất dist/say-hay-so-choi-thu.html, không chứa câu nào của bộ chính thức');
} else {
  fs.writeFileSync(at('index.html'), inline(read('index.html'), read('questions.json')));
  console.log('Đã inline questions.json vào index.html');
}
