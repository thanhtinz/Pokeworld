# -*- coding: utf-8 -*-
"""Chuyen ban do Tiled (.tmx) cua Tuxemon sang dinh dang TuxeWorld.

Chay:  python3 tools/mktmx.py <duong-dan-kho-Tuxemon> [ten_map ...]
Vi du: python3 tools/mktmx.py /tmp/Tuxemon

Nguon: https://github.com/Tuxemon/Tuxemon — ban do va tileset CC BY-SA 4.0.

Ghi de:
  js/data/maps.js       ban do da chuyen
  assets/maps/<id>.png  ATLAS rieng cua tung ban do

Vi sao moi ban do mot atlas: ban do Tuxemon dung 5-6 tileset cung luc, ghep
lai qua "firstgid". Neu chep ca 6 tileset (3 MB) vao du an thi rat nang trong
khi moi ban do chi dung vai tram o. Cong cu gom DUNG nhung o that su xuat hien
tren ban do do vao mot tam anh nho, roi doi chi so o trong ban do sang chi so
moi trong tam anh do. Luc chay game chi phai tai mot anh cho mot ban do.

Bo cuc du lieu moi cua mot ban do:
  { name, w, h, tile: 16, atlas: 'assets/maps/x.png', cols,
    layers: [[...chi so o, -1 = trong...], ...],   ve tu duoi len
    above: [...],                                   lop ve DE LEN nhan vat
    solid: [0/1...], warps: [...], npcs: [...], spots: [...], spawn: {x,y} }
"""
import os
import re
import sys
import json
import xml.etree.ElementTree as ET

CRAFTPIX_DIR = '/tmp/craftpix'

import bangduong
import casino
import craftpix
import khupho
import nengoc
import phongtrong
import vungdat

TILE = 16
MAX_ATLAS_COLS = 32

# Ban do lay vao game + ten tieng Viet. Chon mot cum LIEN THONG voi nhau:
# thi tran khoi dau -> nha trong thi tran -> duong ra ngoai -> thi tran ke.
# Diem xuat phat + so ban do toi da lay theo duong di (BFS qua cong dich chuyen).
# Lay ca cum 75 ban do thi du lieu phinh to ma nguoi choi khong di het noi,
# nen chi lay nhung ban do gan diem xuat phat.
START = 'taba_town'
MAX_MAPS = 100

# Ten tieng Viet cho nhung ban do quen thuoc; con lai suy tu slug.
VI_NAME = {
    # Thi tran / duong di
    'taba_town': 'Thị Trấn Taba',
    'cotton_town': 'Thị Trấn Bông',
    'leather_town': 'Thị Trấn Da',
    'paper_town': 'Thị Trấn Giấy',
    'timber_town': 'Thị Trấn Gỗ',
    'candy_town': 'Thị Trấn Kẹo',
    'flower_city': 'Thành Phố Hoa',
    # Ban do cua chien dich Spyder — dat ten tay cho ra tieng Viet tu te
    'routea': 'Đường Ven Biển', 'routec': 'Đường Rừng Thông',
    'routed': 'Đường Đồng Cỏ', 'routee': 'Đường Sương Mù',
    'brideswood': 'Rừng Cô Dâu', 'greenwash': 'Thị Trấn Xanh',
    'omnichannel1': 'Toà Thương Trường — Tầng 1',
    'omnichannel2': 'Toà Thương Trường — Tầng 2',
    'omnichannel3': 'Toà Thương Trường — Tầng 3',
    'downstairs': 'Nhà Dân — Tầng Trệt', 'citypark_house1': 'Nhà Bên Công Viên',
    'mansion': 'Dinh Thự Cổ', 'tunnel': 'Đường Hầm Xuyên Núi',
    'scoop1': 'Tiệm Kem Đầu Phố', 'dragonscave': 'Hang Rồng',
    'dojo1': 'Võ Đường Thứ Nhất', 'dojo2': 'Võ Đường Thứ Hai',
    'citypark': 'Công Viên Thành Phố',
    'route1': 'Đường Số 1',
    'route2': 'Đường Số 2',
    'route3': 'Đường Số 3',
    'route4': 'Đường Số 4',
    'route1_sanglorian': 'Đường Số 1 — Ngã Sanglorian',
    'dryadsgrove': 'Rừng Dryad',
    # Nha trong thi tran Taba
    'player_house_downstairs': 'Nhà Mình — Tầng Trệt',
    'player_house_bedroom': 'Nhà Mình — Phòng Ngủ',
    'maple_house': 'Nhà Maple',
    'maple_bedroom': 'Nhà Maple — Phòng Ngủ',
    'professor_lab': 'Phòng Nghiên Cứu',
    'healing_center': 'Trạm Hồi Sức',
    'tuxe_mart_taba': 'Tuxemart Taba',
    'taba_house1': 'Nhà Ông Bà Clawbrew',
    'taba_house2': 'Thư Viện Di Sản',
    'taba_house2_upstairs': 'Thư Viện Di Sản — Tầng Trên',
    'taba_house3': 'Nhà Trọ Lá Trầm Tư',
    'taba_house3_upstairs': 'Nhà Trọ Lá Trầm Tư — Tầng Trên',
    'taba_house4': 'Quán Rượu Hải Âu Đáng Kính',
    # Khu thi dau Taba (Taba Battle Area)
    'taba_ba_foyer': 'Khu Thi Đấu Taba — Tiền Sảnh',
    'taba_ba_main': 'Khu Thi Đấu Taba — Đại Sảnh',
    'taba_ba_passageway_1': 'Khu Thi Đấu Taba — Hành Lang 1',
    'taba_ba_passageway_2': 'Khu Thi Đấu Taba — Hành Lang 2',
    'taba_ba_passageway_3': 'Khu Thi Đấu Taba — Hành Lang 3',
    'taba_ba_passageway_4': 'Khu Thi Đấu Taba — Hành Lang 4',
    'taba_ba_stairwell_1': 'Khu Thi Đấu Taba — Cầu Thang',
    # Thi tran Bong
    'cotton_cathedral': 'Thánh Đường Bông',
    'cotton_scoop': 'Tiệm Tạp Hoá Bông',
    'cotton_cafe': 'Quán Cà Phê Bông',
    'cotton_cafe_basement': 'Quán Cà Phê Bông — Tầng Hầm',
    'cotton_daycare': 'Nhà Trẻ Bông',
    'cotton_misa_house': 'Nhà Misa',
    'cotton_misa_house_upstairs': 'Nhà Misa — Tầng Trên',
    # Thi tran Da
    'leather_scoop': 'Tiệm Tạp Hoá Da',
    'leather_shaft1': 'Hầm Mỏ Shaft 1',
    'leather_shaft2': 'Hầm Mỏ Shaft 2',
}


# Ten dia danh ghep tu HAI phan: vung dat + cong trinh.
# Ban do Tuxemon dat ten kieu <vung>_<cong trinh><so>, vi du cotton_house1,
# paper_daycare, greenwash_level2 — dich hai phan roi ghep lai thi ten nao cung
# doc duoc, khong con kieu "Cotton Nhà1".
VUNG = {
    'taba': 'Taba', 'cotton': 'Bông', 'leather': 'Da', 'flower': 'Hoa',
    'candy': 'Kẹo', 'paper': 'Giấy', 'timber': 'Gỗ', 'greenwash': 'Xanh',
    'nimrod': 'Thợ Săn', 'omnichannel': 'Thương Trường', 'wayfarer': 'Lữ Khách',
    'spyder': 'Nhện', 'dragonscave': 'Hang Rồng', 'mansion': 'Dinh Thự',
    'sanglorian': 'Sanglorian', 'dryadsgrove': 'Rừng Nữ Thần',
}

CONG_TRINH = [
    ('rival_downstairs', 'Nhà Đối Thủ'), ('rival_upstairs', 'Nhà Đối Thủ (Gác)'),
    ('walledgarden', 'Vườn Tường'), ('greenhouse', 'Nhà Kính'),
    ('daycare', 'Nhà Trẻ'), ('petshop', 'Tiệm Thú Cưng'), ('artshop', 'Tiệm Tranh'),
    ('museum', 'Bảo Tàng'), ('hospital', 'Bệnh Viện'), ('tunnel', 'Đường Hầm'),
    ('stairwell', 'Cầu Thang'), ('passageway', 'Hành Lang'),
    ('basement', 'Tầng Hầm'), ('upstairs', 'Gác'), ('downstairs', 'Tầng Trệt'),
    ('center', 'Trung Tâm Hồi Phục'), ('scoop', 'Tiệm Kem'), ('cafe', 'Quán Cà Phê'),
    ('manor', 'Dinh Thự'), ('bottom', 'Tầng Dưới'), ('middle', 'Tầng Giữa'),
    ('top', 'Tầng Trên'), ('level', 'Tầng'), ('room', 'Phòng'), ('foyer', 'Tiền Sảnh'),
    ('main', 'Đại Sảnh'), ('port', 'Bến Cảng'), ('inn', 'Quán Trọ'),
    ('house', 'Nhà'), ('shop', 'Cửa Hàng'), ('mart', 'Siêu Thị'), ('lab', 'Phòng Thí Nghiệm'),
    ('bedroom', 'Phòng Ngủ'), ('gym', 'Võ Đường'), ('dojo', 'Võ Đường'),
    ('cave', 'Hang'), ('park', 'Công Viên'), ('town', 'Thị Trấn'), ('city', 'Thành Phố'),
    ('br', 'Phòng Nghỉ'),
]


