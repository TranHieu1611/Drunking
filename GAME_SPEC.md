# SAY HAY SỢ — Đặc tả Web Mini Game nhậu (Thật hay Thách + Thẻ may rủi)

> **Gửi Claude Code:** Hãy xây web game theo đặc tả này. Dữ liệu câu hỏi nằm trong `questions.json` (đi kèm). Ưu tiên: dễ dùng khi đang say, UI đẹp, hiệu ứng mượt, chạy offline trên điện thoại. Toàn bộ giao diện bằng **tiếng Việt**.

---

## 1. Tổng quan

- **Thể loại:** Party game Thật hay Thách cho 2–12 người (tối ưu cho **8 người**), kết hợp cơ chế **thẻ thưởng/thẻ phạt** và **vòng quay may mắn**.
- **Cách chơi vật lý:** 1 thiết bị (điện thoại/tablet/laptop) đặt giữa bàn, chuyền tay theo lượt.
- **Đối tượng:** người trưởng thành (18+), nhóm bạn thân.
- **Nguồn cảm hứng:** Picolo, King's Cup / Ring of Fire, Truth or Drink, Never Have I Ever, thẻ chức năng kiểu Uno / Exploding Kittens.

## 2. Kỹ thuật

- **Một file `index.html` duy nhất** (HTML + CSS + JS thuần, không framework bắt buộc). Có thể dùng thư viện qua CDN (ví dụ `canvas-confetti`), nhưng game phải chạy được khi không có mạng → ưu tiên tự viết hiệu ứng hoặc inline thư viện nhỏ.
- **Inline nội dung `questions.json`** vào file HTML khi build (vì `fetch` file local không chạy được với `file://`). Giữ file JSON riêng làm nguồn để dễ sửa.
- **Lưu trạng thái** ván chơi vào `localStorage` (bọc try/catch). Mở lại trang → hỏi "Chơi tiếp ván cũ?".
- **Mobile-first**: dọc 360–430px là chính, vẫn đẹp trên desktop. Không cuộn ngang. Nút bấm tối thiểu 48px.
- Âm thanh tạo bằng **Web Audio API** (không cần file mp3), có nút tắt/bật.
- Rung: `navigator.vibrate` nếu thiết bị hỗ trợ.

## 3. Màn hình Setup

### 3.1 Người chơi
- Thêm/xóa người chơi (2–12). Mỗi người: **Tên**, **Emoji avatar** (chọn từ lưới ~24 emoji), **màu** (tự gán, có thể đổi).
- Mỗi người có 2 công tắc riêng:
  - **"OK thử thách cặp"** (mặc định TẮT): chỉ người bật mới có thể được random làm `{B}` trong thẻ có tag `couple`, và chỉ người bật mới nhận thẻ `couple` khi là `{A}`.
  - **"Vùng cấm"**: chọn các tag không muốn nhận: `phone`, `outside`, `ex`, `body`. Thẻ có tag bị cấm sẽ không rơi vào người đó (cả vai `{A}` lẫn `{B}`).
  - Tùy chọn **"Không uống (lái xe / nước lọc)"**: người này vẫn chơi, mọi "uống X ngụm" hiển thị thành "uống X ngụm nước lọc".

### 3.2 Cài đặt ván
| Cài đặt | Mặc định | Ghi chú |
|---|---|---|
| Mức độ khởi đầu | 1 (Nhẹ) | 1 Nhẹ/bựa · 2 Cay · 3 Siêu cay |
| Tự tăng độ cay | BẬT | Sau mỗi **2 vòng** (2 × số người lượt) tăng 1 mức, tối đa mức cao nhất cho phép |
| Mức tối đa | 3 | Cho phép khóa ở mức 2 nếu nhóm muốn |
| Thứ tự lượt | Vòng tròn | Hoặc Ngẫu nhiên (không lặp người vừa chơi) |
| Sự kiện ngẫu nhiên | BẬT | Xuất hiện mỗi 4–6 lượt (random) |
| Tắt hẳn tag `outside` | TẮT | Công tắc nhanh cho cả bàn |
| Âm thanh | BẬT | |

