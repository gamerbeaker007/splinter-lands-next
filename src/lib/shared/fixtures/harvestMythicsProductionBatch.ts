import type { SplTrxInfo } from "@/types/spl/trx";

/**
 * Production regression fixture: a Harvest Mythics run of 2026-10-11 (v1.39.2)
 * where the reveal showed 2 Rare fragments instead of the 9 the engine awarded.
 *
 * Captured from `api.splinterlands.com/transactions/lookup` for every SPL op:
 * 11 Hive transactions × 4 `tax_collection` ops = 44 ops (40 keeps, then 4
 * castles). SPL gives op 0 the Hive tx id and op N the id `<hiveTxId>-N`.
 *
 * Sanitized: `player` replaced, the op nonce `n` dropped. Everything the
 * parser reads (data, result, success) is verbatim.
 *
 * Verified drops (fragment_found && fragment_type): TOTEMFR ×6, TOTEMFE ×2,
 * TOTEMFC ×1. Only two sit at op 0 (b5d568d3…, 39100f4f…), both TOTEMFR.
 */
export const HARVEST_MYTHICS_PRODUCTION_OPS_PER_TX = 4;

/** The Hive transaction ids, in broadcast order. */
export const HARVEST_MYTHICS_PRODUCTION_TX_IDS: string[] = [
  "24b02a867394e19c40f155597eca4bd273e9d45b",
  "b5d568d3ebb26124425a193fc957f00c7707d663",
  "80dca81d2b79ff6af124063bfbad3a6a79550ad6",
  "4c4e6046369766ae9335694ef3d2e17925d99ecb",
  "8a5e69f1498ae53804b98e7fddeb4fefd25eee58",
  "ad6b317dbee86e9195e93ddee48e8bbbc9fabf8a",
  "1cbecee75485ef28b4277d30e4355993187cd4f7",
  "162a9d69a9ac11ce42eb21dcebb8505c31f1ae14",
  "c197db0b9646261c0f457bd11f401fbc8fa88f14",
  "600a716355df13d3e8ea5cb9d52c598179cde7b9",
  "39100f4fceb3b14cf0decfee7c4c3361766a3170",
];