def vi_name(slug):
    if slug in VI_NAME:
        return VI_NAME[slug]
    con = slug
    vung = ''
    for k, v in sorted(VUNG.items(), key=lambda x: -len(x[0])):
        if con == k or con.startswith(k + '_'):
            vung = v
            con = con[len(k):].lstrip('_')
            break
    # so thu tu o cuoi (house1 -> Nha 1)
    m = re.match(r'^(.*?)(\d+)$', con)
    so = ''
    if m:
        con, so = m.group(1).rstrip('_'), ' ' + m.group(2)
    phan = []
    for k, v in CONG_TRINH:
        if not con:
            break
        if con == k or con.startswith(k + '_') or con.endswith('_' + k):
            phan.append(v)
            con = (con.replace(k, '', 1)).strip('_')
    if not phan and con:
        phan.append(con.replace('_', ' ').title())
    ten = ' '.join(phan) + so
    if vung and ten:
        return '%s %s' % (ten.strip(), vung)
    return (ten or vung).strip()


# ==== NPC ====
# Tuxemon dat NPC bang "create_npc <slug>,x,y" trong su kien cua ban do; ten
# sprite tra trong db/npc/*.yaml. Nhung slug khong co trong db (nguoi trong nha
# dan) thi doan sprite theo tu khoa trong ten.
NPC_ROLE = [
    ('wife', 'homemaker', 'Cô Chủ Nhà'),
    ('husband', 'bob', 'Chú Chủ Nhà'),
    ('owner', 'shopkeeper', 'Chủ Tiệm'),
    ('waiter', 'shopassistant', 'Phục Vụ'),
    ('reader', 'disciple', 'Người Đọc Sách'),
    ('client', 'cooldude', 'Khách'),
    ('greeter', 'shopassistant', 'Người Đón Khách'),
    ('keeper', 'shopkeeper', 'Chủ Tiệm'),
    ('nurse', 'nurse', 'Y Tá'),
    ('knight', 'knight', 'Vệ Binh'),
    ('grunt', 'xerogrunt', 'Người Lạ Mặc Đồ Đen'),
]

# Ten + loi thoai tieng Viet cho nhung NPC hay gap. Y nghia bam theo loi goc
# ben Tuxemon, viet lai bang tieng Viet cho khop giong ke ca game.
NPC_VI = {
    'kay_wren': ('Giáo Sư', ['Cháu đến rồi à! Tuxemon của cháu trông khoẻ đấy.',
                             'Nhớ ghé phòng thí nghiệm nếu cần ta xem qua đội hình nhé.']),
    'callie_wren': ('Callie', ['Mẹ nói hôm nay cả thị trấn phải ra quảng trường đấy.']),
    'wife_wren': ('Bà Wren', ['Cháu vừa lỡ mất ông ấy rồi. Chắc ông ấy vào thị trấn.']),
    'taba_greeter': ('Jaime', ['Chào cậu! Nghe nói cậu vừa nhận Tuxemon, chúc mừng nhé!',
                               'Muốn đội mạnh lên thì cứ đi bắt thêm bạn đồng hành thôi.']),
    'tuxemart_keeper': ('Chủ Tiệm Tuxe Mart', ['Ghé xem hàng đi cậu, bóng và thuốc lúc nào cũng sẵn.']),
    'tabanurse': ('Y Tá Trạm Hồi Sức', ['Để tôi hồi phục cả đội cho cậu nhé. Xong rồi đấy!']),
    'happy_guy': ('Anh Vui Tính', ['Tôi mê đặt biệt danh cho Tuxemon lắm. Cậu muốn đặt cho con của cậu không?']),
    'shady_guy': ('Gã Khả Nghi', ['Này... có rắc rối gì dính tên cậu thì tôi lo được hết.']),
    'bob': ('Bob', ['Giá mà nhiều người ghé qua chào hỏi như cậu. À mà, xin chào!']),
    'timmy': ('Timmy', ['Bố tớ làm ở khu thi đấu đấy! Ngầu chứ hả?']),
    'liela': ('Liela', ['Quấy tôi lúc đang hái quả là phải đấu một trận đó nha!']),
    'allie': ('Allie', ['Cậu muốn gì? ... Thôi, chỗ này cậu không vào được đâu.']),
    'aeble': ('Aeble', ['Ta là người đứng đầu Omnichannel. Mọi thứ phát ra ngoài kia đều qua tay ta.']),
    'misa': ('Misa', ['Ngoài đường số 1 dạo này lắm người lạ, cẩn thận đấy.']),
    'kyle': ('Kyle', ['Muốn mạnh thì phải đánh nhiều vào, đứng đây nói chuyện hoài sao khá được.']),
    'christie': ('Christie', ['Bãi biển phía đông đẹp lắm, khi nào rảnh ghé chơi.']),
    'speck': ('Speck', ['Tôi nhặt vỏ sò suốt ngày, nghề của tôi mà.']),
    'marissa': ('Marissa', ['Nghe nói Omnichannel sắp thông báo gì đó nữa.']),
    'grace': ('Grace', ['Xin lỗi vì cảnh vừa rồi, Allie tính khí thất thường lắm.']),
    'tallon': ('Tallon', ['Đi đâu cũng được, đừng lảng vảng chỗ này là được.']),
}

# Nhung thu KHONG phai nguoi (cuc da, qua bong trang tri) — bo qua
# Ban goc dat ca DO VAT bang lenh create_npc (thung, bang hieu, tuong da, va ca
# mot con Volcoli lam thu cung). Khong co sprite di lai cho may thu do nen bo —
# de lai chi thanh o trong nhap nhay giua ban do.
NPC_SKIP_SPRITE = {'boulder', 'tuxeball_green', 'tuxeball_red', 'tuxeball_yellow', 'rock',
                   'box', 'sign', 'volcoli', 'drokoro', 'log', 'screen',
                   'p_one', 'p_two', 'p_three', 'p_four', 'p_five',
                   'statue_blue', 'statue_green', 'statue_grey', 'statue_orange', 'statue_red'}

# Cach cu xu tren ban do (js/engine/overworld.js doc truong 'ai'):
#   stand  dung yen sau quay, chi quay nguoi khi nguoi choi lai gan
#   watch  linh gac: dung mot cho, dao mat nhin quanh
#   wander di long vong quanh cho dung
#   patrol di di lai lai mot doan
NPC_AI = {
    'nurse': 'stand', 'shopkeeper': 'stand', 'shopassistant': 'stand', 'clerk': 'stand',
    'professor': 'stand', 'ceo': 'stand', 'omnichannelallie': 'watch', 'knight': 'watch',
    'xerogrunt': 'watch', 'grunt': 'watch', 'grunt_f': 'watch', 'boss': 'watch',
    'postboy': 'patrol', 'sailor': 'patrol', 'miner': 'patrol',
    'childactor': 'wander', 'kid': 'wander', 'kid2': 'wander', 'girl1': 'wander',
}

# Dan thuong de thay khi trung nhau: sprite, ten, cau noi
EXTRA_SPRITES = ['bob', 'homemaker', 'cooldude', 'fashionista', 'heroine', 'lady', 'florist',
                 'miner_blue', 'adventurer_green', 'heroine_brown', 'picnicker',
                 'riverboatcaptain', 'beachcomber', 'ninja',
                 'kid', 'kid2', 'childactor', 'girl1', 'disciple', 'rogue', 'scientist', 'chief']
EXTRA_NAMES = ['Chú Tám', 'Cô Bảy', 'Anh Hùng', 'Chị Mai', 'Ông Sáu', 'Bà Tư', 'Thằng Tí',
               'Bé Na', 'Chú Ba', 'Cô Lan', 'Anh Dũng', 'Chị Hạnh', 'Ông Chín', 'Bà Năm',
               'Cậu Khoa', 'Cô Thu', 'Chú Hai', 'Anh Phong', 'Chị Yến', 'Bé Bo']
EXTRA_LINES = [
    'Đường số 1 nhiều cỏ cao lắm, đi cẩn thận nhé.',
    'Tôi nuôi một con Tuxemon từ hồi nó còn bé xíu.',
    'Trạm hồi sức miễn phí mà nhiều người vẫn không biết đấy.',
    'Nghe đâu trong hang có con hiếm lắm, tôi chưa dám vào.',
    'Chợ hôm nay đông ghê, cậu ghé chưa?',
    'Ngày xưa tôi cũng mơ làm nhà huấn luyện đấy chứ.',
    'Cậu thấy mấy người mặc đồ đen quanh đây không? Tôi thấy sợ sợ.',
    'Bắt Tuxemon thì phải đánh cho nó yếu đã rồi mới ném bóng.',
    'Con nào hợp với mình thì nuôi lâu dài, đừng đổi liên tục.',
    'Trời đẹp thế này mà ngồi nhà thì phí.',
    'Ai đi ngang cũng khen thị trấn mình yên bình.',
    'Tôi già rồi, đi xa không nổi nữa. Cậu đi thay tôi nhé.',
    'Muốn qua vùng bên kia thì phải có huy hiệu đấy.',
    'Hồi trẻ tôi từng leo tới đỉnh núi đằng kia.',
    'Nhớ ghé cửa hàng mua thêm bóng trước khi đi xa.',
]

_npc_db = {}