- Màn **Luật chơi** ngắn (có thể vuốt qua 4–5 slide) trước khi bắt đầu.

## 4. Vòng chơi (core loop)

```
TURN_START → CHOOSE (Thật/Thách) → CARD_REVEAL → RESOLVE
   RESOLVE: ✅ Hoàn thành → LUCKY_SPIN → TURN_END
            ❌ Từ chối/thất bại → PENALTY_FLOW → TURN_END
TURN_END → (đôi khi) RANDOM_EVENT → TURN_START (người tiếp theo)
```

1. **TURN_START:** Hiện spotlight vào người đến lượt (tên to, avatar, màu). Câu nhắc "Chuyền máy cho **{tên}**!". Hiện số thẻ trong túi người đó.
2. **CHOOSE:** 2 nút lớn 🗣️ **THẬT** / 🔥 **THÁCH**.
   - Nếu người chơi đang dính thẻ phạt **Bắt Buộc Thách** → nút THẬT bị khóa (hiển thị icon khóa + lý do).
   - Trước khi chọn, có thể dùng thẻ thưởng thích hợp (xem mục 5).
3. **CARD_REVEAL:** Rút thẻ từ pool phù hợp (xem mục 7), animation lật 3D. Thay `{A}`, `{B}` bằng tên thật (tô màu theo màu người chơi). Hiện nhãn mức độ (🟢/🟡/🔴) và mức phạt nếu từ chối.
   - Nút: **✅ Xong rồi** · **🍺 Uống thay** · **🔄 Dùng thẻ Đổi Câu** (chỉ hiện nếu có thẻ).
4. **RESOLVE:**
   - **✅ Xong rồi** → cả bàn có thể bấm "Cả bàn duyệt" (mặc định chấp nhận) → sang **LUCKY_SPIN**.
   - **🍺 Uống thay** → **PENALTY_FLOW** với số ngụm = `refuse_sips_default[level]` + số thẻ **Nợ Ly** đang giữ; **nếu đang giữ bất kỳ thẻ phạt nào → nhân đôi**.
5. **TURN_END:** Cập nhật thống kê, kiểm tra **Án Tử** (mục 5.3), giảm thời hạn các hiệu ứng có duration, kiểm tra tăng độ cay, quyết định có bung **RANDOM_EVENT** không.

## 5. Hệ thống thẻ

### 5.1 Nguyên tắc chung
- Mỗi người có một **túi thẻ**: tối đa **3 thẻ thưởng**; thẻ phạt không giới hạn nhưng chạm 3 thì kích hoạt Án Tử.
- **Thẻ ai người đó dùng.** Không ai được dùng thẻ trong lượt người khác **trừ khi chính mình đang bị nhắm tới** (bị đẩy phạt, bị kéo uống cùng). Khi đó app tự bật **popup phản ứng** cho đúng người đó.
- Thẻ thưởng nhận thêm khi túi đã đầy → hỏi "Bỏ thẻ nào?" hoặc từ chối nhận.
- Bấm vào avatar bất kỳ trên thanh người chơi → xem túi thẻ (chỉ xem; dùng thẻ thì chỉ trong ngữ cảnh hợp lệ).

