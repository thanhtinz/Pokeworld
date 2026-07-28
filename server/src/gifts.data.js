// TuxeWorld server | src/gifts.data.js | BẢN SAO của js/data/gifts.js
// SINH TỰ ĐỘNG bởi tools/mkgifts.py — KHONG SUA TAY.
// Máy chủ phải tự biết mỗi món đáng bao nhiêu điểm, không tin số client gửi lên.

export const MOC_KET_HON = 10000;
export const QUA_MOI_NGAY = 20;

export const GIFTS = [
  { id: "hoa_hong", name: "Bông Hồng", price: 500, diem: 50, desc: "Một bông thôi, nhưng ngày nào cũng tặng thì khác hẳn.", img: "assets/gifts/hoa_hong.png" },
  { id: "bo_hoa", name: "Bó Hoa", price: 1400, diem: 150, desc: "Bó ba màu, cầm sang nhà người ta là thấy sáng cả gian.", img: "assets/gifts/bo_hoa.png" },
  { id: "socola", name: "Sô-cô-la", price: 2400, diem: 260, desc: "Ngọt vừa phải, hợp mấy hôm trời lạnh.", img: "assets/gifts/socola.png" },
  { id: "gau_bong", name: "Gấu Bông", price: 4500, diem: 500, desc: "To gần bằng cái gối. Ai nhận cũng cười.", img: "assets/gifts/gau_bong.png" },
  { id: "hop_qua", name: "Hộp Quà", price: 8000, diem: 900, desc: "Không nói trong hộp có gì — thế mới là quà.", img: "assets/gifts/hop_qua.png" },
  { id: "nhan_bac", name: "Nhẫn Bạc", price: 16000, diem: 1800, desc: "Bắt đầu nghiêm túc rồi đấy.", img: "assets/gifts/nhan_bac.png" },
  { id: "nhan_vang", name: "Nhẫn Vàng", price: 34000, diem: 4000, desc: "Món này tặng là người ta hiểu ý.", img: "assets/gifts/nhan_vang.png" },
  { id: "nhan_kim_cuong", name: "Nhẫn Kim Cương", price: 85000, diem: 10000, desc: "Đủ để hỏi một câu quan trọng.", img: "assets/gifts/nhan_kim_cuong.png" },
];

export const GIFT_BY_ID = Object.fromEntries(GIFTS.map(q => [q.id, q]));