def load_npc_db(root):
    """slug -> ten sprite, doc mot lan tu db/npc cua Tuxemon."""
    if _npc_db:
        return _npc_db
    d = os.path.join(root, 'mods/tuxemon/db/npc')
    if not os.path.isdir(d):
        return _npc_db
    # db/npc co HAI dinh dang: mot tep mot NPC ("slug: x" o dau dong) va mot tep
    # nhieu NPC dang danh sach ("- slug: x"). Truoc day chi doc duoc dang thu
    # nhat — 1053/1133 khai bao bi bo qua, nen ca thanh pho khong con NPC nao.
    for f in sorted(os.listdir(d)):
        if not f.endswith('.yaml'):
            continue
        txt = open(os.path.join(d, f), encoding='utf-8').read()
        for blk in re.split(r'\n(?=-? *slug: )', txt):
            m = re.search(r'^-? *slug: (\S+)', blk, re.M)
            sp = re.search(r'sprite_name: (\S+)', blk)
            if m and sp:
                _npc_db.setdefault(m.group(1), sp.group(1))
    return _npc_db


def build_npc(n, trong_nha=False):
    """Bo sung sprite + ten + loi thoai cho mot NPC; tra None neu bo qua."""
    slug = n['slug']
    sprite = _npc_db.get(slug)
    name, lines = NPC_VI.get(slug, (None, None))
    if not sprite:
        for key, spr, role in NPC_ROLE:
            if key in slug:
                sprite, name = spr, name or role
                break
    if not sprite or sprite in NPC_SKIP_SPRITE or slug in NPC_SKIP_SPRITE:
        return None
    if not name:
        for key, spr, role in NPC_ROLE:
            if key in slug or key in sprite:
                name = role
                break
    if not name:
        name = 'Người Dân'
    if not lines:
        lines = [DEFAULT_LINE.get(sprite, 'Chào cậu! Chúc cậu lên đường may mắn.')]
    out = {'x': n['x'], 'y': n['y'], 'dir': n['dir'], 'slug': slug,
           'sprite': sprite, 'name': n.get('ten') or name, 'lines': lines,
           # MAC DINH LA DUNG YEN. Truoc day mac dinh 'wander' nen 307/369 NPC
           # di lang thang — nguoi trong nha cung di vong quanh phong khach, ma
           # ngoai duong thi dong nguoi qua di lai lai roi tum vao mot cho.
           # Chi sprite nao ghi ro trong NPC_AI moi di.
           'ai': 'stand' if trong_nha else NPC_AI.get(sprite, 'stand')}
    # NPC doi Tuxemon / ban hang: dung mot cho cho de bam, khong di lang thang
    if n.get('trade'):
        out['trade'] = n['trade']
        out['ai'] = 'stand'
    if n.get('shop'):
        out['shop'] = n['shop']
        out['ai'] = 'stand'
    return out


def khac_nhau(npcs, trong_nha=False):
    """Cung mot ban do ma trung ca sprite lan ten thi doi cho khac di.

    Ban goc dat nhieu NPC cung slug kieu bob/bob2 nen qua ham build_npc deu ra
    'bob' + 'Nguoi Dan' + cung mot cau thoai — nhin nhu bi nhan ban. Doi theo
    thu tu on dinh (bam theo slug) de chay lai bao nhieu lan cung ra ket qua do.
    """
    da_co = set()
    for i, n in enumerate(npcs):
        key = (n['sprite'], n['name'])
        if key not in da_co:
            da_co.add(key)
            continue
        h = sum(ord(c) for c in n.get('slug', '')) + i
        for k in range(len(EXTRA_SPRITES)):
            spr = EXTRA_SPRITES[(h + k) % len(EXTRA_SPRITES)]
            ten = EXTRA_NAMES[(h + k) % len(EXTRA_NAMES)]
            if (spr, ten) not in da_co:
                n['sprite'], n['name'] = spr, ten
                n['lines'] = [EXTRA_LINES[(h + k) % len(EXTRA_LINES)]]
                # Doi sprite cho khoi trung nhau thi phai giu nguyen luat cu:
                # trong nha van dung yen, ngoai duong mac dinh cung dung yen.
                n['ai'] = 'stand' if trong_nha else NPC_AI.get(spr, 'stand')
                da_co.add((spr, ten))
                break
    for n in npcs:
        n.pop('slug', None)
    return npcs


# Loi mac dinh theo nghe nghiep, de moi kieu nguoi noi mot kieu
DEFAULT_LINE = {
    'nurse': 'Tuxemon mệt thì cứ ghé trạm hồi sức, miễn phí mà.',
    'knight': 'Đi đứng cẩn thận. Ta đang làm nhiệm vụ ở đây.',
    'xerogrunt': 'Nhìn gì? Biến đi chỗ khác.',
    'shopkeeper': 'Ghé xem hàng đi cậu!',
    'shopassistant': 'Cần gì cứ hỏi tôi nhé.',
    'professor': 'Nghiên cứu Tuxemon cả đời vẫn chưa hết chuyện để học.',
    'childactor': 'Lớn lên tớ cũng sẽ đi bắt Tuxemon!',
    'girl1': 'Hôm nay trời đẹp ghê.',
    'homemaker': 'Vào nhà nghỉ chân một lát cũng được mà.',
    'bob': 'Chào cậu! Thị trấn này yên bình lắm.',
    'heroine': 'Tôi cũng từng đi khắp nơi như cậu đấy.',
    'cooldude': 'Yo. Đội của cậu trông cũng được đấy.',
    'ninja': 'Ai hỏi gì thì bảo là không thấy tôi ở đây.',
    'ceo': 'Thời gian là tiền bạc, đừng làm phiền lâu.',
    'fashionista': 'Bộ đồ cậu mặc... cũng tạm được.',
    'disciple': 'Sách ở đây kể chuyện Tuxemon từ đời xưa lắm.',
    'beachcomber': 'Nhặt được cái vỏ sò đẹp là ngày đó vui rồi.',
    'postboy': 'Thư từ khắp vùng đều qua tay tôi đấy.',
    'omnichannelallie': 'Không phận sự thì đứng xa ra.',
}


# Chu THAT ghi tren bang hieu: ban goc goi "translated_dialog <ma>", noi dung
# nam trong tep dich. Dich san sang tieng Viet o day; ma nao chua dich thi bang
# do chi hien ten chung chung nhu truoc.
CHU_BANG = {
    'taba_town_sign': 'Thị Trấn Taba — chốn yên bình',
    'taba_town_sign_profhouse': 'Nhà của Giáo sư Tuxemon',
    'taba_town_sign_proflab': 'Phòng nghiên cứu của Giáo sư Tuxemon',
    'taba_town_sign_tuxecenter': 'Trạm Hồi Sức — chữa trị Tuxemon miễn phí',
    'taba_town_sign_tuxemart': 'Tuxemart — mua bán vật phẩm',
    'taba_house1_sign': 'Nhà ông bà Clawbrew',
    'taba_house2_sign': 'Thư Viện Di Sản',
    'taba_house3_sign': 'Nhà trọ Lá Trầm Tư',
    'taba_house4_sign': 'Quán rượu Hải Âu Đáng Kính',
    'xero_omnichannel_sign': 'Tổng hành dinh Omnichannel: Chúng tôi là An Toàn, '
                             'là Trật Tự, là Omnichannel',
    'xero_shaft1_sign': 'Tổng hành dinh Shaft — Ban Khai Khoáng',
    'xero_shaft2_sign': 'Tổng hành dinh Shaft — Ban Đối Ngoại',
}


# Ten cua doi tuong trong TMX la ten SU KIEN (Talk1, Reading2...) chu khong phai
# chu ghi tren bang. De nguyen thi trong game hien 'Bang ghi: "Talk1"'.
def ten_bang(raw):
    t = (raw or '').lower()
    if 'reading' in t or 'book' in t or 'shelf' in t:
        return 'Kệ sách'
    if 'sign' in t or 'talk' in t:
        return 'Bảng thông báo'
    if 'poster' in t:
        return 'Tấm áp phích'
    if 'tv' in t:
        return 'Cái TV'
    return 'Bảng hiệu'


def load_tsx(path, cache):
    """Doc mot tileset: tra (anh, so cot, so o)."""
    if path in cache:
        return cache[path]
    root = ET.parse(path).getroot()
    img = root.find('image')
    if img is None:
        cache[path] = None
        return None
    src = os.path.join(os.path.dirname(path), img.get('source'))
    # O nao trong tileset khai thuoc tinh 'surfable' la mat nuoc — ban goc dung
    # dung cai nay de biet dung truoc bo co cau ca duoc khong.
    nuoc = set()
    for t in root.findall('tile'):
        for pr in (t.find('properties') or []):
            if pr.get('name') in ('surfable', 'swimmable'):
                nuoc.add(int(t.get('id')))
    info = {
        'img': src,
        'cols': int(root.get('columns') or 0),
        'count': int(root.get('tilecount') or 0),
        'tw': int(root.get('tilewidth') or TILE),
        'th': int(root.get('tileheight') or TILE),
        'nuoc': nuoc,
    }
    cache[path] = info
    return info