### 5.2 Thẻ thưởng
| ID | Tên | Icon | Khi nào dùng | Tác dụng |
|---|---|---|---|---|
| `shield` | Khiên Bất Tử | 🛡️ | Khi chính mình sắp phải uống (lượt mình hoặc bị đẩy/kéo) | Hủy toàn bộ lần uống đó. Không có tác dụng với sự kiện "Cả Bàn Cạn" |
| `mirror` | Gương Phản Chiếu | 🪞 | Khi chính mình sắp phải uống | Đẩy toàn bộ phạt sang 1 người (chọn tay **hoặc** bấm "Random" để quay chọn). Người nhận được quyền phản ứng |
| `swap` | Đổi Câu | 🔄 | Ở màn CARD_REVEAL của chính mình | Rút lại thẻ khác cùng loại/mức |
| `ally` | Đồng Minh | 🤝 | Khi chính mình sắp phải uống | Chọn 1 người chia đôi số ngụm (làm tròn lên cho cả hai). Người bị kéo có thể phản ứng bằng Khiên |
| `king` | Vua 1 Vòng | 👑 | Ở TURN_START của chính mình | Ra 1 luật tự do (nhập text) hiển thị dạng banner cho cả bàn trong đúng 1 vòng (số lượt = số người). Vi phạm = 1 ngụm (bàn tự phân xử, có nút "+1 ngụm" trên banner) |

### 5.3 Thẻ phạt
| ID | Tên | Icon | Tác dụng |
|---|---|---|---|
| `debt` | Nợ Ly | 💀 | Mỗi thẻ = +1 ngụm cộng vào lần uống tiếp theo, dùng xong thì mất |
| `forcedare` | Bắt Buộc Thách | ⛓️ | Lượt kế tiếp không được chọn Thật; tự mất sau lượt đó |
| `silence` | Câm Lặng | 🤐 | Không được nói đến lượt kế tiếp của mình. Banner nhỏ trên avatar; có nút "+1 ngụm" khi bị bắt lỗi; tự mất sau lượt đó |

**Án Tử 💥:** Khi một người giữ **≥ 3 thẻ phạt** cùng lúc → màn hình full đỏ, rung + âm trầm: "**{tên}** dính ÁN TỬ!" → uống cạn ly + làm 1 thử thách **do cả bàn nhập tay** (ô text) hoặc rút random thẻ Thách mức cao nhất cho phép → xóa toàn bộ thẻ phạt của người đó. Khiên **không** chặn được Án Tử (Gương cũng không).

### 5.4 Luồng phạt (PENALTY_FLOW)
1. Tính số ngụm cuối cùng (base + Nợ Ly, ×2 nếu đang có thẻ phạt). Người bị phạt nhận thêm **1 thẻ phạt ngẫu nhiên** (tỉ lệ: Nợ Ly 50%, Bắt Buộc Thách 30%, Câm Lặng 20%) — **chỉ khi từ chối thẻ Thật/Thách**, không áp dụng khi bị đẩy phạt.
2. **Cơ hội cứu (Quay Đổi Vận):** người bị phạt được quay 1 vòng mini (tỉ lệ thành công **30%**). Thành công → được **đẩy phạt** sang người khác (chọn tay hoặc random) mà không tốn thẻ. Thất bại → tiếp bước 3.
3. Nếu có thẻ thưởng phù hợp (Khiên / Gương / Đồng Minh) → popup "Dùng thẻ?" liệt kê thẻ đang có + nút "Chịu uống".
4. **Khi phạt bị đẩy sang người X:** bật **popup phản ứng** cho X (overlay to, tên X, "Chuyền máy cho X!"), đếm ngược **10 giây**:
   - X có Khiên → [Dùng Khiên] → phạt bị hủy.
   - X có Gương → [Bật ngược] → phạt quay về người đẩy (người đẩy lại được phản ứng nếu còn thẻ — chuỗi combo; giới hạn tối đa 4 lần bật để tránh vòng lặp vô tận).
   - Hết giờ hoặc [Chịu uống] → X uống.
   - X không có thẻ nào phù hợp → bỏ qua popup, hiện ngay "X uống N ngụm".
5. Màn kết quả: "**{tên}** uống **N** ngụm 🍺" với animation ly bia dâng lên; cập nhật thống kê.

## 6. Vòng Quay May Mắn (LUCKY_SPIN)

Sau khi hoàn thành thử thách. Wheel 8 ô, canvas hoặc SVG, quay có quán tính, tiếng tick mỗi ô, chậm dần rồi dừng (3–4 giây). Tỉ lệ có thể cấu hình trong code:

