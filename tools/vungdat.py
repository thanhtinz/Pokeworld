# -*- coding: utf-8 -*-
"""Phan loai mot ban do la VUNG HOANG hay CHO CO NGUOI O.

Dung chung cho tools/mktmx.py (bang gap lay tu Tuxemon) va tools/mkworld.py
(bang gap sinh theo dia hinh). Hai cho cung phai tra ve mot ket qua, khong thi
thi tran sach quai o bang nay ma van con quai o bang kia.

Vi sao can: ban goc rai co cao ngay TRONG thi tran, nen di cho ra tiem thuoc
cung dinh mot tran. Hang quan, tram hoi suc, nha dan deu o day — cho co nguoi
o thi khong the la cho Tuxemon hoang nhay ra.

Doan theo TEN ban do vi Tuxemon khong ghi san loai vung nao ca:
  · town / city / park / port  -> cho o, KHONG co quai
  · route                      -> duong di, co quai
  · grove / forest             -> rung, co quai
  · cave / tunnel / shaft / passageway -> hang, co quai
  · con lai                    -> trong nha, KHONG co quai
"""

# Tu khoa trong ten ban do -> loai vung. Xet theo dung thu tu nay: 'candy_port'
# vua co 'port' vua khong co gi khac, ma 'taba_ba_passageway' thi phai ra hang
# chu khong duoc dinh vao mot tu khoa cho o nao.
LOAI = [
    (('cave', 'tunnel', 'shaft', 'passageway'), 'cave'),
    (('route',), 'route'),
    (('grove', 'forest'), 'forest'),
    (('town', 'city', 'park', 'port'), 'town'),
]

# Ba loai nay la vung hoang — chi o day moi co Tuxemon hoang nhay ra
HOANG = ('route', 'forest', 'cave')


def loai_vung(slug):
    """Tra ve 'cave' | 'route' | 'forest' | 'town' | 'indoor'."""
    s = str(slug).lower()
    for tu_khoa, loai in LOAI:
        if any(t in s for t in tu_khoa):
            return loai
    return 'indoor'


def la_hoang(slug):
    """Ban do nay co Tuxemon hoang khong."""
    return loai_vung(slug) in HOANG