def objs_tu_yaml(path):
    """Doc su kien ban do trong tep .yaml nam canh tep .tmx.

    Ban Tuxemon moi chuyen su kien ban do tu trong TMX ra mot tep YAML cung
    ten. Chi doc TMX thi 20 ban do trong nha (Vo Duong Da, Trung Tam Hoi Suc
    Hoa, Nha Tre Giay, phong ngu nha minh...) mat sach cong ra — vao la ket
    trong do khong bao gio ra duoc.

    Dung lai thanh <object> gia de dung chung duong parse voi TMX.
    """
    if not os.path.exists(path):
        return []
    d = doc_yaml(path) or {}
    # Su kien khong ghi toa do thi chi de chay lenh chung (tao NPC, bat nhac).
    # Bo nhung lenh AN THEO O dung tren no, khong thi cong va do roi deu bi
    # dinh het ve goc (0,0).
    THEO_O = ('transition_teleport', 'add_item')
    ra = []
    for ten, ev in (d.get('events') or {}).items():
        if not isinstance(ev, dict):
            continue
        co_o = ev.get('x') is not None and ev.get('y') is not None
        acts = [str(a) for a in (ev.get('actions') or [])]
        if not co_o:
            acts = [a for a in acts if not a.split(' ')[0] in THEO_O]
        o = ET.Element('object', {
            'name': str(ten),
            'x': str(int(ev.get('x') or 0) * TILE),
            'y': str(int(ev.get('y') or 0) * TILE),
            'width': str(int(ev.get('width') or 1) * TILE),
            'height': str(int(ev.get('height') or 1) * TILE),
        })
        pr = ET.SubElement(o, 'properties')
        for i, a in enumerate(acts, 1):
            ET.SubElement(pr, 'property', {'name': 'act%d' % i, 'value': a})
        for i, c in enumerate(ev.get('conditions') or [], 1):
            ET.SubElement(pr, 'property', {'name': 'cond%d' % i, 'value': str(c)})
        for i, b in enumerate(ev.get('behav') or [], 1):
            ET.SubElement(pr, 'property', {'name': 'behav%d' % i, 'value': str(b)})
        ra.append(o)
    return ra