| Ô | Tỉ lệ | Kết quả |
|---|---|---|
| 🛡️ Khiên | 25% | Nhận thẻ Khiên |
| 🪞 Gương | 15% | Nhận thẻ Gương |
| 🔄 Đổi Câu | 15% | Nhận thẻ Đổi Câu |
| 🎁 Thẻ bí ẩn | 8% | Nhận ngẫu nhiên Đồng Minh hoặc Vua 1 Vòng |
| 😐 Không có gì | 12% | Câu chọc ngẫu nhiên ("Hên xui thôi…") |
| 💀 Xui | 10% | Nhận 1 thẻ phạt ngẫu nhiên |
| 🍻 Cả bàn uống | 10% | Mọi người trừ người quay uống 1 ngụm |
| 💰 Jackpot | 5% | Chọn 1 người uống cạn ly (người đó được phản ứng bằng Khiên/Gương) |

> Kích thước mỗi ô trên wheel tỉ lệ theo xác suất để người chơi thấy minh bạch.

Hiệu ứng: confetti khi trúng thẻ/Jackpot, flash đỏ + rung khi Xui.

## 7. Rút thẻ câu hỏi (logic chọn)

- Pool = các thẻ `truth` hoặc `dare` có `level ≤ mức hiện tại`, **ưu tiên** `level == mức hiện tại` (70%) còn lại lấy mức thấp hơn (30%).
- **Lọc theo người chơi `{A}`:** bỏ thẻ có tag nằm trong "Vùng cấm" của `{A}`; bỏ thẻ `couple` nếu `{A}` chưa bật "OK thử thách cặp"; bỏ `outside` nếu cả bàn tắt.
- **Chọn `{B}`** (nếu thẻ có `{B}`): random trong số người chơi khác `{A}` thỏa: không cấm tag của thẻ, và nếu thẻ có tag `couple` thì `{B}` phải bật "OK thử thách cặp". Không có ai thỏa → bỏ thẻ, rút thẻ khác.
- **Không lặp:** thẻ đã dùng được đưa vào danh sách đã rút; hết pool mới xáo lại.
- Nếu pool rỗng sau lọc → hạ mức; vẫn rỗng → hiện thông báo và cho chọn loại còn lại.
- Hỗ trợ **câu tự thêm**: màn "Thêm câu của hội" (loại, mức, tag, nội dung) — lưu `localStorage`, gộp vào pool.

## 8. Sự kiện ngẫu nhiên (RANDOM_EVENT)

Bung sau TURN_END mỗi 4–6 lượt. Màn hình đặc biệt: nền đổi màu, tiêu đề lớn có animation "giật" (glitch) + âm thanh còi. Danh sách và `effect` trong `questions.json → events`. Cách xử lý từng `effect`:

| effect | Xử lý |
|---|---|
| `manual_pick_loser` | Hiện lưới avatar, bàn bấm chọn người thua → người đó vào PENALTY_FLOW (không nhận thẻ phạt) |
| `mostlikely_vote` | Rút 1 câu `mostlikely` theo mức hiện tại, đếm ngược 3-2-1 to, rồi chọn người bị chỉ nhiều nhất → uống |
| `never_round` | Rút 1 câu `never`, hiển thị; bàn tick những ai đã uống (để tính thống kê), không bắt buộc |
| `shuffle_all_cards` | Gom tất cả thẻ (thưởng + phạt) của mọi người, xáo, chia lại ngẫu nhiên giữ đúng tổng số thẻ mỗi người; animation thẻ bay |
| `card_tax` | Người nhiều thẻ thưởng nhất chọn 1 thẻ đưa người ít nhất (hòa thì random) |
| `all_drink` | Mọi người uống, không dùng được thẻ |
| `heal_most_penalized` | Xóa 1 thẻ phạt của người nhiều thẻ phạt nhất |
| `link_two_players` | Gắn 2 người "song sinh" trong `duration_turns` lượt — mỗi khi 1 người uống, app hiện kèm "+ {song sinh} uống theo" |
| `random_king` | Như thẻ Vua 1 Vòng nhưng cho người random, kéo dài `duration_turns` |
| `random_card_each` | Mỗi người nhận 1 thẻ ngẫu nhiên (60% thưởng / 40% phạt) |
| `manual_rule` | Hiện banner luật trong `duration_turns` lượt, có nút "+1 ngụm" |
| `least_drinker_assign` | Người có tổng ngụm thấp nhất chọn 1 người uống (người bị chọn được phản ứng) |
| `hot_potato` | Màn bom: đồng hồ ẩn 10–25s, tiếng tích tắc nhanh dần, nút "Đang cầm: chọn tên" để cập nhật ai đang cầm… **Đơn giản hóa:** khi nổ, hiện lưới avatar để bàn chọn người đang cầm máy |
| `duel_two_players` | Random 2 người, đếm ngược, bàn chọn người thua |
| `swap_bags` | Đổi toàn bộ túi thẻ của người nhiều thẻ phạt nhất và người nhiều thẻ thưởng nhất |

