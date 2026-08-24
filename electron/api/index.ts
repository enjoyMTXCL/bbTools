import getDS from '../utils/ds';

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) miHoYoBBS/2.11.1",
  Referer: "https://webstatic.mihoyo.com/",
  "x-rpc-app_version": "2.24.2",
  "x-rpc-client_type": "5",
  DS: "",
  Cookie: "",
};

interface BBQuery {
  role_id: number | string;
  server: string;
}

function getBBData(query: BBQuery, cookie: string) {
  const res = fetch(`https://api-takumi-record.mihoyo.com/game_record/app/bh2/api/society/get_profile?${new URLSearchParams(query as Record<string, string>)}`, {
    method: "GET",
    headers: { ...HEADERS, DS: getDS(query), Cookie: cookie ? cookie : ''},
  }).then((res) => res.json());
  return res;
}

// module.exports = {
//   getBBData
// };
export default getBBData;