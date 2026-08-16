import { OWNER_GAMEPLAY_CATEGORY_CODES } from '../categories/initial-taxonomy';
import {
  OWNER_CATEGORY_QUESTION_PACK,
  validateOwnerCategoryQuestionPack,
} from './owner-category-question-pack';

describe('owner category question pack', () => {
  it('conține câte trei întrebări valide pentru toate cele 20 de categorii', () => {
    expect(() => validateOwnerCategoryQuestionPack()).not.toThrow();
    expect(OWNER_CATEGORY_QUESTION_PACK).toHaveLength(60);
    expect(
      new Set(
        OWNER_CATEGORY_QUESTION_PACK.map((question) => question.categoryCode),
      ),
    ).toEqual(new Set(OWNER_GAMEPLAY_CATEGORY_CODES));
  });
});