## 9. Bàn chơi (màn hình chính)

- **Thanh người chơi** (trên cùng hoặc xếp vòng tròn): avatar + tên + chấm nhỏ số thẻ thưởng (xanh) / thẻ phạt (đỏ) + số ngụm đã uống. Người đang lượt phát sáng, nhịp thở (pulse).
- **Khu trung tâm:** nội dung theo trạng thái (chọn Thật/Thách, thẻ, vòng quay, popup).
- **Banner luật đang hiệu lực** (Vua, song sinh, cấm tên, Câm Lặng).
- **Menu** (góc phải): Tạm dừng · Sửa người chơi (thêm/bớt người giữa ván) · Đổi mức độ · Thêm câu · Âm thanh · Kết thúc ván.
- Chỉ báo mức độ hiện tại (🟢/🟡/🔴) và số vòng.

## 10. Kết thúc & Bảng tổng kết

Bấm "Kết thúc ván" → màn tổng kết có confetti:
- 🍺 **Bợm Nhậu** — uống nhiều ngụm nhất
- 🛡️ **Vua Né Ly** — né được nhiều lần nhất (Khiên + đẩy phạt thành công)
- 😈 **Kẻ Gieo Rắc** — đẩy phạt sang người khác nhiều nhất
- 🔥 **Liều Mạng** — hoàn thành nhiều thẻ Thách nhất
- 🐔 **Gà Con** — từ chối (uống thay) nhiều nhất
- 💥 **Tử Tù** — dính Án Tử nhiều nhất
- Bảng chi tiết từng người: ngụm, Thật/Thách đã làm, từ chối, thẻ đã dùng.
- Nút: **Chơi ván mới (giữ người chơi)** · **Về màn hình đầu**.

## 11. UI / Phong cách

