-- PokeWorld | 00_core/04_serializer.lua | table <-> string để lưu Archive (format version hóa)
local PW = _G.PW or {}; _G.PW = PW

local ser = {}
PW.ser = ser

-- Serialize bảng Lua thành chuỗi Lua hợp lệ (chỉ hỗ trợ kiểu dữ liệu save:
-- number, string, boolean, table; key là string hoặc number).
local function encode_val(v, buf, depth)
  local t = type(v)
  if t == "number" then
    buf[#buf + 1] = string.format("%.17g", v)
  elseif t == "string" then
    buf[#buf + 1] = string.format("%q", v)
  elseif t == "boolean" then
    buf[#buf + 1] = tostring(v)
  elseif t == "table" then
    if depth > 24 then error("serializer: qua sau (depth>24)") end
    buf[#buf + 1] = "{"
    -- Phần mảng
    local n = #v
    for i = 1, n do
      encode_val(v[i], buf, depth + 1)
      buf[#buf + 1] = ","
    end
    -- Phần hash (bỏ qua key 1..n đã ghi ở trên)
    for k, val in pairs(v) do
      local skip = type(k) == "number" and k >= 1 and k <= n and k == math.floor(k)
      if not skip then
        if type(k) == "string" then
          if k:match("^[%a_][%w_]*$") then
            buf[#buf + 1] = k .. "="
          else
            buf[#buf + 1] = "[" .. string.format("%q", k) .. "]="
          end
        elseif type(k) == "number" then
          buf[#buf + 1] = "[" .. string.format("%.17g", k) .. "]="
        else
          error("serializer: key kieu " .. type(k) .. " khong ho tro")
        end
        encode_val(val, buf, depth + 1)
        buf[#buf + 1] = ","
      end
    end
    buf[#buf + 1] = "}"
  else
    error("serializer: kieu " .. t .. " khong ho tro")
  end
end

-- encode: bọc kèm version để migrate về sau. Trả về chuỗi hoặc nil, err.
function ser.encode(tbl)
  local buf = { "return " }
  local ok, err = pcall(encode_val, tbl, buf, 0)
  if not ok then return nil, err end
  return table.concat(buf)
end

-- decode: chạy chuỗi trong sandbox rỗng (không cho gọi hàm nào).
function ser.decode(str)
  if type(str) ~= "string" or str == "" then return nil, "chuoi rong" end
  local loader = loadstring or load
  local fn, err = loader(str)
  if not fn then return nil, err end
  if setfenv then setfenv(fn, {}) end -- Lua 5.1: chặn truy cập _G
  local ok, res = pcall(fn)
  if not ok then return nil, res end
  if type(res) ~= "table" then return nil, "khong phai bang" end
  return res
end
