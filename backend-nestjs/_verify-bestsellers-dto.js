"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const decoration_config_dto_1 = require("./src/features/shop/dto/decoration-config.dto");
function check(label, payload, expectValid) {
    const dto = (0, class_transformer_1.plainToInstance)(decoration_config_dto_1.DecorationConfigDto, payload);
    const errors = (0, class_validator_1.validateSync)(dto, {
        whitelist: true,
        forbidNonWhitelisted: true,
    });
    const valid = errors.length === 0;
    const pass = valid === expectValid;
    console.log(`${pass ? 'PASS' : 'FAIL'} — ${label}: valid=${valid} (expected ${expectValid})`);
    if (!valid && expectValid) {
        console.log('   errors:', JSON.stringify(errors.map((e) => ({ p: e.property, c: e.constraints, children: e.children }))));
    }
    return pass;
}
const base = (data) => ({
    version: 1,
    blocks: [{ id: 'blk-best-1', type: 'best_sellers', data }],
});
let ok = true;
ok = check('best_sellers limit=4 (valid → 200)', base({ title: 'Featured', limit: 4, columns: 4 }), true) && ok;
ok = check('best_sellers limit=8', base({ limit: 8, columns: 3 }), true) && ok;
ok = check('best_sellers limit=12', base({ limit: 12 }), true) && ok;
ok = check('best_sellers empty data (all optional)', base({}), true) && ok;
ok = check('best_sellers limit=5 (invalid → 422)', base({ limit: 5 }), false) && ok;
ok = check('best_sellers columns=5 (invalid)', base({ columns: 5 }), false) && ok;
ok = check('best_sellers extra field (forbidNonWhitelisted)', base({ product_ids: [1, 2] }), false) && ok;
ok = check('best_sellers title >80 chars (invalid)', base({ title: 'x'.repeat(81) }), false) && ok;
console.log(ok ? '\nALL PASS' : '\nSOME FAILED');
process.exit(ok ? 0 : 1);
//# sourceMappingURL=_verify-bestsellers-dto.js.map