- **Chủ đề:** quán bar neon đêm. Nền tối (#0b0714 → #1a0b2e gradient), neon tím `#b026ff`, hồng `#ff2e88`, vàng `#ffd60a`, xanh cyan `#00f0ff` cho thẻ thưởng, đỏ `#ff3b3b` cho thẻ phạt.
- **Font:** tiêu đề dùng font display đậm có hỗ trợ tiếng Việt (ví dụ "Bungee" không có dấu đầy đủ → kiểm tra; đề xuất "Be Vietnam Pro" ExtraBold/Black cho tiêu đề và body). Nếu offline không tải được font → fallback system-ui. **Bắt buộc hiển thị đúng dấu tiếng Việt.**
- **Chữ to**: nội dung thẻ tối thiểu 22px trên mobile; tên người chơi 28px+.
- **Thẻ:** bo góc lớn, viền neon phát sáng theo mức độ (xanh lá/vàng/đỏ), mặt sau có họa tiết + logo game.
- **Animation:** lật thẻ 3D (rotateY), spotlight, pulse, rung màn hình (shake) khi phạt, flash đỏ Án Tử, confetti khi thưởng, thẻ bay vào túi khi nhận, glitch cho sự kiện. Tôn trọng `prefers-reduced-motion`.
- **Âm thanh (Web Audio):** click, lật thẻ (whoosh), tick wheel, ting ting thưởng, buzz phạt, còi sự kiện, trống Án Tử.

## 12. Dữ liệu & State

### 12.1 `questions.json`
- `truth[]`, `dare[]`: `{ id, level, text, tags[] }`
- `never[]`, `mostlikely[]`: `{ id, level, text }`
- `events[]`: `{ id, name, text, effect, sips?, duration_turns? }`
- `_meta.refuse_sips_default`: số ngụm khi từ chối theo mức.

### 12.2 State gợi ý
```js
state = {
  version: 1,
  players: [{ id, name, emoji, color, coupleOk, bannedTags: [], noAlcohol,
              bonus: ['shield', ...], penalty: ['debt', ...],
              stats: { sips, truths, dares, refusals, dodges, pushes, deathSentences } }],
  settings: { startLevel, maxLevel, autoEscalate, order, events, outsideOff, sound },
  turn: { index, currentPlayerId, round, level, phase, card, targetB },
  effects: [{ type: 'king'|'twins'|'rule'|'silence', playerIds, text, turnsLeft }],
  usedCardIds: [],
  customCards: [],
  turnsSinceEvent: 0,
  log: []           // lịch sử hành động (để hiển thị "vừa rồi" + debug)
}
```
- Lưu `state` vào `localStorage` sau mỗi thay đổi phase.
- Mọi tỉ lệ (wheel, cứu phạt 30%, thẻ phạt random, tần suất sự kiện) gom vào 1 object `CONFIG` ở đầu file để dễ chỉnh.

## 13. Tiêu chí hoàn thành (Acceptance)

1. Thêm 8 người, cấu hình vùng cấm/OK cặp, bắt đầu chơi trong < 1 phút.
2. Lượt chơi chạy đúng vòng: chọn → thẻ → xong/uống → quay/phạt → người tiếp theo.
3. `{A}`/`{B}` được thay đúng tên; thẻ `couple` **không bao giờ** rơi vào người chưa bật OK cặp (cả A lẫn B); tag trong vùng cấm không bao giờ rơi vào người cấm.
4. Gương đẩy phạt → người nhận được popup phản ứng; Khiên chặn được; Gương bật ngược được; chuỗi tối đa 4 lần.
5. Đủ 3 thẻ phạt → Án Tử kích hoạt ngay, xóa thẻ phạt sau đó.
6. Mức độ tự tăng theo vòng khi bật.
7. Sự kiện ngẫu nhiên xuất hiện đúng tần suất, tất cả 15 effect chạy được.
8. Tải lại trang → khôi phục ván.
9. Hiển thị đẹp trên iPhone SE (375px) và màn hình desktop; không cuộn ngang; tiếng Việt đúng dấu.
10. Màn tổng kết hiển thị đủ danh hiệu và bảng thống kê.

## 14. Lộ trình gợi ý

- **v1 (MVP):** Mục 3–7, 9–10, 12 + 6 sự kiện đơn giản (`all_drink`, `never_round`, `mostlikely_vote`, `manual_pick_loser`, `heal_most_penalized`, `random_card_each`).
- **v2:** Đủ 15 sự kiện, câu tự thêm, âm thanh đầy đủ, hiệu ứng nâng cao.
- **v3 (tùy chọn):** Mỗi người dùng điện thoại riêng, đồng bộ realtime theo phòng (ví dụ qua WebSocket/Firebase).

## 15. Ghi chú an toàn (hiển thị trong màn Luật chơi)

- Không ai bị ép: luôn có nút **Uống thay**.
- Thử thách đụng chạm chỉ dành cho người bật **OK thử thách cặp**.
- Có chế độ **nước lọc** cho người lái xe.
- Câu ở lại bàn nhậu — chuyện trong game không mang ra ngoài 🤫