def parse_map(path, tsx_cache):
    root = ET.parse(path).getroot()
    w = int(root.get('width'))
    h = int(root.get('height'))

    # TRONG NHA hay ngoai troi: ban goc ghi bang thuoc tinh <property
    # name="inside"> ngay o goc tep. KHONG dung duoc map_type/env cho viec nay
    # — ca chuc can nha deu de map_type="notype" nen quy ve 'grass', nhin vao
    # tuong nhu dang dung giua bai co.
    trong = False
    for props in root.findall('properties'):
        for p in props.findall('property'):
            if (p.get('name') or '') == 'inside':
                trong = (p.get('value') or '').strip().lower() == 'true'

    # tileset: firstgid -> thong tin.
    # Tiled cho phep hai kieu: tro toi tep .tsx rieng, HOAC khai bao thang trong
    # tep ban do voi the <image> con ben trong. Ban do trong nha cua Tuxemon
    # dung kieu thu hai, bo qua la ban do trong tron.
    base_dir = os.path.dirname(path)
    sets = []
    for ts in root.findall('tileset'):
        first = int(ts.get('firstgid'))
        src = ts.get('source')
        if src:
            info = load_tsx(os.path.join(base_dir, src), tsx_cache)
        else:
            img = ts.find('image')
            if img is None:
                continue
            info = {
                'img': os.path.normpath(os.path.join(base_dir, img.get('source'))),
                'cols': int(ts.get('columns') or 0),
                'count': int(ts.get('tilecount') or 0),
                'tw': int(ts.get('tilewidth') or TILE),
                'th': int(ts.get('tileheight') or TILE),
            }
        if info:
            sets.append((first, info))
    sets.sort(key=lambda x: x[0])

    layers = []
    above = None
    for layer in root.findall('layer'):
        data = layer.find('data')
        if data is None:
            continue
        nums = decode_layer(data, w, h)
        if not nums:
            continue
        name = (layer.get('name') or '').lower()
        if 'above' in name:
            above = nums
        else:
            layers.append(nums)

    # Mat nuoc: o nao (o bat ky lop nao) dung tile co thuoc tinh surfable.
    # Dung de biet nguoi choi co dang dung truoc bo nuoc de cau ca hay khong.
    water = [0] * (w * h)
    for nums in layers:
        for idx, gid in enumerate(nums):
            if not gid:
                continue
            for first, info in reversed(sets):
                if gid >= first:
                    if (gid - first) in (info.get('nuoc') or ()):
                        water[idx] = 1
                    break

    # va cham + su kien
    solid = [0] * (w * h)
    # O nuoc chan duong: ban goc coi thuoc tinh be mat gia tri 0 la KHONG DI
    # DUOC (collision_manager.get_collision_map). Thieu buoc nay thi nguoi choi
    # di thang ra giua bien.
    for idx, v in enumerate(water):
        if v:
            solid[idx] = 1
    warps, talks, encs, nhac = [], [], set(), [None]
    trades = []
    do_roi = []
    # Nen tran dau: ban goc dat bang "set_environment <slug>", ban do nao cung
    # co mot canh ban ngay va mot canh ban dem.
    moi_truong = [None, None]
    npcs = {}
    nhom = [((og.get('name') or '').lower(), list(og.findall('object')))
            for og in root.findall('objectgroup')]
    # Su kien nam trong tep .yaml ben canh (ban Tuxemon moi) — xem objs_tu_yaml
    them = objs_tu_yaml(os.path.splitext(path)[0] + '.yaml')
    if them:
        nhom.append(('events', them))
    for gname, objs in nhom:
        for obj in objs:
            ox = int(float(obj.get('x') or 0)) // TILE
            oy = int(float(obj.get('y') or 0)) // TILE
            ow = max(1, int(float(obj.get('width') or TILE)) // TILE)
            oh = max(1, int(float(obj.get('height') or TILE)) // TILE)
            props = {p.get('name'): p.get('value') for p in obj.findall('./properties/property')}
            acts = [v for k, v in props.items() if k.startswith('act')]

            if 'collision' in gname and not acts:
                for j in range(oy, min(h, oy + oh)):
                    for i in range(ox, min(w, ox + ow)):
                        solid[j * w + i] = 1
                continue

            # NPC: Tuxemon dat nguoi bang lenh "create_npc <slug>,<x>,<y>" trong
            # su kien, huong quay mat nam o "char_face <slug>,<dir>".
            for a in acts:
                for slug, nx, ny in re.findall(r'create_npc\s+([a-z0-9_]+)\s*,\s*(\d+)\s*,\s*(\d+)', a):
                    npcs.setdefault(slug, {'slug': slug, 'x': int(nx), 'y': int(ny), 'dir': 'down'})
            for a in acts:
                for slug, d in re.findall(r'char_face\s+([a-z0-9_]+)\s*,\s*(up|down|left|right)', a):
                    if slug in npcs:
                        npcs[slug]['dir'] = d

            # Do nhat duoc rai tren ban do: su kien co "add_item <mon>[,<so>]"
            # kem mot bien "not variable_set ..." de chi nhat duoc mot lan.
            # Chi lay mon co that trong bang vat pham cua game, va bo qua su
            # kien nao con keo theo danh nhau / doi chac / mo cua hang.
            if (any(a.startswith('add_item ') for a in acts)
                    and any(c.startswith('not variable_set') for c in conds_all(props))
                    and not any(a.split()[0] in ('start_battle', 'trading', 'open_shop',
                                                 'transition_teleport') for a in acts)):
                for a in acts:
                    m = re.match(r'add_item\s+([a-z0-9_]+)\s*(?:,\s*(-?\d+))?', a)
                    if not m or m.group(1) not in MON_CO_THAT:
                        continue
                    n_mon = int(m.group(2) or 1)
                    if n_mon <= 0:
                        continue
                    do_roi.append({'x': ox, 'y': oy, 'id': m.group(1), 'n': n_mon})

            # Cua hang: "set_economy <npc>,<ma gian hang>" cho biet nguoi nao
            # ban gi. Ghep vao dung NPC de bam vao la mo dung gian hang do.
            for a in acts:
                m = re.match(r'set_economy\s+([a-z0-9_]+)\s*,\s*([a-z0-9_]+)', a)
                if m and m.group(1) in npcs:
                    ma = re.sub(r'^spyder_', '', m.group(2))
                    for thu in (m.group(2), ma):
                        if not TIEM_CO_THAT or thu in TIEM_CO_THAT:
                            npcs[m.group(1)]['shop'] = thu
                            break

            # Doi Tuxemon voi NPC: ban goc ghi "trading <dua>,<nhan>" kem
            # behav "talk <npc>". Doi mot lan la xong (co bien hastraded).
            for a in acts:
                m = re.match(r'trading\s+([a-z0-9_]+)\s*,\s*([a-z0-9_]+)', a)
                if m:
                    ai = None
                    for b in (v for k, v in props.items() if k.startswith('behav')):
                        mb = re.match(r'talk\s+([a-z0-9_]+)', b)
                        if mb:
                            ai = mb.group(1)
                    # behav nam o su kien "Has X" ke ben, khong nam cung o day —
                    # lay npc tu ten su kien neu can
                    trades.append({'npc': ai, 'give': m.group(1), 'get': m.group(2),
                                   'ev': (obj.get('name') or '')})
                    break

            for a in acts:
                m = re.match(r'transition_teleport\s+player,\s*([^,]+),\s*(\d+),\s*(\d+)', a)
                if m:
                    warps.append({'x': ox, 'y': oy,
                                  # Ban Spyder tro toi 'spyder_<ten>' — cat tien to
                                  # de khop voi ten dia danh minh dang dung
                                  'to': re.sub(r'^spyder_', '',
                                               os.path.splitext(m.group(1).strip())[0]),
                                  'tx': int(m.group(2)), 'ty': int(m.group(3))})
                    break
                m = re.match(r'random_encounter\s+([a-z0-9_]+)', a)
                if m:
                    encs.add(m.group(1))
                m = re.match(r'set_environment\s+([a-z0-9_]+)', a)
                if m:
                    slug = m.group(1)
                    if slug.startswith('night_'):
                        moi_truong[1] = moi_truong[1] or slug
                    else:
                        moi_truong[0] = moi_truong[0] or slug
                m = re.match(r'play_music\s+([a-z0-9_]+)', a)
                if m and not nhac[0]:
                    nhac[0] = MUSIC_MAP.get(m.group(1), 'town')
                if a.startswith('translated_dialog') or a.startswith('dialog'):
                    # Lay ma dialog dau tien co ban dich tieng Viet
                    chu = None
                    for ma in re.findall(r'[a-z0-9_]+', a.split(None, 1)[-1] if ' ' in a else ''):
                        if ma in CHU_BANG:
                            chu = CHU_BANG[ma]
                            break
                    t = {'x': ox, 'y': oy, 'name': ten_bang(obj.get('name'))}
                    if chu:
                        t['text'] = chu
                    talks.append(t)
                    break

    # Su kien doi Tuxemon khong tu ghi ten NPC (behav "talk <npc>" nam o su kien
    # "Has X" ben canh), nhung TEN SU KIEN co ten rieng cua nguoi do:
    # "Talk Mieke - Will Trade Budaye". Doi chieu voi slug NPC tren ban do.
    for t in trades:
        if t['npc']:
            continue
        ten = re.sub(r'^talk\s+', '', (t['ev'] or '').lower()).split('-')[0].strip()
        for slug in npcs:
            if ten and ten.split()[0] in slug:
                t['npc'] = slug
                npcs[slug]['trade'] = {'give': t['give'], 'get': t['get']}
                # Ten rieng lay luon tu ten su kien ("Talk Mieke - ...") — khong
                # thi ca bon nguoi doi chac deu ten "Nguoi Dan"
                npcs[slug]['ten'] = ten.split()[0].capitalize()
                break

    # Trong nha thi ai cung dung yen — phong be, di lai la dam vao nhau
    trong_nha = (moi_truong[0] or '') == 'interior'
    ds = khac_nhau([n for n in (build_npc(n, trong_nha) for n in npcs.values()) if n], trong_nha)
    return {'w': w, 'h': h, 'sets': sets, 'layers': layers, 'above': above,
            'solid': solid, 'water': water, 'warps': warps, 'talks': talks,
            'trades': trades, 'encs': sorted(encs),
            # Do roi phai nam tren o DI DUOC. Vai su kien add_item dat trong
            # tuong (nguoi trong nha dua tan tay, khong phai nhat duoi dat) —
            # de lai thi mon do khong bao gio cham toi duoc.
            'items': [d for d in gop_do(do_roi)
                      if 0 <= d['x'] < w and 0 <= d['y'] < h and not solid[d['y'] * w + d['x']]],
            'music': nhac[0],          # None = ban do khong tu goi nhac
            'env': moi_truong[0], 'envNight': moi_truong[1], 'trong': trong,
            'npcs': xep_cho(ds, solid, warps, w, h)}


def conds_all(props):
    return [v for k, v in props.items() if k.startswith('cond')]


def gop_do(ds):
    """Mot o co nhieu su kien cho cung mon -> chi giu mot."""
    thay, out = set(), []
    for d in ds:
        k = (d['x'], d['y'], d['id'])
        if k in thay:
            continue
        thay.add(k)
        out.append(d)
    return out


# Ma vat pham game dang co — nap tu js/data/items.js (mkitems.py chay truoc)
MON_CO_THAT = set()
TIEM_CO_THAT = set()


def nap_mon():
    p = 'js/data/items.js'
    if not os.path.exists(p):
        return set()
    return set(re.findall(r'^  ([a-z_0-9]+): \{', open(p, encoding='utf-8').read(), re.M))


def nap_tiem():
    """Ma gian hang da sinh duoc, doc tu js/data/shops.js.

    Vai gian hang ben goc chi ban TUXEMON (tiem thu cung Hoa) — game nay khong
    ban sinh vat nen mkitems.py bo han, con NPC thi van tro toi. Khong loc thi
    bam vao chu tiem la mo ra man cua hang trong tron.
    """
    p = 'js/data/shops.js'
    if not os.path.exists(p):
        return set()
    return set(re.findall(r'^  "([a-z_0-9]+)":', open(p, encoding='utf-8').read(), re.M))


def chon_tep(mdir, slug):
    """Duong dan tep .tmx cho mot dia danh: ban Spyder neu dong dan hon."""
    ung = [os.path.join(mdir, x) for x in (slug + '.tmx', 'spyder_' + slug + '.tmx')]
    ung = [x for x in ung if os.path.exists(x)]
    if not ung:
        return None
    def dong(p):
        return open(p, encoding='utf-8').read().count('create_npc')
    return max(ung, key=dong)


def xep_cho(npcs, solid, warps, w, h):
    """Don lai cho dung cua NPC cho khoi tu mot dong chan loi.

    Ban goc goi create_npc cho CUNG MOT O nhieu lan (moi canh truyen mot phien
    ban NPC khac nhau) va nguoi choi chi bao gio thay mot trong so do. Minh do
    het ra ban do cung luc nen thanh dam dong dung chet cho, co khi chan ngay
    cua ngo. O day: moi o chi mot nguoi, khong ai dung o cho hep (o trong co
    hai loi ra tro xuong) hay tren cong dich chuyen.
    """
    def trong(x, y):
        return 0 <= x < w and 0 <= y < h and not solid[y * w + x]

    def loi_ra(x, y):
        return sum(1 for dx, dy in ((0, 1), (0, -1), (1, 0), (-1, 0)) if trong(x + dx, y + dy))

    cong = {(t['x'], t['y']) for t in warps}

    def di_khap(chan):
        """Loang tu o trong dau tien, tra ve tap o di toi duoc."""
        bat_dau = next(((x, y) for y in range(h) for x in range(w)
                        if trong(x, y) and (x, y) not in chan), None)
        if not bat_dau:
            return set()
        tham, hang = {bat_dau}, [bat_dau]
        while hang:
            x, y = hang.pop()
            for dx, dy in ((0, 1), (0, -1), (1, 0), (-1, 0)):
                o = (x + dx, y + dy)
                if o in tham or o in chan or not trong(*o):
                    continue
                tham.add(o)
                hang.append(o)
        return tham

    # Ban do khi chua co ai dung: day la chuan de so
    goc = di_khap(set())

    def chan_duong(chan, o):
        """Dat nguoi vao o nay co lam mot vung nao do thanh cut khong?"""
        thu = chan | {o}
        return len(di_khap(thu)) < len(goc - thu)

    def ke_ben(chan, o):
        """Dem so nguoi da dung ngay canh o nay."""
        return sum(1 for dx, dy in ((0, 1), (0, -1), (1, 0), (-1, 0))
                   if (o[0] + dx, o[1] + dy) in chan)

    da_co = set()
    ket = []
    for n in npcs:
        x, y = n['x'], n['y']
        hop = (trong(x, y) and (x, y) not in da_co and (x, y) not in cong
               and loi_ra(x, y) >= 3 and ke_ben(da_co, (x, y)) == 0
               and not chan_duong(da_co, (x, y)))
        if not hop:
            moi = None
            for r in range(1, 5):
                for dx in range(-r, r + 1):
                    for dy in range(-r, r + 1):
                        o = (x + dx, y + dy)
                        if o in da_co or o in cong or not trong(*o) or loi_ra(*o) < 3:
                            continue
                        if ke_ben(da_co, o) or chan_duong(da_co, o):
                            continue
                        moi = o
                        break
                    if moi:
                        break
                if moi:
                    break
            if not moi:
                continue          # khong con cho tu te thi thoi, bo con nay
            n['x'], n['y'] = moi
        da_co.add((n['x'], n['y']))
        ket.append(n)
    return ket


def decode_layer(data, w, h):
    """Doc mot lop o: Tiled luu csv HOAC base64 (co the nen zlib/gzip)."""
    enc = (data.get('encoding') or '').lower()
    if enc == 'csv':
        return [int(x) for x in data.text.replace('\n', '').split(',') if x.strip()]
    if enc == 'base64':
        import base64
        import struct
        raw = base64.b64decode((data.text or '').strip())
        comp = (data.get('compression') or '').lower()
        if comp == 'zlib':
            import zlib
            raw = zlib.decompress(raw)
        elif comp == 'gzip':
            import gzip
            raw = gzip.decompress(raw)
        elif comp:
            return []                       # zstd: khong ho tro
        n = w * h
        # GID 32 bit little-endian; 3 bit cao la co lat anh, bo di
        return [g & 0x1FFFFFFF for g in struct.unpack('<%dI' % n, raw[:4 * n])]
    return []


def build_atlas(m, out_png):
    """Gom cac o that su dung vao mot atlas, tra (bang doi gid, so cot)."""
    from PIL import Image
    used = set()
    for lay in m['layers'] + ([m['above']] if m['above'] else []):
        used.update(g for g in lay if g > 0)
    used = sorted(used)

    remap = {}
    tiles = []
    for gid in used:
        # tileset nao chua gid nay
        base, info = None, None
        for first, nfo in m['sets']:
            if gid >= first:
                base, info = first, nfo
            else:
                break
        if not info or not info['cols']:
            continue
        idx = gid - base
        if idx >= info['count']:
            continue
        sx = (idx % info['cols']) * info['tw']
        sy = (idx // info['cols']) * info['th']
        remap[gid] = len(tiles)
        tiles.append((info['img'], sx, sy, info['tw'], info['th']))

    cols = min(MAX_ATLAS_COLS, max(1, len(tiles)))
    rows = (len(tiles) + cols - 1) // cols
    atlas = Image.new('RGBA', (cols * TILE, max(1, rows) * TILE), (0, 0, 0, 0))
    cache = {}
    for i, (img, sx, sy, tw, th) in enumerate(tiles):
        if img not in cache:
            cache[img] = Image.open(img).convert('RGBA')
        src = cache[img]
        cell = src.crop((sx, sy, sx + tw, sy + th))
        if (tw, th) != (TILE, TILE):
            cell = cell.resize((TILE, TILE), Image.NEAREST)
        atlas.paste(cell, ((i % cols) * TILE, (i // cols) * TILE))
    os.makedirs(os.path.dirname(out_png), exist_ok=True)
    atlas.save(out_png, optimize=True)
    return remap, cols


def js(v):
    return json.dumps(v, ensure_ascii=False)


def cho_cong_ria_bac(m):
    """Tim mot o trong o ria bac mot ban do de cam them cong sang khu khac.

    Ba dieu kien:
      - o do va bon o quanh no deu trong (buoc vao roi con di tiep duoc);
      - khong dam vao cong / NPC / bang hieu san co — ke ca cong vua cam o
        lan goi truoc, nen goi nhieu lan la duoc nhieu cho khac nhau;
      - PHAI nam trong vung di lai chinh cua ban do. Thieu cai nay thi cong de
        roi vao mot goc bi cay va vach da vay kin — nguoi choi khong bao gio di
        toi duoc, ma test cung khong bat ra vi ban do van "co cong".
    """
    w, h = m['w'], m['h']
    solid = m['solid']

    # Vung di lai lon nhat
    da = [False] * (w * h)
    lon = set()
    for y0 in range(h):
        for x0 in range(w):
            if da[y0 * w + x0] or solid[y0 * w + x0]:
                continue
            vung, ngan = set(), [(x0, y0)]
            da[y0 * w + x0] = True
            while ngan:
                x, y = ngan.pop()
                vung.add((x, y))
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if not (0 <= nx < w and 0 <= ny < h):
                        continue
                    if solid[ny * w + nx] or da[ny * w + nx]:
                        continue
                    da[ny * w + nx] = True
                    ngan.append((nx, ny))
            if len(vung) > len(lon):
                lon = vung

    ban = {(n['x'], n['y']) for n in m['npcs']}
    ban |= {(t['x'], t['y']) for t in m['talks']}
    for wp in m['warps']:
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                ban.add((wp['x'] + dx, wp['y'] + dy))
    # Cang gan ria bac cang tot, roi mai den cang gan giua cang tot
    # Phai co cho cho DAI DUONG MON ba o rong dan toi cong (ve_loi_vao): cong
    # nhet vao khe hep giua hai hang rao thi duong ve ra mot vet mong dinh.
    ung = []
    for y in range(1, h // 2):
        for x in range(3, w - 3):
            o = [(x, y), (x, y + 1), (x - 1, y), (x + 1, y), (x, y - 1)]
            o += [(x + dx, y + dy) for dy in range(4) for dx in (-1, 1)]
            if any(p in ban for p in o):
                continue
            if any(p not in lon for p in o):
                continue
            ung.append((y, abs(x - w // 2), x))
    if not ung:
        return None
    ung.sort()
    return ung[0][2], ung[0][0]


def o_trong(m, can, tranh=()):
    """Tim `can` o dung duoc, roi deu trong vung di lai lon nhat cua ban do.

    Dung de cam NPC vao ban do co san. Ba dieu kien: o do trong, khong dam vao
    cong / NPC / bang hieu san co, va PHAI nam trong vung di lai chinh — cam vao
    mot goc bi cay vay kin thi nguoi choi khong bao gio gap.
    """
    w, h, solid = m['w'], m['h'], m['solid']
    da = [False] * (w * h)
    lon = set()
    for y0 in range(h):
        for x0 in range(w):
            if da[y0 * w + x0] or solid[y0 * w + x0]:
                continue
            vung, ngan = set(), [(x0, y0)]
            da[y0 * w + x0] = True
            while ngan:
                x, y = ngan.pop()
                vung.add((x, y))
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if not (0 <= nx < w and 0 <= ny < h):
                        continue
                    if solid[ny * w + nx] or da[ny * w + nx]:
                        continue
                    da[ny * w + nx] = True
                    ngan.append((nx, ny))
            if len(vung) > len(lon):
                lon = vung

    ban = {(n['x'], n['y']) for n in m.get('npcs') or []}
    ban |= {(t['x'], t['y']) for t in m.get('talks') or []}
    ban |= set(tranh)
    for wp in m.get('warps') or []:
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                ban.add((wp['x'] + dx, wp['y'] + dy))
    sp = m.get('spawn')
    if sp:
        ban.add((sp['x'], sp['y']))

    ung = sorted(lon - ban)
    ra = []
    for x, y in ung:
        # Cach nhau it nhat 3 o: dung sat nhau thi bam A trung mot nguoi khac
        if any(abs(x - ax) + abs(y - ay) < 3 for ax, ay in ra):
            continue
        # Chua o trong ngay ben canh de nguoi choi con dung ma bam
        if not any((x + dx, y + dy) in lon for dx, dy in ((0, 1), (0, -1), (1, 0), (-1, 0))):
            continue
        ra.append((x, y))
        if len(ra) >= can:
            break
    return ra


def dat_trainer(out_maps):
    """Cam moi huan luyen vien thanh mot NPC tren ban do khu vuc cua ho."""
    import mkworld
    theo_vung = {}
    for row in mkworld.TRAINERS_META:
        tid, sprite, ten, _kind, zone, _n, _tien, intro = row[:8]
        theo_vung.setdefault(zone, []).append((tid, sprite, ten, intro))
    n = 0
    for zone, ds in theo_vung.items():
        m = out_maps.get(zone)
        if not m:
            print('BO QUA huan luyen vien o', zone, '- chua co ban do')
            continue
        cho = o_trong(m, len(ds))
        if len(cho) < len(ds):
            print('CHI CAM DUOC %d/%d huan luyen vien o %s' % (len(cho), len(ds), zone))
        for (tid, sprite, ten, intro), (x, y) in zip(ds, cho):
            m['npcs'].append({'x': x, 'y': y, 'dir': 'down', 'sprite': sprite,
                              'name': ten, 'ai': 'stand', 'trainerId': tid,
                              'lines': [intro]})
            n += 1
    return n


def ve_loi_vao(m, x, y, dai=4):
    """Ve mot doan duong mon dan tu o cong xuong long ban do.

    Cong sang khu khac cam vao ria bac may ban do goc chi la mot o co giua hang
    rao — nhin nhu ai thoc thung hang rao. Ban goc loi re nao cung co duong mon
    dan toi, nen ke them mot doan cho khop.

    Ban do da nuong atlas roi nen phai doi o goc sang chi so trong atlas bang
    bang `_remap` giu tam luc nuong. O nao ban do do KHONG dung toi thi khong
    co trong atlas — bo qua chu khong ve o rac.
    """
    remap = m.get('_remap')
    ts = m.get('_ts') or {}
    if not remap or 'core_outdoor' not in (ts.get('img') or ''):
        return 0
    g0 = m.get('_g0') or 1
    # Duong RONG BA O: bo o autotile chi co vien trai / giua / vien phai, hai o
    # thi thanh hai cai vien dan vao nhau, ra mot vet mong dinh chu khong ra
    # duong. Ban goc cung khong co doan duong nao hep hon ba o.
    trong_bd = lambda px, py: (0 <= px < m['w'] and 0 <= py < m['h']
                               and not m['solid'][py * m['w'] + px])
    o = {(x + dx, y + d) for d in range(dai) for dx in (-1, 0, 1)}
    o = {c for c in o if trong_bd(*c)}
    trong = lambda px, py: (px, py) in o
    n = 0
    for px, py in o:
        chi = remap.get(g0 + nengoc.o_duong(px, py, trong))
        if chi is None:
            continue
        m['layers'][0][py * m['w'] + px] = chi
        n += 1
    return n


def main():
    # Pack CraftPix giai nen o dau (khong bat buoc — thieu thi bo qua may
    # dia diem do, phan con lai van dung binh thuong).
    global CRAFTPIX_DIR
    CRAFTPIX_DIR = sys.argv[2] if len(sys.argv) > 2 else '/tmp/craftpix'
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    root = sys.argv[1]
    mdir = os.path.join(root, 'mods/tuxemon/maps')
    if not os.path.isdir(mdir):
        raise SystemExit('Khong thay %s' % mdir)

    load_npc_db(root)
    global MON_CO_THAT, TIEM_CO_THAT
    MON_CO_THAT = nap_mon()
    TIEM_CO_THAT = nap_tiem()
    tsx_cache = {}
    want = pick_maps(mdir)
    names = {s: vi_name(s) for s in want}
    out_maps = {}
    for slug in want:
        # Tuxemon co HAI bo ban do cho cung mot dia danh: ban goc doi dau
        # (flower_city.tmx) va ban cua chien dich Spyder (spyder_flower_city.tmx).
        # Ban Spyder moi la ban dang duoc dung, dong dan hon han — vai cho ban
        # cu khong con mot NPC nao. Uu tien ban nao dat nhieu nguoi hon.
        p = chon_tep(mdir, slug)
        if not p:
            print('BO QUA (khong co tep):', slug)
            continue
        m = parse_map(p, tsx_cache)
        remap, cols = build_atlas(m, 'assets/maps/%s.png' % slug)
        conv = lambda lay: [remap.get(g, -1) if g > 0 else -1 for g in lay]
        # Giu tam bang doi o goc -> o trong atlas: ve_loi_vao() con ve them
        # duong mon vao ban do NAY sau khi da nuong atlas. Xoa truoc khi ghi ra.
        goc_ts = (m['sets'][0] if m.get('sets') else (0, {}))
        out_maps[slug] = {
            '_remap': remap, '_g0': goc_ts[0], '_ts': goc_ts[1],
            'name': names[slug], 'w': m['w'], 'h': m['h'], 'cols': cols,
            'layers': [conv(l) for l in m['layers']],
            'above': conv(m['above']) if m['above'] else None,
            'solid': m['solid'],
            'water': m['water'],
            'warps': [w for w in m['warps'] if w['to'] in want],
            'talks': m['talks'],
            'npcs': m['npcs'],
            'items': m['items'],
            'encs': m['encs'],
            'music': m['music'],
            'env': m.get('env'), 'envNight': m.get('envNight'),
            'trong': m.get('trong'),
        }

    # Ban do nao khong tu goi play_music thi lay nhac cua ban do dan vao no —
    # di xuyen cua nghe nhac khong doi, dung nhu cam giac ben ban goc. Truoc day
    # cho nao thieu deu do het ve 'town', 33/40 ban do keu chung mot ban.
    for slug, ep in MUSIC_RIENG.items():
        if slug in out_maps:
            out_maps[slug]['music'] = ep
    for _ in range(6):                       # lan truyen dan qua cac tang cua
        for slug, m in out_maps.items():
            if m['music']:
                continue
            for cha, mc in out_maps.items():
                if mc['music'] and any(w['to'] == slug for w in mc['warps']):
                    m['music'] = mc['music']
                    break
    for m in out_maps.values():
        m['music'] = m['music'] or 'town'

    # Vai cong ben ban goc tro ra NGOAI ban do dich (ban do do lam do dang, vi du
    # leather_town -> flower_city o o 59,0 trong khi ban do chi rong 40). De nguyen
    # thi buoc qua cong la roi ra hu khong, nen keo ve trong bien; luc vao map
    # engine con tu tim o trong gan do (freeSpot).
    lech = []
    for slug, m in out_maps.items():
        for w in m['warps']:
            d = out_maps.get(w['to'])
            if not d or w.get('tx') is None:
                continue
            tx = max(0, min(d['w'] - 1, w['tx']))
            ty = max(0, min(d['h'] - 1, w['ty']))
            if (tx, ty) != (w['tx'], w['ty']):
                lech.append('%s -> %s (%d,%d)' % (slug, w['to'], w['tx'], w['ty']))
                w['tx'], w['ty'] = tx, ty
    if lech:
        print('Kéo %d cổng lệch về trong bản đồ: %s' % (len(lech), ', '.join(sorted(set(lech)))))

    # Pho Kim Long: bon toa nha cong cong, noi thang ra THI TRAN. Cho dat
    # cong tim bang cho_cong_ria_bac() chu khong cam cung mot toa do: ban do
    # goc la cua Tuxemon, cam bua mot o la de roi vao goc bi cay va vach da
    # vay kin, nguoi choi khong bao gio di toi duoc.
    taba = out_maps.get('taba_town')
    cho_kp = cho_cong_ria_bac(taba) if taba else None
    kp0 = khupho.them_vao(out_maps, root, tsx_cache, load_tsx,
                          'taba_town', cho_kp) if cho_kp else None
    if cho_kp:
        ve_loi_vao(taba, cho_kp[0], cho_kp[1])
    if kp0:
        remapP, colsP = build_atlas(kp0, 'assets/maps/%s.png' % khupho.SLUG)
        convP = lambda lay, r=remapP: [r.get(g, -1) if g > 0 else -1 for g in lay]
        kp0['name'] = khupho.TEN
        kp0['cols'] = colsP
        kp0['layers'] = [convP(l) for l in kp0['layers']]
        kp0['above'] = convP(kp0['above']) if kp0['above'] else None
        out_maps[khupho.SLUG] = kp0
        want.append(khupho.SLUG)

        # Bang Duong cung cam cong ra THI TRAN, o mot cho khac. Truoc kia no
        # nap sau Khu Dan Cu; khu do bo roi nen phai co duong vao rieng.
        cho_bd = cho_cong_ria_bac(taba)
        bd = bangduong.them_vao(out_maps, root, tsx_cache, load_tsx,
                                'taba_town', cho_bd) if cho_bd else None
        if cho_bd:
            ve_loi_vao(taba, cho_bd[0], cho_bd[1])
        if bd:
            remap2, cols2 = build_atlas(bd, 'assets/maps/%s.png' % bangduong.SLUG)
            conv2 = lambda lay: [remap2.get(g, -1) if g > 0 else -1 for g in lay]
            bd['name'] = bangduong.TEN
            bd['cols'] = cols2
            bd['layers'] = [conv2(l) for l in bd['layers']]
            bd['above'] = conv2(bd['above']) if bd['above'] else None
            out_maps[bangduong.SLUG] = bd
            want.append(bangduong.SLUG)

        # Ba gian trong ba toa nha cua bang
        for slug, gian in bangduong.dung_trong(
                phongtrong, parse_map, chon_tep, mdir, tsx_cache).items():
            remapb, colsb = build_atlas(gian, 'assets/maps/%s.png' % slug)
            convb = lambda lay, r=remapb: [r.get(g, -1) if g > 0 else -1 for g in lay]
            gian['name'] = gian.pop('_ten')
            gian['cols'] = colsb
            gian['layers'] = [convb(l) for l in gian['layers']]
            gian['above'] = None
            out_maps[slug] = gian
            want.append(slug)

    # Dia diem dung tu pack CraftPix (chapel, guild hall, ruined temple, home).
    # Chi nuong ATLAS vao kho, khong chep tep goc cua pack — xem tools/craftpix.py.
    for slug, cp in craftpix.them_vao(out_maps, CRAFTPIX_DIR).items():
        remap4, cols4 = build_atlas(cp, 'assets/maps/%s.png' % slug)
        conv4 = lambda lay, r=remap4: [r.get(g, -1) if g > 0 else -1 for g in lay]
        cp['cols'] = cols4
        cp['above'] = conv4(cp['above']) if cp['above'] else None
        cp['layers'] = [conv4(l) for l in cp['layers']]
        cp.pop('thieu', None)
        out_maps[slug] = cp
        want.append(slug)

    # Sanh bac: tu xep tay tu tileset casino cua Jephed
    for slug, cs in casino.them_vao(out_maps, CRAFTPIX_DIR).items():
        remap5, cols5 = build_atlas(cs, 'assets/maps/%s.png' % slug)
        conv5 = lambda lay, r=remap5: [r.get(g, -1) if g > 0 else -1 for g in lay]
        cs['cols'] = cols5
        cs['above'] = conv5(cs['above']) if cs['above'] else None
        cs['layers'] = [conv5(l) for l in cs['layers']]
        out_maps[slug] = cs
        want.append(slug)

    # ==== Noi bon dia diem vao dung cua cua no tren Khu Dan Cu ====
    # Truoc day cong ra cua ca bon deu tro ve MOT o chung giua dong, con
    # engine/diadiem.js thi viet de dich den thanh cho nguoi choi dang dung luc
    # bam Menu. Ket qua: buoc ra khoi Sanh Bac luc thi ra giua dong, luc thi ra
    # canh nha khac. Gio moi cho co cua rieng, ra la dung ngay truoc cua do.
    kp = out_maps.get(khupho.SLUG)
    if kp:
        n_cua = 0
        for w in kp['warps']:
            dd = out_maps.get(w['to'])
            if not dd or w['to'] not in [t[0] for t in khupho.TOA]:
                continue
            # Vao: dat chan ngay o spawn ma generator cua dia diem da chon
            sp = dd.get('spawn') or {'x': 1, 'y': 1}
            w['tx'], w['ty'] = sp['x'], sp['y']
            # Ra: cong trong dia diem tro ve bac them ngay duoi o cua
            bx, by = khupho.bac_them(w['x'], w['y'])
            for wo in dd['warps']:
                if wo.get('to') == khupho.SLUG:
                    wo['to'] = khupho.SLUG
                    wo['tx'], wo['ty'] = bx, by
            n_cua += 1
        print('OK: %d địa điểm có nhà riêng trên %s' % (n_cua, khupho.SLUG))


    # ==== Y ta trong tram hoi suc chua benh that ====
    # Truoc day muon hoi phuc thi bam mot cai nut o man chinh, dung o dau cung
    # bam duoc. Gio phai di den tram: y ta trong tram co co `chuaBenh`, bam A
    # truoc mat co moi hoi.
    n_yta = 0
    for slug, m in out_maps.items():
        if not (slug == 'healing_center' or slug.endswith('_center')):
            continue
        for n in m.get('npcs') or []:
            if n.get('sprite') == 'nurse':
                n['chuaBenh'] = True
                n_yta += 1
    print('OK: %d y tá chữa bệnh tại chỗ' % n_yta)

    # ==== Huan luyen vien dung ngay tren ban do ====
    n_hlv = dat_trainer(out_maps)
    print('OK: %d huấn luyện viên đứng trên bản đồ' % n_hlv)

    for m in out_maps.values():
        for k in ('_remap', '_g0', '_ts'):
            m.pop(k, None)

    write_js(out_maps, want)
    n = write_encounters(root, out_maps)
    print('OK: %d bảng gặp Tuxemon hoang' % n)
    print('OK: %d bản đồ' % len(out_maps))
    for k, v in out_maps.items():
        print('  %-22s %dx%d · %d lớp · %d cổng · %d bảng'
              % (k, v['w'], v['h'], len(v['layers']), len(v['warps']), len(v['talks'])))


# Ban nhac ban goc goi -> ban nhac game co san (xem tools/mksounds.py)
# Ban do ban goc khong ghi nhac nhung ro rang thuoc mot khu rieng
MUSIC_RIENG = {
    'taba_ba_foyer': 'arena', 'taba_ba_main': 'arena',
    'taba_ba_passageway_1': 'arena', 'taba_ba_passageway_2': 'arena',
    'taba_ba_passageway_3': 'arena', 'taba_ba_passageway_4': 'arena',
    'taba_ba_stairwell_1': 'arena',
    'leather_shaft1': 'docks', 'leather_shaft2': 'docks',
}

MUSIC_MAP = {
    'music_chibi_ninja': 'field',
    'music_mystic_island': 'grove',
    'music_cathedral_theme': 'town',
    'music_town_theme': 'town',
    'music_home': 'town',
    'music_the_wild_places': 'field',
    'music_the_princess': 'arena',       # khu thi dau Taba
    'music_city_park': 'park',           # cong vien thanh pho
    'music_omnichannel': 'docks',        # tru so Omnichannel
}


# Ban do cua chinh tac gia de thu nghiem, khong phai dat trong game
BO_QUA_MAP = {'test_map', 'debug', 'template'}


def pick_maps(mdir):
    """Di theo cong dich chuyen tu diem xuat phat, lay toi da MAX_MAPS ban do.

    Phai di bang DUNG TEP se dung (chon_tep, tuc ban Spyder neu dong dan hon) —
    di bang ban cu thi lac sang mot the gioi khac, bo lo han may thi tran ma
    chien dich that su dan toi.
    """
    import collections
    order, seen = [], {START}
    q = collections.deque([START])
    while q and len(order) < MAX_MAPS:
        cur = q.popleft()
        p = chon_tep(mdir, cur)
        if not p or cur in BO_QUA_MAP:
            continue
        order.append(cur)
        src = open(p, encoding='utf-8', errors='ignore').read()
        for m in re.finditer(r'transition_teleport\s+player,\s*([^,]+)\.tmx', src):
            nxt = re.sub(r'^spyder_', '', m.group(1).strip())
            if nxt in seen or nxt in BO_QUA_MAP:
                continue
            if chon_tep(mdir, nxt):
                seen.add(nxt)
                q.append(nxt)
    return order


# Bang gap Tuxemon hoang: ban do goc goi 'random_encounter <slug>', bang nam o
# db/encounter/<slug>.yaml. Truoc day game tu doan theo dia hinh nen ra danh
# sach khong giong ban goc; nay lay dung bang cua ho.
def write_encounters(root, maps):
    enc_dir = os.path.join(root, 'mods/tuxemon/db/encounter')
    if not os.path.isdir(enc_dir):
        return 0
    dex = doc_dex()
    bang = {}
    bo_qua = []
    for slug, m in maps.items():
        # Thi tran, ben cang, trong nha: KHONG co quai. Ban goc rai co cao ngay
        # giua thi tran nen di mua thuoc cung dinh tran — cho co nguoi o thi
        # khong the la cho Tuxemon hoang nhay ra.
        if not vungdat.la_hoang(slug):
            if m.get('encs'):
                bo_qua.append(slug)
            continue
        rows = []
        for e in chon_bang(slug, m.get('encs') or []):
            p = os.path.join(enc_dir, e + '.yaml')
            if not os.path.exists(p):
                continue
            d = doc_yaml(p)
            for mon in d.get('monsters') or []:
                mid = dex.get(mon.get('monster'))
                if not mid:
                    continue
                lo, hi = (mon.get('level_range') or [2, 5])[:2]
                rate = float(mon.get('encounter_rate') or 1)
                rows.append((mid, rate, int(lo), int(hi)))
        if rows:
            # Gop cac dong trung loai: cong ti le, lay khoang cap rong nhat
            gop = {}
            for mid, rate, lo, hi in rows:
                cu = gop.get(mid)
                gop[mid] = (rate + cu[0], min(lo, cu[1]), max(hi, cu[2])) if cu else (rate, lo, hi)
            bang[slug] = sorted((mid, r, lo, hi) for mid, (r, lo, hi) in gop.items())

    out = ["// TuxeWorld H5 | data/encounters.js | Bảng gặp Tuxemon hoang — TỰ SINH TỪ tools/mktmx.py",
           '// Nguồn: db/encounter của Tuxemon, lấy theo đúng lệnh random_encounter ghi',
           '// trong từng bản đồ. w = trọng số, min/max = khoảng cấp.', '',
           'export const ENCOUNTERS = {']
    for slug, rows in bang.items():
        out.append('  %s: [%s],' % (slug, ', '.join(
            '{ sp: %d, w: %s, min: %d, max: %d }' % (mid, fmtnum(round(r * 10, 1)), lo, hi)
            for mid, r, lo, hi in rows)))
    out.append('};')
    open('js/data/encounters.js', 'w', encoding='utf-8').write('\n'.join(out) + '\n')
    if bo_qua:
        print('Bỏ bảng gặp ở %d chỗ có người ở: %s'
              % (len(bo_qua), ', '.join(sorted(bo_qua))))
    return len(bang)


# Mot ban do co the goi nhieu bang gap: bang chinh, roi bang "hiem"/"moi" chi
# mo khi cot truyen cho phep. Minh khong mo phong dieu kien do nen chi lay bang
# CHINH, khong thi ngay thi tran dau game da gap con cap 50.
def chon_bang(map_slug, encs):
    if not encs:
        return []
    rieng = [e for e in encs if map_slug in e or e in map_slug]
    if rieng:
        return rieng[:1]
    if 'default_encounter' in encs:
        return ['default_encounter']
    return encs[:1]


def doc_yaml(path):
    """Doc mot tep yaml don gian (khong keo them thu vien neu khong co)."""
    try:
        import yaml
        with open(path, encoding='utf-8') as f:
            return yaml.safe_load(f) or {}
    except ImportError:
        return {}


def doc_dex():
    """slug -> ma loai, doc thang tu js/data/species.js da sinh truoc do."""
    out = {}
    try:
        src = open('js/data/species.js', encoding='utf-8').read()
    except OSError:
        return out
    for m in re.finditer(r'^  (\d+): \{ name: "[^"]*", slug: "([^"]+)"', src, re.M):
        out[m.group(2)] = int(m.group(1))
    return out


def fmtnum(v):
    return ('%g' % v)


def write_js(maps, want):
    out = ["// TuxeWorld H5 | data/maps.js | Bản đồ — TỰ SINH TỪ tools/mktmx.py, đừng sửa tay",
           '// Nguồn: bản đồ và tileset của Tuxemon (CC BY-SA 4.0).',
           '// Mỗi bản đồ có ATLAS riêng: chỉ gom những ô thật sự dùng nên nhẹ hơn nhiều',
           '// so với chép cả 6 tileset gốc.', '',
           'export const TILE_SIZE = 16;', '',
           'export const MAPS = {']
    for slug, m in maps.items():
        spawn = pick_spawn(m)
        out.append('  %s: {' % slug)
        out.append('    name: %s, w: %d, h: %d, cols: %d, music: %s,'
                   % (js(m['name']), m['w'], m['h'], m['cols'], js(m.get('music') or 'town')))
        out.append('    env: %s, envNight: %s,'
                   % (js(m.get('env') or 'grass'),
                      js(m.get('envNight') or 'night_' + (m.get('env') or 'grass'))))
        if m.get('trong'):
            out.append('    trong: true,')
        out.append('    atlas: %s,' % js('assets/maps/%s.png' % slug))
        out.append('    spawn: { x: %d, y: %d },' % spawn)
        out.append('    layers: [')
        for lay in m['layers']:
            out.append('      %s,' % js(lay))
        out.append('    ],')
        out.append('    above: %s,' % (js(m['above']) if m['above'] else 'null'))
        out.append('    solid: %s,' % js(m['solid']))
        if any(m.get('water') or []):
            out.append('    water: %s,' % js(m['water']))
        out.append('    warps: %s,' % js(m['warps']))
        out.append('    talks: %s,' % js(m['talks']))
        out.append('    npcs: %s,' % js(m['npcs']))
        if m.get('items'):
            out.append('    items: %s,' % js(m['items']))
        out.append('  },')
    out.append('};')
    out.append('''
export const mapWidth = (map) => map.w;
export const mapHeight = (map) => map.h;

// Ô này có chắn đường không? Ngoài biên coi như tường.
export function isSolid(map, x, y) {
  if (!map || x < 0 || y < 0 || x >= map.w || y >= map.h) return true;
  return !!map.solid[y * map.w + x];
}

export const warpAt = (map, x, y) =>
  (map.warps || []).find(w => w.x === x && w.y === y) || null;

export const talkAt = (map, x, y) =>
  (map.talks || []).find(t => t.x === x && t.y === y) || null;''')
    open('js/data/maps.js', 'w', encoding='utf-8').write('\n'.join(out) + '\n')


def pick_spawn(m):
    """Cho nguoi choi dung canh cong ra vao. Ban do trong nha ma tha giua thi
    de roi vao sau quay hang; canh cong moi la cho nguoi ta thuc su buoc vao."""
    w, h = m['w'], m['h']
    for wp in m['warps']:
        for dx, dy in ((0, 1), (0, -1), (1, 0), (-1, 0)):
            x, y = wp['x'] + dx, wp['y'] + dy
            if 0 <= x < w and 0 <= y < h and not m['solid'][y * w + x]:
                return (x, y)
    cx, cy = w // 2, h // 2
    best, bd = (1, 1), 10 ** 9
    for y in range(h):
        for x in range(w):
            if m['solid'][y * w + x]:
                continue
            d = (x - cx) ** 2 + (y - cy) ** 2
            if d < bd:
                bd, best = d, (x, y)
    return best


if __name__ == '__main__':
    main()