/** trx_info envelope per SPL op id, exactly as the lookup endpoint returned it. */
export const HARVEST_MYTHICS_PRODUCTION_LOOKUPS: Record<string, SplTrxInfo> = {
  "24b02a867394e19c40f155597eca4bd273e9d45b": {
    id: "24b02a867394e19c40f155597eca4bd273e9d45b",
    type: "land_operation",
    player: "player",
    data: '{"op":"tax_collection","region_uid":"PR-BRL-29","deed_uids":["I-295-0265cadb241e9c"],"auto_buy_grain":false,"resource_symbol":"","app":"splinter-lands-next/1.39.2"}',
    result:
      '{"success":true,"result":{"success":true,"error":"","data":{"id":3309,"deed_uid":"I-295-0265cadb241e9c","plot_id":2810,"tract_number":1,"region_number":29,"elapsed_hours":165.768,"tokens":{"tokens":[{"token":"SPS","received":"174.907"},{"token":"GRAIN","received":"32631.463"},{"token":"WOOD","received":"6446.561"},{"token":"STONE","received":"1078.894"},{"token":"IRON","received":"422.525"},{"token":"AURA","received":"0.000"},{"token":"RESEARCH","received":"0.000"}]},"result_message":"Successful","dec_spent":0,"fragment_chance":0.1740564,"fragment_roll":0.2690684443043309,"fragment_found":false,"kingdom_grain_cost":1000,"kingdom_type":"keep"},"balanceHistory":[]}}',
    success: true,
    error: null,
    created_date: "2026-10-11T02:50:51.000Z",
  },
  "24b02a867394e19c40f155597eca4bd273e9d45b-1": {
    id: "24b02a867394e19c40f155597eca4bd273e9d45b-1",
    type: "land_operation",
    player: "player",
    data: '{"op":"tax_collection","region_uid":"PR-CEF-74","deed_uids":["I-296-1368a1a8c11041"],"auto_buy_grain":false,"resource_symbol":"","app":"splinter-lands-next/1.39.2"}',
    result:
      '{"success":true,"result":{"success":true,"error":"","data":{"id":3887,"deed_uid":"I-296-1368a1a8c11041","plot_id":7322,"tract_number":1,"region_number":74,"elapsed_hours":165.658,"tokens":{"tokens":[{"token":"SPS","received":"37.657"},{"token":"GRAIN","received":"40470.755"},{"token":"WOOD","received":"25275.253"},{"token":"STONE","received":"0.000"},{"token":"IRON","received":"0.000"},{"token":"AURA","received":"552.126"},{"token":"RESEARCH","received":"0.000"}]},"result_message":"Successful","dec_spent":0,"fragment_chance":0.19133498999999998,"fragment_roll":0.8783865790641057,"fragment_found":false,"kingdom_grain_cost":1000,"kingdom_type":"keep"},"balanceHistory":[]}}',
    success: true,
    error: null,
    created_date: "2026-10-11T02:50:51.000Z",
  },
  "24b02a867394e19c40f155597eca4bd273e9d45b-2": {
    id: "24b02a867394e19c40f155597eca4bd273e9d45b-2",
    type: "land_operation",
    player: "player",
    data: '{"op":"tax_collection","region_uid":"PR-WNE-90","deed_uids":["I-292-7bc013cf803a04"],"auto_buy_grain":false,"resource_symbol":"","app":"splinter-lands-next/1.39.2"}',
    result:
      '{"success":true,"result":{"success":true,"error":"","data":{"id":3827,"deed_uid":"I-292-7bc013cf803a04","plot_id":8964,"tract_number":1,"region_number":90,"elapsed_hours":165.578,"tokens":{"tokens":[{"token":"SPS","received":"0.000"},{"token":"GRAIN","received":"11392.196"},{"token":"WOOD","received":"834.751"},{"token":"STONE","received":"851.487"},{"token":"IRON","received":"2564.404"},{"token":"AURA","received":"0.000"},{"token":"RESEARCH","received":"2.640"}]},"result_message":"Successful","dec_spent":0,"fragment_chance":0.19124259,"fragment_roll":0.7185855477034659,"fragment_found":false,"kingdom_grain_cost":1000,"kingdom_type":"keep"},"balanceHistory":[]}}',
    success: true,
    error: null,
    created_date: "2026-10-11T02:50:51.000Z",
  },
  "24b02a867394e19c40f155597eca4bd273e9d45b-3": {
    id: "24b02a867394e19c40f155597eca4bd273e9d45b-3",
    type: "land_operation",
    player: "player",
    data: '{"op":"tax_collection","region_uid":"PR-WNE-92","deed_uids":["I-302-dece08053a8418"],"auto_buy_grain":false,"resource_symbol":"","app":"splinter-lands-next/1.39.2"}',
    result:
      '{"success":true,"result":{"success":true,"error":"","data":{"id":3957,"deed_uid":"I-302-dece08053a8418","plot_id":9163,"tract_number":1,"region_number":92,"elapsed_hours":165.539,"tokens":{"tokens":[{"token":"SPS","received":"19.813"},{"token":"GRAIN","received":"95360.704"},{"token":"WOOD","received":"7135.929"},{"token":"STONE","received":"668.176"},{"token":"IRON","received":"1647.247"},{"token":"AURA","received":"0.000"},{"token":"RESEARCH","received":"0.000"}]},"result_message":"Successful","dec_spent":0,"fragment_chance":0.19119754499999997,"fragment_roll":0.45201890376505477,"fragment_found":false,"kingdom_grain_cost":1000,"kingdom_type":"keep"},"balanceHistory":[]}}',
    success: true,
    error: null,
    created_date: "2026-10-11T02:50:51.000Z",
  },
  b5d568d3ebb26124425a193fc957f00c7707d663: {
    id: "b5d568d3ebb26124425a193fc957f00c7707d663",
    type: "land_operation",
    player: "player",
    data: '{"op":"tax_collection","region_uid":"PR-LOP-58","deed_uids":["I-292-4cb5fcb6fb5eb1"],"auto_buy_grain":false,"resource_symbol":"","app":"splinter-lands-next/1.39.2"}',
    result:
      '{"success":true,"result":{"success":true,"error":"","data":{"id":3500,"deed_uid":"I-292-4cb5fcb6fb5eb1","plot_id":20757,"tract_number":2,"region_number":58,"elapsed_hours":165.722,"tokens":{"tokens":[{"token":"SPS","received":"32.742"},{"token":"GRAIN","received":"73458.974"},{"token":"WOOD","received":"0.000"},{"token":"STONE","received":"2115.042"},{"token":"IRON","received":"0.000"},{"token":"AURA","received":"1698.444"},{"token":"RESEARCH","received":"0.000"}]},"result_message":"Successful","dec_spent":0,"fragment_chance":0.19140891,"fragment_roll":0.15584322618637353,"fragment_type":"TOTEMFR","fragment_found":true,"kingdom_grain_cost":1000,"kingdom_type":"keep"},"balanceHistory":[]}}',
    success: true,
    error: null,
    created_date: "2026-10-11T02:50:57.000Z",
  },
  "b5d568d3ebb26124425a193fc957f00c7707d663-1": {
    id: "b5d568d3ebb26124425a193fc957f00c7707d663-1",
    type: "land_operation",
    player: "player",
    data: '{"op":"tax_collection","region_uid":"PR-CEF-74","deed_uids":["I-293-8a3c6e67810580"],"auto_buy_grain":false,"resource_symbol":"","app":"splinter-lands-next/1.39.2"}',
    result:
      '{"success":true,"result":{"success":true,"error":"","data":{"id":3894,"deed_uid":"I-293-8a3c6e67810580","plot_id":22369,"tract_number":2,"region_number":74,"elapsed_hours":165.653,"tokens":{"tokens":[{"token":"SPS","received":"43.266"},{"token":"GRAIN","received":"61274.279"},{"token":"WOOD","received":"21761.852"},{"token":"STONE","received":"0.000"},{"token":"IRON","received":"0.000"},{"token":"AURA","received":"1868.344"},{"token":"RESEARCH","received":"0.000"}]},"result_message":"Successful","dec_spent":0,"fragment_chance":0.191329215,"fragment_roll":0.1009602068205821,"fragment_type":"TOTEMFR","fragment_found":true,"kingdom_grain_cost":1000,"kingdom_type":"keep"},"balanceHistory":[]}}',
    success: true,
    error: null,
    created_date: "2026-10-11T02:50:57.000Z",
  },
  "b5d568d3ebb26124425a193fc957f00c7707d663-2": {
    id: "b5d568d3ebb26124425a193fc957f00c7707d663-2",
    type: "land_operation",
    player: "player",
    data: '{"op":"tax_collection","region_uid":"PR-WNE-90","deed_uids":["I-292-bdf6cf8765404f"],"auto_buy_grain":false,"resource_symbol":"","app":"splinter-lands-next/1.39.2"}',
    result:
      '{"success":true,"result":{"success":true,"error":"","data":{"id":3954,"deed_uid":"I-292-bdf6cf8765404f","plot_id":23956,"tract_number":2,"region_number":90,"elapsed_hours":165.576,"tokens":{"tokens":[{"token":"SPS","received":"177.247"},{"token":"GRAIN","received":"23624.685"},{"token":"WOOD","received":"12118.976"},{"token":"STONE","received":"2541.163"},{"token":"IRON","received":"352.173"},{"token":"AURA","received":"1792.881"},{"token":"RESEARCH","received":"1.711"}]},"result_message":"Successful","dec_spent":0,"fragment_chance":0.19124027999999998,"fragment_roll":0.5209480871405501,"fragment_found":false,"kingdom_grain_cost":1000,"kingdom_type":"keep"},"balanceHistory":[]}}',
    success: true,
    error: null,
    created_date: "2026-10-11T02:50:57.000Z",
  },
  "b5d568d3ebb26124425a193fc957f00c7707d663-3": {
    id: "b5d568d3ebb26124425a193fc957f00c7707d663-3",
    type: "land_operation",
    player: "player",
    data: '{"op":"tax_collection","region_uid":"PR-LOP-58","deed_uids":["I-299-fce7eb26b2333a"],"auto_buy_grain":false,"resource_symbol":"","app":"splinter-lands-next/1.39.2"}',
    result:
      '{"success":true,"result":{"success":true,"error":"","data":{"id":3527,"deed_uid":"I-299-fce7eb26b2333a","plot_id":35761,"tract_number":3,"region_number":58,"elapsed_hours":165.725,"tokens":{"tokens":[{"token":"SPS","received":"23.442"},{"token":"GRAIN","received":"39695.342"},{"token":"WOOD","received":"0.000"},{"token":"STONE","received":"4075.706"},{"token":"IRON","received":"0.000"},{"token":"AURA","received":"1086.855"},{"token":"RESEARCH","received":"0.000"}]},"result_message":"Successful","dec_spent":0,"fragment_chance":0.1809717,"fragment_roll":0.5436773479277555,"fragment_found":false,"kingdom_grain_cost":1000,"kingdom_type":"keep"},"balanceHistory":[]}}',
    success: true,
    error: null,
    created_date: "2026-10-11T02:50:57.000Z",
  },
  "80dca81d2b79ff6af124063bfbad3a6a79550ad6": {
    id: "80dca81d2b79ff6af124063bfbad3a6a79550ad6",
    type: "land_operation",
    player: "player",
    data: '{"op":"tax_collection","region_uid":"PR-CEF-74","deed_uids":["I-298-6fdcaf1b07d56a"],"auto_buy_grain":false,"resource_symbol":"","app":"splinter-lands-next/1.39.2"}',
    result:
      '{"success":true,"result":{"success":true,"error":"","data":{"id":3896,"deed_uid":"I-298-6fdcaf1b07d56a","plot_id":37400,"tract_number":3,"region_number":74,"elapsed_hours":165.643,"tokens":{"tokens":[{"token":"SPS","received":"75.732"},{"token":"GRAIN","received":"20440.423"},{"token":"WOOD","received":"18542.077"},{"token":"STONE","received":"800.958"},{"token":"IRON","received":"0.000"},{"token":"AURA","received":"0.000"},{"token":"RESEARCH","received":"0.000"}]},"result_message":"Successful","dec_spent":0,"fragment_chance":0.19131766499999997,"fragment_roll":0.684218217602113,"fragment_found":false,"kingdom_grain_cost":1000,"kingdom_type":"keep"},"balanceHistory":[]}}',
    success: true,
    error: null,
    created_date: "2026-10-11T02:51:03.000Z",
  },
  "80dca81d2b79ff6af124063bfbad3a6a79550ad6-1": {
    id: "80dca81d2b79ff6af124063bfbad3a6a79550ad6-1",
    type: "land_operation",
    player: "player",
    data: '{"op":"tax_collection","region_uid":"PR-WNE-90","deed_uids":["I-301-c0e0253a97fe7d"],"auto_buy_grain":false,"resource_symbol":"","app":"splinter-lands-next/1.39.2"}',
    result:
      '{"success":true,"result":{"success":true,"error":"","data":{"id":3958,"deed_uid":"I-301-c0e0253a97fe7d","plot_id":38983,"tract_number":3,"region_number":90,"elapsed_hours":165.574,"tokens":{"tokens":[{"token":"SPS","received":"0.000"},{"token":"GRAIN","received":"51652.789"},{"token":"WOOD","received":"7159.122"},{"token":"STONE","received":"3296.128"},{"token":"IRON","received":"257.860"},{"token":"AURA","received":"6.031"},{"token":"RESEARCH","received":"0.000"}]},"result_message":"Successful","dec_spent":0,"fragment_chance":0.19471502400000001,"fragment_roll":0.7292222876366862,"fragment_found":false,"kingdom_grain_cost":1000,"kingdom_type":"keep"},"balanceHistory":[]}}',
    success: true,
    error: null,
    created_date: "2026-10-11T02:51:03.000Z",
  },
  "80dca81d2b79ff6af124063bfbad3a6a79550ad6-2": {
    id: "80dca81d2b79ff6af124063bfbad3a6a79550ad6-2",
    type: "land_operation",
    player: "player",
    data: '{"op":"tax_collection","region_uid":"PR-LOP-58","deed_uids":["I-299-6c401f5df555ff"],"auto_buy_grain":false,"resource_symbol":"","app":"splinter-lands-next/1.39.2"}',
    result:
      '{"success":true,"result":{"success":true,"error":"","data":{"id":3469,"deed_uid":"I-299-6c401f5df555ff","plot_id":50749,"tract_number":4,"region_number":58,"elapsed_hours":165.731,"tokens":{"tokens":[{"token":"SPS","received":"64.559"},{"token":"GRAIN","received":"33612.982"},{"token":"WOOD","received":"0.000"},{"token":"STONE","received":"9425.308"},{"token":"IRON","received":"146.224"},{"token":"AURA","received":"0.000"},{"token":"RESEARCH","received":"0.000"}]},"result_message":"Successful","dec_spent":0,"fragment_chance":0.17401755,"fragment_roll":0.28622691866068867,"fragment_found":false,"kingdom_grain_cost":1000,"kingdom_type":"keep"},"balanceHistory":[]}}',
    success: true,
    error: null,
    created_date: "2026-10-11T02:51:03.000Z",
  },
  "80dca81d2b79ff6af124063bfbad3a6a79550ad6-3": {
    id: "80dca81d2b79ff6af124063bfbad3a6a79550ad6-3",
    type: "land_operation",
    player: "player",
    data: '{"op":"tax_collection","region_uid":"PR-CEF-74","deed_uids":["I-294-62cae3c2c6754f"],"auto_buy_grain":false,"resource_symbol":"","app":"splinter-lands-next/1.39.2"}',
    result:
      '{"success":true,"result":{"success":true,"error":"","data":{"id":3898,"deed_uid":"I-294-62cae3c2c6754f","plot_id":52395,"tract_number":4,"region_number":74,"elapsed_hours":165.604,"tokens":{"tokens":[{"token":"SPS","received":"121.498"},{"token":"GRAIN","received":"0.000"},{"token":"WOOD","received":"7833.456"},{"token":"STONE","received":"0.000"},{"token":"IRON","received":"0.000"},{"token":"AURA","received":"2315.089"},{"token":"RESEARCH","received":"0.000"}]},"result_message":"Successful","dec_spent":0,"fragment_chance":0.21735525000000003,"fragment_roll":0.008314047559319495,"fragment_type":"TOTEMFE","fragment_found":true,"kingdom_grain_cost":1000,"kingdom_type":"keep"},"balanceHistory":[]}}',
    success: true,
    error: null,
    created_date: "2026-10-11T02:51:03.000Z",
  },
  "4c4e6046369766ae9335694ef3d2e17925d99ecb": {
    id: "4c4e6046369766ae9335694ef3d2e17925d99ecb",
    type: "land_operation",
    player: "player",
    data: '{"op":"tax_collection","region_uid":"PR-WNE-90","deed_uids":["I-292-41a249192a77cd"],"auto_buy_grain":false,"resource_symbol":"","app":"splinter-lands-next/1.39.2"}',
    result:
      '{"success":true,"result":{"success":true,"error":"","data":{"id":4029,"deed_uid":"I-292-41a249192a77cd","plot_id":53951,"tract_number":4,"region_number":90,"elapsed_hours":165.574,"tokens":{"tokens":[{"token":"SPS","received":"22.530"},{"token":"GRAIN","received":"7986.972"},{"token":"WOOD","received":"285.018"},{"token":"STONE","received":"5275.136"},{"token":"IRON","received":"0.000"},{"token":"AURA","received":"644.274"},{"token":"RESEARCH","received":"0.000"}]},"result_message":"Successful","dec_spent":0,"fragment_chance":0.19471502400000001,"fragment_roll":0.8096044403065735,"fragment_found":false,"kingdom_grain_cost":1000,"kingdom_type":"keep"},"balanceHistory":[]}}',
    success: true,
    error: null,
    created_date: "2026-10-11T02:51:18.000Z",
  },
  "4c4e6046369766ae9335694ef3d2e17925d99ecb-1": {
    id: "4c4e6046369766ae9335694ef3d2e17925d99ecb-1",
    type: "land_operation",
    player: "player",
    data: '{"op":"tax_collection","region_uid":"PR-LOP-58","deed_uids":["I-299-66e1f873309a77"],"auto_buy_grain":false,"resource_symbol":"","app":"splinter-lands-next/1.39.2"}',
    result:
      '{"success":true,"result":{"success":true,"error":"","data":{"id":3502,"deed_uid":"I-299-66e1f873309a77","plot_id":65776,"tract_number":5,"region_number":58,"elapsed_hours":165.738,"tokens":{"tokens":[{"token":"SPS","received":"41.433"},{"token":"GRAIN","received":"91789.341"},{"token":"WOOD","received":"1410.028"},{"token":"STONE","received":"1145.690"},{"token":"IRON","received":"0.000"},{"token":"AURA","received":"0.000"},{"token":"RESEARCH","received":"0.000"}]},"result_message":"Successful","dec_spent":0,"fragment_chance":0.19142738999999998,"fragment_roll":0.9688853172913643,"fragment_found":false,"kingdom_grain_cost":1000,"kingdom_type":"keep"},"balanceHistory":[]}}',
    success: true,
    error: null,
    created_date: "2026-10-11T02:51:18.000Z",
  },
  "4c4e6046369766ae9335694ef3d2e17925d99ecb-2": {
    id: "4c4e6046369766ae9335694ef3d2e17925d99ecb-2",
    type: "land_operation",
    player: "player",
    data: '{"op":"tax_collection","region_uid":"PR-CEF-74","deed_uids":["I-303-15dc7a2f83fdb7"],"auto_buy_grain":false,"resource_symbol":"","app":"splinter-lands-next/1.39.2"}',
    result:
      '{"success":true,"result":{"success":true,"error":"","data":{"id":3899,"deed_uid":"I-303-15dc7a2f83fdb7","plot_id":67371,"tract_number":5,"region_number":74,"elapsed_hours":165.605,"tokens":{"tokens":[{"token":"SPS","received":"0.000"},{"token":"GRAIN","received":"77250.702"},{"token":"WOOD","received":"1938.766"},{"token":"STONE","received":"0.043"},{"token":"IRON","received":"472.030"},{"token":"AURA","received":"3300.157"},{"token":"RESEARCH","received":"0.000"}]},"result_message":"Successful","dec_spent":0,"fragment_chance":0.19127377499999998,"fragment_roll":0.48898327330753044,"fragment_found":false,"kingdom_grain_cost":1000,"kingdom_type":"keep"},"balanceHistory":[]}}',
    success: true,
    error: null,
    created_date: "2026-10-11T02:51:18.000Z",
  },
  "4c4e6046369766ae9335694ef3d2e17925d99ecb-3": {
    id: "4c4e6046369766ae9335694ef3d2e17925d99ecb-3",
    type: "land_operation",
    player: "player",
    data: '{"op":"tax_collection","region_uid":"PR-WNE-90","deed_uids":["I-302-fc2ba7e048bea7"],"auto_buy_grain":false,"resource_symbol":"","app":"splinter-lands-next/1.39.2"}',
    result:
      '{"success":true,"result":{"success":true,"error":"","data":{"id":4051,"deed_uid":"I-302-fc2ba7e048bea7","plot_id":68997,"tract_number":5,"region_number":90,"elapsed_hours":165.571,"tokens":{"tokens":[{"token":"SPS","received":"158.057"},{"token":"GRAIN","received":"163077.891"},{"token":"WOOD","received":"1495.078"},{"token":"STONE","received":"540.828"},{"token":"IRON","received":"0.000"},{"token":"AURA","received":"1499.784"},{"token":"RESEARCH","received":"0.000"}]},"result_message":"Successful","dec_spent":0,"fragment_chance":0.191234505,"fragment_roll":0.4475001940953345,"fragment_found":false,"kingdom_grain_cost":1000,"kingdom_type":"keep"},"balanceHistory":[]}}',
    success: true,
    error: null,
    created_date: "2026-10-11T02:51:18.000Z",
  },
  "8a5e69f1498ae53804b98e7fddeb4fefd25eee58": {
    id: "8a5e69f1498ae53804b98e7fddeb4fefd25eee58",
    type: "land_operation",
    player: "player",
    data: '{"op":"tax_collection","region_uid":"PR-WNE-92","deed_uids":["I-292-e2101985bcc6b3"],"auto_buy_grain":false,"resource_symbol":"","app":"splinter-lands-next/1.39.2"}',
    result:
      '{"success":true,"result":{"success":true,"error":"","data":{"id":4074,"deed_uid":"I-292-e2101985bcc6b3","plot_id":69154,"tract_number":5,"region_number":92,"elapsed_hours":165.543,"tokens":{"tokens":[{"token":"SPS","received":"173.132"},{"token":"GRAIN","received":"108067.912"},{"token":"WOOD","received":"0.000"},{"token":"STONE","received":"221.742"},{"token":"IRON","received":"909.235"},{"token":"AURA","received":"0.000"},{"token":"RESEARCH","received":"0.000"}]},"result_message":"Successful","dec_spent":0,"fragment_chance":0.19120216499999998,"fragment_roll":0.9160279380908641,"fragment_found":false,"kingdom_grain_cost":1000,"kingdom_type":"keep"},"balanceHistory":[]}}',
    success: true,
    error: null,
    created_date: "2026-10-11T02:51:21.000Z",
  },
  "8a5e69f1498ae53804b98e7fddeb4fefd25eee58-1": {
    id: "8a5e69f1498ae53804b98e7fddeb4fefd25eee58-1",
    type: "land_operation",
    player: "player",
    data: '{"op":"tax_collection","region_uid":"PR-GLL-108","deed_uids":["I-294-1a4533f8f8ed2f"],"auto_buy_grain":false,"resource_symbol":"","app":"splinter-lands-next/1.39.2"}',
    result:
      '{"success":true,"result":{"success":true,"error":"","data":{"id":3410,"deed_uid":"I-294-1a4533f8f8ed2f","plot_id":70767,"tract_number":5,"region_number":108,"elapsed_hours":165.482,"tokens":{"tokens":[{"token":"SPS","received":"37.557"},{"token":"GRAIN","received":"71686.811"},{"token":"WOOD","received":"32914.997"},{"token":"STONE","received":"0.000"},{"token":"IRON","received":"0.000"},{"token":"AURA","received":"0.000"},{"token":"RESEARCH","received":"0.000"}]},"result_message":"Successful","dec_spent":0,"fragment_chance":0.1737561,"fragment_roll":0.4578202841581599,"fragment_found":false,"kingdom_grain_cost":1000,"kingdom_type":"keep"},"balanceHistory":[]}}',
    success: true,
    error: null,
    created_date: "2026-10-11T02:51:21.000Z",
  },
  "8a5e69f1498ae53804b98e7fddeb4fefd25eee58-2": {
    id: "8a5e69f1498ae53804b98e7fddeb4fefd25eee58-2",
    type: "land_operation",
    player: "player",
    data: '{"op":"tax_collection","region_uid":"PR-LOP-58","deed_uids":["I-299-6ff53242a32f2c"],"auto_buy_grain":false,"resource_symbol":"","app":"splinter-lands-next/1.39.2"}',
    result:
      '{"success":true,"result":{"success":true,"error":"","data":{"id":3573,"deed_uid":"I-299-6ff53242a32f2c","plot_id":80788,"tract_number":6,"region_number":58,"elapsed_hours":165.743,"tokens":{"tokens":[{"token":"SPS","received":"239.963"},{"token":"GRAIN","received":"97277.898"},{"token":"WOOD","received":"8023.295"},{"token":"STONE","received":"382.662"},{"token":"IRON","received":"924.337"},{"token":"AURA","received":"0.000"},{"token":"RESEARCH","received":"0.000"}]},"result_message":"Successful","dec_spent":0,"fragment_chance":0.21753768750000002,"fragment_roll":0.0482038941652885,"fragment_type":"TOTEMFR","fragment_found":true,"kingdom_grain_cost":1000,"kingdom_type":"keep"},"balanceHistory":[]}}',
    success: true,
    error: null,
    created_date: "2026-10-11T02:51:21.000Z",
  },
  "8a5e69f1498ae53804b98e7fddeb4fefd25eee58-3": {
    id: "8a5e69f1498ae53804b98e7fddeb4fefd25eee58-3",
    type: "land_operation",
    player: "player",
    data: '{"op":"tax_collection","region_uid":"PR-CEF-74","deed_uids":["I-293-6e3fa1cb687a53"],"auto_buy_grain":false,"resource_symbol":"","app":"splinter-lands-next/1.39.2"}',
    result:
      '{"success":true,"result":{"success":true,"error":"","data":{"id":3900,"deed_uid":"I-293-6e3fa1cb687a53","plot_id":82382,"tract_number":6,"region_number":74,"elapsed_hours":165.603,"tokens":{"tokens":[{"token":"SPS","received":"13.572"},{"token":"GRAIN","received":"32768.067"},{"token":"WOOD","received":"0.000"},{"token":"STONE","received":"5285.212"},{"token":"IRON","received":"1170.988"},{"token":"AURA","received":"910.373"},{"token":"RESEARCH","received":"0.000"}]},"result_message":"Successful","dec_spent":0,"fragment_chance":0.2173539375,"fragment_roll":0.08164906470703998,"fragment_type":"TOTEMFR","fragment_found":true,"kingdom_grain_cost":1000,"kingdom_type":"keep"},"balanceHistory":[]}}',
    success: true,
    error: null,
    created_date: "2026-10-11T02:51:21.000Z",
  },
  ad6b317dbee86e9195e93ddee48e8bbbc9fabf8a: {
    id: "ad6b317dbee86e9195e93ddee48e8bbbc9fabf8a",
    type: "land_operation",
    player: "player",
    data: '{"op":"tax_collection","region_uid":"PR-WNE-92","deed_uids":["I-290-336fe05bf2128e"],"auto_buy_grain":false,"resource_symbol":"","app":"splinter-lands-next/1.39.2"}',
    result:
      '{"success":true,"result":{"success":true,"error":"","data":{"id":4105,"deed_uid":"I-290-336fe05bf2128e","plot_id":84141,"tract_number":6,"region_number":92,"elapsed_hours":165.521,"tokens":{"tokens":[{"token":"SPS","received":"0.000"},{"token":"GRAIN","received":"35225.614"},{"token":"WOOD","received":"938.975"},{"token":"STONE","received":"2112.693"},{"token":"IRON","received":"0.000"},{"token":"AURA","received":"565.519"},{"token":"RESEARCH","received":"0.000"}]},"result_message":"Successful","dec_spent":0,"fragment_chance":0.19117675499999998,"fragment_roll":0.7871835940432967,"fragment_found":false,"kingdom_grain_cost":1000,"kingdom_type":"keep"},"balanceHistory":[]}}',
    success: true,
    error: null,
    created_date: "2026-10-11T02:51:27.000Z",
  },
  "ad6b317dbee86e9195e93ddee48e8bbbc9fabf8a-1": {
    id: "ad6b317dbee86e9195e93ddee48e8bbbc9fabf8a-1",
    type: "land_operation",
    player: "player",
    data: '{"op":"tax_collection","region_uid":"PR-LOP-58","deed_uids":["I-303-8598914c3425ff"],"auto_buy_grain":false,"resource_symbol":"","app":"splinter-lands-next/1.39.2"}',
    result:
      '{"success":true,"result":{"success":true,"error":"","data":{"id":3092,"deed_uid":"I-303-8598914c3425ff","plot_id":95714,"tract_number":7,"region_number":58,"elapsed_hours":165.748,"tokens":{"tokens":[{"token":"SPS","received":"22.830"},{"token":"GRAIN","received":"20760.404"},{"token":"WOOD","received":"0.000"},{"token":"STONE","received":"122.270"},{"token":"IRON","received":"3087.429"},{"token":"AURA","received":"1579.270"},{"token":"RESEARCH","received":"0.000"}]},"result_message":"Successful","dec_spent":0,"fragment_chance":0.17403539999999998,"fragment_roll":0.6424714299089033,"fragment_found":false,"kingdom_grain_cost":1000,"kingdom_type":"keep"},"balanceHistory":[]}}',
    success: true,
    error: null,
    created_date: "2026-10-11T02:51:27.000Z",
  },
  "ad6b317dbee86e9195e93ddee48e8bbbc9fabf8a-2": {
    id: "ad6b317dbee86e9195e93ddee48e8bbbc9fabf8a-2",
    type: "land_operation",
    player: "player",
    data: '{"op":"tax_collection","region_uid":"PR-WNE-90","deed_uids":["I-301-6d5e05cbdbbe50"],"auto_buy_grain":false,"resource_symbol":"","app":"splinter-lands-next/1.39.2"}',
    result:
      '{"success":true,"result":{"success":true,"error":"","data":{"id":4091,"deed_uid":"I-301-6d5e05cbdbbe50","plot_id":98915,"tract_number":7,"region_number":90,"elapsed_hours":165.57,"tokens":{"tokens":[{"token":"SPS","received":"0.000"},{"token":"GRAIN","received":"21329.602"},{"token":"WOOD","received":"3756.512"},{"token":"STONE","received":"3137.542"},{"token":"IRON","received":"477.348"},{"token":"AURA","received":"0.000"},{"token":"RESEARCH","received":"0.000"}]},"result_message":"Successful","dec_spent":0,"fragment_chance":0.19123334999999997,"fragment_roll":0.36750814687954675,"fragment_found":false,"kingdom_grain_cost":1000,"kingdom_type":"keep"},"balanceHistory":[]}}',
    success: true,
    error: null,
    created_date: "2026-10-11T02:51:27.000Z",
  },
  "ad6b317dbee86e9195e93ddee48e8bbbc9fabf8a-3": {
    id: "ad6b317dbee86e9195e93ddee48e8bbbc9fabf8a-3",
    type: "land_operation",
    player: "player",
    data: '{"op":"tax_collection","region_uid":"PR-WNE-92","deed_uids":["I-302-1d7b34b6609fa3"],"auto_buy_grain":false,"resource_symbol":"","app":"splinter-lands-next/1.39.2"}',
    result:
      '{"success":true,"result":{"success":true,"error":"","data":{"id":2982,"deed_uid":"I-302-1d7b34b6609fa3","plot_id":99176,"tract_number":7,"region_number":92,"elapsed_hours":165.553,"tokens":{"tokens":[{"token":"SPS","received":"0.000"},{"token":"GRAIN","received":"0.000"},{"token":"WOOD","received":"1011.231"},{"token":"STONE","received":"2475.411"},{"token":"IRON","received":"0.000"},{"token":"AURA","received":"0.000"},{"token":"RESEARCH","received":"0.000"}]},"result_message":"Successful","dec_spent":0,"fragment_chance":0.17383064999999998,"fragment_roll":0.21179114762888193,"fragment_found":false,"kingdom_grain_cost":1000,"kingdom_type":"keep"},"balanceHistory":[]}}',
    success: true,
    error: null,
    created_date: "2026-10-11T02:51:27.000Z",
  },
  "1cbecee75485ef28b4277d30e4355993187cd4f7": {
    id: "1cbecee75485ef28b4277d30e4355993187cd4f7",
    type: "land_operation",
    player: "player",
    data: '{"op":"tax_collection","region_uid":"PR-WNE-99","deed_uids":["I-303-55d2dbb2553556"],"auto_buy_grain":false,"resource_symbol":"","app":"splinter-lands-next/1.39.2"}',
    result:
      '{"success":true,"result":{"success":true,"error":"","data":{"id":3605,"deed_uid":"I-303-55d2dbb2553556","plot_id":99824,"tract_number":7,"region_number":99,"elapsed_hours":165.492,"tokens":{"tokens":[{"token":"SPS","received":"204.414"},{"token":"GRAIN","received":"263019.331"},{"token":"WOOD","received":"9238.677"},{"token":"STONE","received":"9244.015"},{"token":"IRON","received":"287.576"},{"token":"AURA","received":"3534.574"},{"token":"RESEARCH","received":"0.000"}]},"result_message":"Successful","dec_spent":0,"fragment_chance":0.19983158999999995,"fragment_roll":0.31147511158828667,"fragment_found":false,"kingdom_grain_cost":1000,"kingdom_type":"keep"},"balanceHistory":[]}}',
    success: true,
    error: null,
    created_date: "2026-10-11T02:51:33.000Z",
  },
  "1cbecee75485ef28b4277d30e4355993187cd4f7-1": {
    id: "1cbecee75485ef28b4277d30e4355993187cd4f7-1",
    type: "land_operation",
    player: "player",
    data: '{"op":"tax_collection","region_uid":"PR-LOP-58","deed_uids":["I-299-d6a3a5e54cb0ef"],"auto_buy_grain":false,"resource_symbol":"","app":"splinter-lands-next/1.39.2"}',
    result:
      '{"success":true,"result":{"success":true,"error":"","data":{"id":3497,"deed_uid":"I-299-d6a3a5e54cb0ef","plot_id":110791,"tract_number":8,"region_number":58,"elapsed_hours":165.755,"tokens":{"tokens":[{"token":"SPS","received":"23.391"},{"token":"GRAIN","received":"9552.333"},{"token":"WOOD","received":"0.000"},{"token":"STONE","received":"265.288"},{"token":"IRON","received":"1750.683"},{"token":"AURA","received":"795.931"},{"token":"RESEARCH","received":"0.000"}]},"result_message":"Successful","dec_spent":0,"fragment_chance":0.17404275,"fragment_roll":0.9347090918064401,"fragment_found":false,"kingdom_grain_cost":1000,"kingdom_type":"keep"},"balanceHistory":[]}}',
    success: true,
    error: null,
    created_date: "2026-10-11T02:51:33.000Z",
  },
  "1cbecee75485ef28b4277d30e4355993187cd4f7-2": {
    id: "1cbecee75485ef28b4277d30e4355993187cd4f7-2",
    type: "land_operation",
    player: "player",
    data: '{"op":"tax_collection","region_uid":"PR-WNE-90","deed_uids":["I-292-32f3dfb1bd95dd"],"auto_buy_grain":false,"resource_symbol":"","app":"splinter-lands-next/1.39.2"}',
    result:
      '{"success":true,"result":{"success":true,"error":"","data":{"id":4094,"deed_uid":"I-292-32f3dfb1bd95dd","plot_id":113947,"tract_number":8,"region_number":90,"elapsed_hours":165.568,"tokens":{"tokens":[{"token":"SPS","received":"20.697"},{"token":"GRAIN","received":"34545.318"},{"token":"WOOD","received":"0.000"},{"token":"STONE","received":"1629.902"},{"token":"IRON","received":"277.034"},{"token":"AURA","received":"2078.985"},{"token":"RESEARCH","received":"0.000"}]},"result_message":"Successful","dec_spent":0,"fragment_chance":0.19123104,"fragment_roll":0.21711195613940507,"fragment_found":false,"kingdom_grain_cost":1000,"kingdom_type":"keep"},"balanceHistory":[]}}',
    success: true,
    error: null,
    created_date: "2026-10-11T02:51:33.000Z",
  },
  "1cbecee75485ef28b4277d30e4355993187cd4f7-3": {
    id: "1cbecee75485ef28b4277d30e4355993187cd4f7-3",
    type: "land_operation",
    player: "player",
    data: '{"op":"tax_collection","region_uid":"PR-WNE-92","deed_uids":["I-302-049496eecf7eaa"],"auto_buy_grain":false,"resource_symbol":"","app":"splinter-lands-next/1.39.2"}',
    result:
      '{"success":true,"result":{"success":true,"error":"","data":{"id":2898,"deed_uid":"I-302-049496eecf7eaa","plot_id":114175,"tract_number":8,"region_number":92,"elapsed_hours":165.519,"tokens":{"tokens":[{"token":"SPS","received":"16.203"},{"token":"GRAIN","received":"37772.390"},{"token":"WOOD","received":"19996.412"},{"token":"STONE","received":"2507.489"},{"token":"IRON","received":"0.000"},{"token":"AURA","received":"0.000"},{"token":"RESEARCH","received":"0.000"}]},"result_message":"Successful","dec_spent":0,"fragment_chance":0.19117444500000003,"fragment_roll":0.7220968806022299,"fragment_found":false,"kingdom_grain_cost":1000,"kingdom_type":"keep"},"balanceHistory":[]}}',
    success: true,
    error: null,
    created_date: "2026-10-11T02:51:33.000Z",
  },
  "162a9d69a9ac11ce42eb21dcebb8505c31f1ae14": {
    id: "162a9d69a9ac11ce42eb21dcebb8505c31f1ae14",
    type: "land_operation",
    player: "player",
    data: '{"op":"tax_collection","region_uid":"PR-WNE-99","deed_uids":["I-294-76039598192420"],"auto_buy_grain":false,"resource_symbol":"","app":"splinter-lands-next/1.39.2"}',
    result:
      '{"success":true,"result":{"success":true,"error":"","data":{"id":3606,"deed_uid":"I-294-76039598192420","plot_id":114883,"tract_number":8,"region_number":99,"elapsed_hours":165.496,"tokens":{"tokens":[{"token":"SPS","received":"229.071"},{"token":"GRAIN","received":"14796.853"},{"token":"WOOD","received":"13052.044"},{"token":"STONE","received":"0.000"},{"token":"IRON","received":"2176.178"},{"token":"AURA","received":"3802.091"},{"token":"RESEARCH","received":"14.685"}]},"result_message":"Successful","dec_spent":0,"fragment_chance":0.21721350000000003,"fragment_roll":0.7892618234292731,"fragment_found":false,"kingdom_grain_cost":1000,"kingdom_type":"keep"},"balanceHistory":[]}}',
    success: true,
    error: null,
    created_date: "2026-10-11T02:51:36.000Z",
  },
  "162a9d69a9ac11ce42eb21dcebb8505c31f1ae14-1": {
    id: "162a9d69a9ac11ce42eb21dcebb8505c31f1ae14-1",
    type: "land_operation",
    player: "player",
    data: '{"op":"tax_collection","region_uid":"PR-PNW-5","deed_uids":["I-296-746dc23e1fbe01"],"auto_buy_grain":false,"resource_symbol":"","app":"splinter-lands-next/1.39.2"}',
    result:
      '{"success":true,"result":{"success":true,"error":"","data":{"id":3280,"deed_uid":"I-296-746dc23e1fbe01","plot_id":120497,"tract_number":9,"region_number":5,"elapsed_hours":165.793,"tokens":{"tokens":[{"token":"SPS","received":"0.000"},{"token":"GRAIN","received":"51615.781"},{"token":"WOOD","received":"7011.484"},{"token":"STONE","received":"618.576"},{"token":"IRON","received":"0.000"},{"token":"AURA","received":"1005.902"},{"token":"RESEARCH","received":"0.000"}]},"result_message":"Successful","dec_spent":0,"fragment_chance":0.17408265,"fragment_roll":0.1330209363389107,"fragment_type":"TOTEMFC","fragment_found":true,"kingdom_grain_cost":1000,"kingdom_type":"keep"},"balanceHistory":[]}}',
    success: true,
    error: null,
    created_date: "2026-10-11T02:51:36.000Z",
  },
  "162a9d69a9ac11ce42eb21dcebb8505c31f1ae14-2": {
    id: "162a9d69a9ac11ce42eb21dcebb8505c31f1ae14-2",
    type: "land_operation",
    player: "player",
    data: '{"op":"tax_collection","region_uid":"PR-LOP-50","deed_uids":["I-297-87d0ff5b8e2e6f"],"auto_buy_grain":false,"resource_symbol":"","app":"splinter-lands-next/1.39.2"}',
    result:
      '{"success":true,"result":{"success":true,"error":"","data":{"id":3720,"deed_uid":"I-297-87d0ff5b8e2e6f","plot_id":125000,"tract_number":9,"region_number":50,"elapsed_hours":165.773,"tokens":{"tokens":[{"token":"SPS","received":"0.000"},{"token":"GRAIN","received":"149232.467"},{"token":"WOOD","received":"9190.575"},{"token":"STONE","received":"0.000"},{"token":"IRON","received":"260.712"},{"token":"AURA","received":"628.082"},{"token":"RESEARCH","received":"0.000"}]},"result_message":"Successful","dec_spent":0,"fragment_chance":0.21757706250000003,"fragment_roll":0.7218969834526721,"fragment_found":false,"kingdom_grain_cost":1000,"kingdom_type":"keep"},"balanceHistory":[]}}',
    success: true,
    error: null,
    created_date: "2026-10-11T02:51:36.000Z",
  },
  "162a9d69a9ac11ce42eb21dcebb8505c31f1ae14-3": {
    id: "162a9d69a9ac11ce42eb21dcebb8505c31f1ae14-3",
    type: "land_operation",
    player: "player",
    data: '{"op":"tax_collection","region_uid":"PR-LOP-58","deed_uids":["I-302-f58504f084970a"],"auto_buy_grain":false,"resource_symbol":"","app":"splinter-lands-next/1.39.2"}',
    result:
      '{"success":true,"result":{"success":true,"error":"","data":{"id":3815,"deed_uid":"I-302-f58504f084970a","plot_id":125719,"tract_number":9,"region_number":58,"elapsed_hours":165.763,"tokens":{"tokens":[{"token":"SPS","received":"0.000"},{"token":"GRAIN","received":"0.000"},{"token":"WOOD","received":"32361.551"},{"token":"STONE","received":"1878.827"},{"token":"IRON","received":"347.997"},{"token":"AURA","received":"2026.821"},{"token":"RESEARCH","received":"0.000"}]},"result_message":"Successful","dec_spent":0,"fragment_chance":0.17405115,"fragment_roll":0.5588577838875806,"fragment_found":false,"kingdom_grain_cost":1000,"kingdom_type":"keep"},"balanceHistory":[]}}',
    success: true,
    error: null,
    created_date: "2026-10-11T02:51:36.000Z",
  },
  c197db0b9646261c0f457bd11f401fbc8fa88f14: {
    id: "c197db0b9646261c0f457bd11f401fbc8fa88f14",
    type: "land_operation",
    player: "player",
    data: '{"op":"tax_collection","region_uid":"PR-CEF-74","deed_uids":["I-292-87d5161da13ed5"],"auto_buy_grain":false,"resource_symbol":"","app":"splinter-lands-next/1.39.2"}',
    result:
      '{"success":true,"result":{"success":true,"error":"","data":{"id":3976,"deed_uid":"I-292-87d5161da13ed5","plot_id":127376,"tract_number":9,"region_number":74,"elapsed_hours":165.678,"tokens":{"tokens":[{"token":"SPS","received":"13.371"},{"token":"GRAIN","received":"52560.653"},{"token":"WOOD","received":"0.000"},{"token":"STONE","received":"4540.327"},{"token":"IRON","received":"140.029"},{"token":"AURA","received":"0.000"},{"token":"RESEARCH","received":"0.000"}]},"result_message":"Successful","dec_spent":0,"fragment_chance":0.18787885199999999,"fragment_roll":0.23945234096220624,"fragment_found":false,"kingdom_grain_cost":1000,"kingdom_type":"keep"},"balanceHistory":[]}}',
    success: true,
    error: null,
    created_date: "2026-10-11T02:51:42.000Z",
  },
  "c197db0b9646261c0f457bd11f401fbc8fa88f14-1": {
    id: "c197db0b9646261c0f457bd11f401fbc8fa88f14-1",
    type: "land_operation",
    player: "player",
    data: '{"op":"tax_collection","region_uid":"PR-WNE-92","deed_uids":["I-290-9ee35f5613507e"],"auto_buy_grain":false,"resource_symbol":"","app":"splinter-lands-next/1.39.2"}',
    result:
      '{"success":true,"result":{"success":true,"error":"","data":{"id":3071,"deed_uid":"I-290-9ee35f5613507e","plot_id":129190,"tract_number":9,"region_number":92,"elapsed_hours":165.518,"tokens":{"tokens":[{"token":"SPS","received":"20.561"},{"token":"GRAIN","received":"9541.722"},{"token":"WOOD","received":"0.000"},{"token":"STONE","received":"2491.450"},{"token":"IRON","received":"460.123"},{"token":"AURA","received":"195.304"},{"token":"RESEARCH","received":"0.000"}]},"result_message":"Successful","dec_spent":0,"fragment_chance":0.1737939,"fragment_roll":0.8408500197069061,"fragment_found":false,"kingdom_grain_cost":1000,"kingdom_type":"keep"},"balanceHistory":[]}}',
    success: true,
    error: null,
    created_date: "2026-10-11T02:51:42.000Z",
  },
  "c197db0b9646261c0f457bd11f401fbc8fa88f14-2": {
    id: "c197db0b9646261c0f457bd11f401fbc8fa88f14-2",
    type: "land_operation",
    player: "player",
    data: '{"op":"tax_collection","region_uid":"PR-SHC-133","deed_uids":["I-297-794d0a0b859df0"],"auto_buy_grain":false,"resource_symbol":"","app":"splinter-lands-next/1.39.2"}',
    result:
      '{"success":true,"result":{"success":true,"error":"","data":{"id":3284,"deed_uid":"I-297-794d0a0b859df0","plot_id":133263,"tract_number":9,"region_number":133,"elapsed_hours":165.412,"tokens":{"tokens":[{"token":"SPS","received":"68.117"},{"token":"GRAIN","received":"72677.952"},{"token":"WOOD","received":"7447.921"},{"token":"STONE","received":"0.000"},{"token":"IRON","received":"0.000"},{"token":"AURA","received":"2610.210"},{"token":"RESEARCH","received":"0.000"}]},"result_message":"Successful","dec_spent":0,"fragment_chance":0.1736826,"fragment_roll":0.6273351220329447,"fragment_found":false,"kingdom_grain_cost":1000,"kingdom_type":"keep"},"balanceHistory":[]}}',
    success: true,
    error: null,
    created_date: "2026-10-11T02:51:42.000Z",
  },
  "c197db0b9646261c0f457bd11f401fbc8fa88f14-3": {
    id: "c197db0b9646261c0f457bd11f401fbc8fa88f14-3",
    type: "land_operation",
    player: "player",
    data: '{"op":"tax_collection","region_uid":"PR-PNW-5","deed_uids":["I-296-1157a2b360b4c9"],"auto_buy_grain":false,"resource_symbol":"","app":"splinter-lands-next/1.39.2"}',
    result:
      '{"success":true,"result":{"success":true,"error":"","data":{"id":3282,"deed_uid":"I-296-1157a2b360b4c9","plot_id":135485,"tract_number":10,"region_number":5,"elapsed_hours":165.791,"tokens":{"tokens":[{"token":"SPS","received":"162.301"},{"token":"GRAIN","received":"16645.424"},{"token":"WOOD","received":"14606.990"},{"token":"STONE","received":"0.000"},{"token":"IRON","received":"0.000"},{"token":"AURA","received":"0.000"},{"token":"RESEARCH","received":"0.000"}]},"result_message":"Successful","dec_spent":0,"fragment_chance":0.17408055,"fragment_roll":0.920708024795921,"fragment_found":false,"kingdom_grain_cost":1000,"kingdom_type":"keep"},"balanceHistory":[]}}',
    success: true,
    error: null,
    created_date: "2026-10-11T02:51:42.000Z",
  },
  "600a716355df13d3e8ea5cb9d52c598179cde7b9": {
    id: "600a716355df13d3e8ea5cb9d52c598179cde7b9",
    type: "land_operation",
    player: "player",
    data: '{"op":"tax_collection","region_uid":"PR-LOP-58","deed_uids":["I-299-0791fff1c8adce"],"auto_buy_grain":false,"resource_symbol":"","app":"splinter-lands-next/1.39.2"}',
    result:
      '{"success":true,"result":{"success":true,"error":"","data":{"id":3503,"deed_uid":"I-299-0791fff1c8adce","plot_id":140714,"tract_number":10,"region_number":58,"elapsed_hours":165.763,"tokens":{"tokens":[{"token":"SPS","received":"67.423"},{"token":"GRAIN","received":"42661.623"},{"token":"WOOD","received":"13501.434"},{"token":"STONE","received":"1892.155"},{"token":"IRON","received":"0.000"},{"token":"AURA","received":"1809.887"},{"token":"RESEARCH","received":"0.000"}]},"result_message":"Successful","dec_spent":0,"fragment_chance":0.21756393750000003,"fragment_roll":0.6384752981784387,"fragment_found":false,"kingdom_grain_cost":1000,"kingdom_type":"keep"},"balanceHistory":[]}}',
    success: true,
    error: null,
    created_date: "2026-10-11T02:51:48.000Z",
  },
  "600a716355df13d3e8ea5cb9d52c598179cde7b9-1": {
    id: "600a716355df13d3e8ea5cb9d52c598179cde7b9-1",
    type: "land_operation",
    player: "player",
    data: '{"op":"tax_collection","region_uid":"PR-CEF-74","deed_uids":["I-290-ad77871542a738"],"auto_buy_grain":false,"resource_symbol":"","app":"splinter-lands-next/1.39.2"}',
    result:
      '{"success":true,"result":{"success":true,"error":"","data":{"id":4073,"deed_uid":"I-290-ad77871542a738","plot_id":142383,"tract_number":10,"region_number":74,"elapsed_hours":165.691,"tokens":{"tokens":[{"token":"SPS","received":"37.657"},{"token":"GRAIN","received":"117476.724"},{"token":"WOOD","received":"0.000"},{"token":"STONE","received":"3056.454"},{"token":"IRON","received":"555.329"},{"token":"AURA","received":"0.000"},{"token":"RESEARCH","received":"0.000"}]},"result_message":"Successful","dec_spent":0,"fragment_chance":0.191373105,"fragment_roll":0.2942987917565118,"fragment_found":false,"kingdom_grain_cost":1000,"kingdom_type":"keep"},"balanceHistory":[]}}',
    success: true,
    error: null,
    created_date: "2026-10-11T02:51:48.000Z",
  },
  "600a716355df13d3e8ea5cb9d52c598179cde7b9-2": {
    id: "600a716355df13d3e8ea5cb9d52c598179cde7b9-2",
    type: "land_operation",
    player: "player",
    data: '{"op":"tax_collection","region_uid":"PR-WNE-90","deed_uids":["I-292-8eaec2c71a81a9"],"auto_buy_grain":false,"resource_symbol":"","app":"splinter-lands-next/1.39.2"}',
    result:
      '{"success":true,"result":{"success":true,"error":"","data":{"id":4101,"deed_uid":"I-292-8eaec2c71a81a9","plot_id":143950,"tract_number":10,"region_number":90,"elapsed_hours":165.597,"tokens":{"tokens":[{"token":"SPS","received":"0.000"},{"token":"GRAIN","received":"54599.125"},{"token":"WOOD","received":"466.560"},{"token":"STONE","received":"1526.925"},{"token":"IRON","received":"362.850"},{"token":"AURA","received":"561.993"},{"token":"RESEARCH","received":"0.000"}]},"result_message":"Successful","dec_spent":0,"fragment_chance":0.17387685,"fragment_roll":0.4836066772842706,"fragment_found":false,"kingdom_grain_cost":1000,"kingdom_type":"keep"},"balanceHistory":[]}}',
    success: true,
    error: null,
    created_date: "2026-10-11T02:51:48.000Z",
  },
  "600a716355df13d3e8ea5cb9d52c598179cde7b9-3": {
    id: "600a716355df13d3e8ea5cb9d52c598179cde7b9-3",
    type: "land_operation",
    player: "player",
    data: '{"op":"tax_collection","region_uid":"PR-WNE-92","deed_uids":["I-302-b2356260d2b411"],"auto_buy_grain":false,"resource_symbol":"","app":"splinter-lands-next/1.39.2"}',
    result:
      '{"success":true,"result":{"success":true,"error":"","data":{"id":3144,"deed_uid":"I-302-b2356260d2b411","plot_id":144138,"tract_number":10,"region_number":92,"elapsed_hours":165.516,"tokens":{"tokens":[{"token":"SPS","received":"14.119"},{"token":"GRAIN","received":"35725.369"},{"token":"WOOD","received":"0.000"},{"token":"STONE","received":"2117.198"},{"token":"IRON","received":"0.000"},{"token":"AURA","received":"0.000"},{"token":"RESEARCH","received":"0.000"}]},"result_message":"Successful","dec_spent":0,"fragment_chance":0.19812265199999998,"fragment_roll":0.5898892326475157,"fragment_found":false,"kingdom_grain_cost":1000,"kingdom_type":"keep"},"balanceHistory":[]}}',
    success: true,
    error: null,
    created_date: "2026-10-11T02:51:48.000Z",
  },
  "39100f4fceb3b14cf0decfee7c4c3361766a3170": {
    id: "39100f4fceb3b14cf0decfee7c4c3361766a3170",
    type: "land_operation",
    player: "player",
    data: '{"op":"tax_collection","region_uid":"PR-LOP-58","deed_uids":["I-298-2f45bdb1465b6c"],"auto_buy_grain":false,"resource_symbol":"","app":"splinter-lands-next/1.39.2"}',
    result:
      '{"success":true,"result":{"success":true,"error":"","data":{"id":2796,"deed_uid":"I-298-2f45bdb1465b6c","plot_id":5767,"tract_number":1,"region_number":58,"elapsed_hours":165.733,"tokens":{"tokens":[{"token":"SPS","received":"391.783"},{"token":"GRAIN","received":"295053.379"},{"token":"WOOD","received":"21787.190"},{"token":"STONE","received":"19660.747"},{"token":"IRON","received":"2665.261"},{"token":"AURA","received":"4852.610"},{"token":"RESEARCH","received":"0.000"}]},"result_message":"Successful","dec_spent":0,"fragment_chance":0.87009825,"fragment_roll":0.416109655818627,"fragment_type":"TOTEMFR","fragment_found":true,"kingdom_grain_cost":10000,"kingdom_type":"castle"},"balanceHistory":[]}}',
    success: true,
    error: null,
    created_date: "2026-10-11T02:51:51.000Z",
  },
  "39100f4fceb3b14cf0decfee7c4c3361766a3170-1": {
    id: "39100f4fceb3b14cf0decfee7c4c3361766a3170-1",
    type: "land_operation",
    player: "player",
    data: '{"op":"tax_collection","region_uid":"PR-WNE-92","deed_uids":["I-302-b1a08554c12358"],"auto_buy_grain":false,"resource_symbol":"","app":"splinter-lands-next/1.39.2"}',
    result:
      '{"success":true,"result":{"success":true,"error":"","data":{"id":2838,"deed_uid":"I-302-b1a08554c12358","plot_id":39184,"tract_number":3,"region_number":92,"elapsed_hours":165.513,"tokens":{"tokens":[{"token":"SPS","received":"239.794"},{"token":"GRAIN","received":"223057.690"},{"token":"WOOD","received":"30584.399"},{"token":"STONE","received":"11404.405"},{"token":"IRON","received":"1829.079"},{"token":"AURA","received":"2595.154"},{"token":"RESEARCH","received":"52.387"}]},"result_message":"Successful","dec_spent":0,"fragment_chance":0.86894325,"fragment_roll":0.9148216486506626,"fragment_found":false,"kingdom_grain_cost":10000,"kingdom_type":"castle"},"balanceHistory":[]}}',
    success: true,
    error: null,
    created_date: "2026-10-11T02:51:51.000Z",
  },
  "39100f4fceb3b14cf0decfee7c4c3361766a3170-2": {
    id: "39100f4fceb3b14cf0decfee7c4c3361766a3170-2",
    type: "land_operation",
    player: "player",
    data: '{"op":"tax_collection","region_uid":"PR-CEF-74","deed_uids":["I-298-08b3b7888f8360"],"auto_buy_grain":false,"resource_symbol":"","app":"splinter-lands-next/1.39.2"}',
    result:
      '{"success":true,"result":{"success":true,"error":"","data":{"id":2820,"deed_uid":"I-298-08b3b7888f8360","plot_id":112323,"tract_number":8,"region_number":74,"elapsed_hours":165.608,"tokens":{"tokens":[{"token":"SPS","received":"133.982"},{"token":"GRAIN","received":"183816.378"},{"token":"WOOD","received":"29516.731"},{"token":"STONE","received":"10080.873"},{"token":"IRON","received":"3729.758"},{"token":"AURA","received":"3496.999"},{"token":"RESEARCH","received":"0.000"}]},"result_message":"Successful","dec_spent":0,"fragment_chance":0.869442,"fragment_roll":0.3828284437572398,"fragment_type":"TOTEMFR","fragment_found":true,"kingdom_grain_cost":10000,"kingdom_type":"castle"},"balanceHistory":[]}}',
    success: true,
    error: null,
    created_date: "2026-10-11T02:51:51.000Z",
  },
  "39100f4fceb3b14cf0decfee7c4c3361766a3170-3": {
    id: "39100f4fceb3b14cf0decfee7c4c3361766a3170-3",
    type: "land_operation",
    player: "player",
    data: '{"op":"tax_collection","region_uid":"PR-WNE-90","deed_uids":["I-298-f18c7e52ef07a8"],"auto_buy_grain":false,"resource_symbol":"","app":"splinter-lands-next/1.39.2"}',
    result:
      '{"success":true,"result":{"success":true,"error":"","data":{"id":2836,"deed_uid":"I-298-f18c7e52ef07a8","plot_id":128962,"tract_number":9,"region_number":90,"elapsed_hours":165.57,"tokens":{"tokens":[{"token":"SPS","received":"240.680"},{"token":"GRAIN","received":"204532.526"},{"token":"WOOD","received":"25579.608"},{"token":"STONE","received":"12580.950"},{"token":"IRON","received":"2441.653"},{"token":"AURA","received":"2584.994"},{"token":"RESEARCH","received":"2.792"}]},"result_message":"Successful","dec_spent":0,"fragment_chance":0.8692424999999999,"fragment_roll":0.23297242061299753,"fragment_type":"TOTEMFE","fragment_found":true,"kingdom_grain_cost":10000,"kingdom_type":"castle"},"balanceHistory":[]}}',
    success: true,
    error: null,
    created_date: "2026-10-11T02:51:51.000Z",
  },
};
